<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->integer('inventory')->default(0);
            $table->string('image')->nullable();
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->enum('pricing_method', ['unit', 'weight', 'consumption'])->default('unit');
            $table->string('unit_label')->default('u');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('company_id');
            $table->index(['company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};















