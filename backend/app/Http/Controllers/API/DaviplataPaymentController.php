<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\DaviplataApiService;
use App\Models\Company;
use App\Models\DigitalPaymentConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DaviplataPaymentController extends Controller
{
    protected $daviplataService;

    public function __construct(DaviplataApiService $daviplataService)
    {
        $this->daviplataService = $daviplataService;
    }

    /**
     * Generar código QR de pago Daviplata
     */
    public function generateQR(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $request->user();
            $company = Company::find($user->company_id);

            if (!$company) {
                return response()->json(['error' => 'Empresa no encontrada'], 404);
            }

            // Obtener configuración de Daviplata
            $config = DigitalPaymentConfig::where('company_id', $user->company_id)
                ->where('payment_provider', 'daviplata')
                ->where('is_active', true)
                ->first();

            if (!$config) {
                return response()->json([
                    'error' => 'Configuración de Daviplata no encontrada',
                    'message' => 'Por favor configure Daviplata en la sección de Configuración de Pagos Digitales'
                ], 400);
            }

            $amount = $request->amount;
            $reference = $request->reference ?: 'VENTA-' . time();

            $result = $this->daviplataService->generatePaymentQR(
                $config,
                $amount,
                $reference
            );

            if ($result['success']) {
                return response()->json($result);
            } else {
                return response()->json($result, 500);
            }
        } catch (\Exception $e) {
            Log::error('Error al generar QR de Daviplata', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al generar código QR',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar estado de un pago
     */
    public function checkStatus(Request $request, $reference)
    {
        try {
            $result = $this->daviplataService->checkPaymentStatus($reference);
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error al verificar estado de pago Daviplata', [
                'error' => $e->getMessage(),
                'reference' => $reference,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al verificar estado del pago',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}

