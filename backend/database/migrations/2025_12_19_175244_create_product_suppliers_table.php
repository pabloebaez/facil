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
        Schema::create('product_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->decimal('last_purchase_price', 10, 2)->nullable(); // Último precio de compra
            $table->date('last_purchase_date')->nullable(); // Fecha de última compra
            $table->boolean('is_preferred')->default(false); // Proveedor preferido para este producto
            $table->timestamps();

            // Un producto puede tener el mismo proveedor solo una vez
            $table->unique(['product_id', 'supplier_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_suppliers');
    }
};
