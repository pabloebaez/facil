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
        Schema::create('purchase_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->onDelete('cascade');
            $table->foreignId('tax_id')->constrained()->onDelete('restrict');
            $table->decimal('tax_base', 10, 2); // Base imponible
            $table->decimal('tax_rate', 5, 2); // Porcentaje del impuesto
            $table->decimal('tax_amount', 10, 2); // Monto del impuesto
            $table->timestamps();
            
            $table->index('purchase_id');
            $table->index('tax_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_taxes');
    }
};







