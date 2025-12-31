<?php

namespace App\Services;

use App\Models\TicketNumbering;
use Illuminate\Support\Facades\DB;

class TicketNumberingService
{
    /**
     * Generar el siguiente número de ticket
     */
    public function generateTicketNumber(int $companyId, string $prefix = 'TKT'): string
    {
        return DB::transaction(function () use ($companyId, $prefix) {
            $ticketNumbering = TicketNumbering::firstOrCreate(
                ['company_id' => $companyId],
                [
                    'prefix' => $prefix,
                    'current_number' => 0,
                ]
            );

            // Si el prefijo cambió, actualizarlo
            if ($ticketNumbering->prefix !== $prefix) {
                $ticketNumbering->prefix = $prefix;
                $ticketNumbering->save();
            }

            return $ticketNumbering->getNextNumber();
        });
    }
}














