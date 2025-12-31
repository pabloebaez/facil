<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->enum('billing_cycle', ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannually', 'annually'])->default('monthly');
            $table->date('start_date');
            $table->date('next_due_date')->nullable();
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->timestamps();
            
            $table->index('company_id');
            $table->index('customer_id');
            $table->index('next_due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_services');
    }
};















