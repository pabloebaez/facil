<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->string('sale_number');
            $table->unique(['company_id', 'sale_number']); // Único por empresa
            $table->decimal('subtotal', 10, 2);
            $table->decimal('total_discount_amount', 10, 2)->default(0);
            $table->decimal('subtotal_after_discounts', 10, 2);
            $table->decimal('total_tax_amount', 10, 2)->default(0);
            $table->decimal('final_total', 10, 2);
            $table->json('tax_breakdown_details')->nullable();
            $table->timestamps();
            
            $table->index('company_id');
            $table->index(['company_id', 'created_at']);
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};

