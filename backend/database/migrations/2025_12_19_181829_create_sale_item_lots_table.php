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
        Schema::create('sale_item_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->foreignId('sale_item_id')->constrained('sale_items')->onDelete('cascade');
            $table->foreignId('product_lot_id')->constrained('product_lots')->onDelete('cascade');
            
            // Cantidad vendida de este lote específico
            $table->decimal('quantity', 10, 2);
            
            // Costo unitario del lote (para cálculo de costo de venta)
            $table->decimal('unit_cost', 10, 2);
            
            // Costo total de esta cantidad vendida
            $table->decimal('total_cost', 10, 2);
            
            $table->timestamps();
            
            // Índices
            $table->index(['sale_id']);
            $table->index(['sale_item_id']);
            $table->index(['product_lot_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_item_lots');
    }
};
