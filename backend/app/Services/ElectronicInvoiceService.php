<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Company;
use App\Models\DianProviderConfig;
use App\Services\XmlUblGenerator;
use App\Services\XmlSignerService;
use App\Services\DianApiService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ElectronicInvoiceService
{
    protected $xmlGenerator;
    protected $xmlSigner;
    protected $dianApi;

    public function __construct(
        XmlUblGenerator $xmlGenerator,
        XmlSignerService $xmlSigner,
        DianApiService $dianApi
    ) {
        $this->xmlGenerator = $xmlGenerator;
        $this->xmlSigner = $xmlSigner;
        $this->dianApi = $dianApi;
    }

    /**
     * Procesar facturación electrónica para una venta
     */
    public function processElectronicInvoice(Sale $sale): array
    {
        try {
            $company = $sale->company;
            $providerConfig = $this->getActiveProviderConfig($company->id);

            if (!$providerConfig) {
                throw new \Exception('No hay configuración activa de proveedor DIAN para esta empresa');
            }

            // 1. Generar XML UBL 2.1
            $xmlContent = $this->xmlGenerator->generate($sale);
            $xmlPath = $this->saveXml($sale, $xmlContent, 'generated');

            // 2. Firmar XML
            $signedXmlContent = $this->xmlSigner->sign($xmlContent, $providerConfig);
            $signedXmlPath = $this->saveXml($sale, $signedXmlContent, 'signed');

            // 3. Enviar a DIAN
            $dianResponse = $this->dianApi->sendInvoice($signedXmlContent, $providerConfig);

            // 4. Actualizar venta con información DIAN
            $sale->update([
                'document_type' => 'electronic_invoice',
                'xml_path' => $xmlPath,
                'signed_xml_path' => $signedXmlPath,
                'dian_status' => $dianResponse['status'] ?? 'pending',
                'dian_response' => json_encode($dianResponse),
                'dian_sent_at' => now(),
            ]);

            // Si hay CUFE en la respuesta, guardarlo
            if (isset($dianResponse['cufe'])) {
                $sale->update(['cufe' => $dianResponse['cufe']]);
            }

            // Si hay acuse, guardarlo
            if (isset($dianResponse['acuse'])) {
                $sale->update(['dian_acuse' => $dianResponse['acuse']]);
            }

            // Si hay errores, guardarlos
            if (isset($dianResponse['errors']) && !empty($dianResponse['errors'])) {
                $sale->update([
                    'dian_errors' => $dianResponse['errors'],
                    'dian_status' => 'rejected',
                    'dian_response_at' => now(),
                ]);
            } else if ($dianResponse['status'] === 'accepted') {
                $sale->update(['dian_response_at' => now()]);
            }

            return [
                'success' => true,
                'cufe' => $dianResponse['cufe'] ?? null,
                'status' => $dianResponse['status'] ?? 'pending',
                'message' => $dianResponse['message'] ?? 'Factura enviada a DIAN',
            ];

        } catch (\Exception $e) {
            Log::error('Error al procesar facturación electrónica', [
                'sale_id' => $sale->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Actualizar venta con error
            $sale->update([
                'document_type' => 'electronic_invoice',
                'dian_status' => 'rejected',
                'dian_errors' => [
                    [
                        'code' => 'PROCESSING_ERROR',
                        'message' => $e->getMessage(),
                    ]
                ],
                'dian_response_at' => now(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtener configuración activa del proveedor DIAN
     */
    protected function getActiveProviderConfig(int $companyId): ?DianProviderConfig
    {
        return DianProviderConfig::where('company_id', $companyId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Guardar XML en almacenamiento
     */
    protected function saveXml(Sale $sale, string $xmlContent, string $type): string
    {
        $directory = "invoices/{$sale->company_id}/{$sale->id}";
        $filename = "{$type}_{$sale->sale_number}.xml";
        $path = "{$directory}/{$filename}";

        Storage::disk('local')->put($path, $xmlContent);

        return $path;
    }

    /**
     * Consultar estado de una factura en DIAN
     */
    public function checkInvoiceStatus(Sale $sale): array
    {
        try {
            $providerConfig = $this->getActiveProviderConfig($sale->company_id);

            if (!$providerConfig) {
                throw new \Exception('No hay configuración activa de proveedor DIAN');
            }

            $status = $this->dianApi->checkStatus($sale->cufe ?? $sale->sale_number, $providerConfig);

            $sale->update([
                'dian_status' => $status['status'] ?? $sale->dian_status,
                'dian_response' => json_encode($status),
                'dian_response_at' => now(),
            ]);

            if (isset($status['errors']) && !empty($status['errors'])) {
                $sale->update(['dian_errors' => $status['errors']]);
            }

            return $status;

        } catch (\Exception $e) {
            Log::error('Error al consultar estado DIAN', [
                'sale_id' => $sale->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}














