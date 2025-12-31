<?php

namespace App\Services;

use App\Models\DocumentNumberingRange;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DocumentNumberingService
{
    /**
     * Obtener o crear el rango activo para un tipo de documento
     */
    public function getActiveRange(int $companyId, string $documentType): DocumentNumberingRange
    {
        $today = now()->toDateString();

        $range = DocumentNumberingRange::where('company_id', $companyId)
            ->where('document_type', $documentType)
            ->where('is_active', true)
            ->whereDate('valid_from', '<=', $today)
            ->whereDate('valid_to', '>=', $today)
            ->first();

        if (!$range) {
            // Si no hay rango activo, crear uno por defecto (para desarrollo/pruebas)
            // En producción, esto debería requerir configuración previa
            Log::warning("No se encontró rango activo para {$documentType} en empresa {$companyId}. Creando rango por defecto.");
            
            $range = $this->createDefaultRange($companyId, $documentType);
        }

        return $range;
    }

    /**
     * Generar el siguiente número de documento según DIAN
     */
    public function generateDocumentNumber(int $companyId, string $documentType): string
    {
        return DB::transaction(function () use ($companyId, $documentType) {
            $range = $this->getActiveRange($companyId, $documentType);
            $number = $range->getNextNumber();
            $range->incrementNumber();
            
            return $number;
        });
    }

    /**
     * Crear un rango por defecto (solo para desarrollo/pruebas)
     * En producción, los rangos deben ser creados manualmente con autorización DIAN
     */
    private function createDefaultRange(int $companyId, string $documentType): DocumentNumberingRange
    {
        $prefixes = [
            'invoice' => 'FAC',
            'credit_note' => 'NC',
            'debit_note' => 'ND',
        ];

        $prefix = $prefixes[$documentType] ?? 'DOC';

        return DocumentNumberingRange::create([
            'company_id' => $companyId,
            'document_type' => $documentType,
            'prefix' => $prefix,
            'authorization_number' => 'AUTO-' . now()->format('YmdHis'),
            'authorization_date' => now(),
            'valid_from' => now()->startOfYear(),
            'valid_to' => now()->endOfYear()->addYear(10), // 10 años de vigencia por defecto
            'range_from' => 1,
            'range_to' => 99999999, // Rango amplio para desarrollo
            'current_number' => 0,
            'is_active' => true,
            'notes' => 'Rango creado automáticamente para desarrollo. En producción debe ser autorizado por DIAN.',
        ]);
    }

    /**
     * Crear un rango autorizado por DIAN
     */
    public function createAuthorizedRange(
        int $companyId,
        string $documentType,
        string $authorizationNumber,
        string $prefix = null,
        int $rangeFrom = 1,
        int $rangeTo = 99999999,
        ?\DateTime $authorizationDate = null,
        ?\DateTime $validFrom = null,
        ?\DateTime $validTo = null
    ): DocumentNumberingRange {
        return DocumentNumberingRange::create([
            'company_id' => $companyId,
            'document_type' => $documentType,
            'prefix' => $prefix,
            'authorization_number' => $authorizationNumber,
            'authorization_date' => $authorizationDate ?? now(),
            'valid_from' => $validFrom ?? now(),
            'valid_to' => $validTo ?? now()->addYear(1),
            'range_from' => $rangeFrom,
            'range_to' => $rangeTo,
            'current_number' => $rangeFrom - 1, // Inicia en el número anterior al primero
            'is_active' => true,
        ]);
    }
}















