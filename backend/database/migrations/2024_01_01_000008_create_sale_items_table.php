<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('product_name');
            $table->decimal('price', 10, 2);
            $table->integer('quantity')->nullable();
            $table->decimal('weight', 10, 3)->nullable();
            $table->string('unit_label')->nullable();
            $table->enum('pricing_method', ['unit', 'weight', 'consumption'])->default('unit');
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
            
            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};















