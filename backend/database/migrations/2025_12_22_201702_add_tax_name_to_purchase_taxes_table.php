<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_taxes', function (Blueprint $table) {
            // Hacer tax_id nullable para permitir impuestos personalizados
            $table->foreignId('tax_id')->nullable()->change();
            // Agregar campo tax_name para impuestos personalizados
            $table->string('tax_name')->nullable()->after('tax_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_taxes', function (Blueprint $table) {
            // Eliminar tax_name
            $table->dropColumn('tax_name');
            // Revertir tax_id a NOT NULL (requiere eliminar y recrear la foreign key)
            $table->foreignId('tax_id')->nullable(false)->change();
        });
    }
};
