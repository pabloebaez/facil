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
        Schema::create('product_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('purchase_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('purchase_item_id')->nullable()->constrained('purchase_items')->onDelete('set null');
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            
            // Información del lote
            $table->string('lot_number')->nullable(); // Número de lote opcional
            $table->decimal('quantity', 10, 2); // Cantidad inicial del lote
            $table->decimal('remaining_quantity', 10, 2); // Cantidad restante disponible
            $table->decimal('unit_cost', 10, 2); // Costo unitario de compra (precio original)
            $table->date('entry_date'); // Fecha de entrada al inventario
            $table->date('expiration_date')->nullable(); // Fecha de vencimiento (opcional)
            
            // Metadatos
            $table->text('notes')->nullable(); // Notas adicionales del lote
            
            $table->timestamps();
            
            // Índices para optimizar consultas FIFO
            $table->index(['product_id', 'entry_date', 'remaining_quantity']);
            $table->index(['company_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_lots');
    }
};
