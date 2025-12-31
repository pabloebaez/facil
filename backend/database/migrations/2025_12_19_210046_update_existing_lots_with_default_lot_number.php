<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar todos los lotes que tienen lot_number null o vacío a "Lote Inicial"
        DB::table('product_lots')
            ->whereNull('lot_number')
            ->orWhere('lot_number', '')
            ->update(['lot_number' => 'Lote Inicial']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir: establecer lot_number a null para los que tienen "Lote Inicial"
        // Solo si no hay otros lotes con el mismo producto que tengan "Lote Inicial"
        // Por seguridad, no revertimos automáticamente para evitar pérdida de datos
    }
};
