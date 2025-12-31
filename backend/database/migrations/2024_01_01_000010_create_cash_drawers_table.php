<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_drawers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('initial_amount', 10, 2)->default(0);
            $table->decimal('sales_total', 10, 2)->default(0);
            $table->decimal('returns_total', 10, 2)->default(0);
            $table->decimal('expenses_total', 10, 2)->default(0);
            $table->decimal('current_amount', 10, 2)->default(0);
            $table->boolean('is_closed')->default(false);
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            
            $table->unique(['company_id', 'date', 'user_id']);
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_drawers');
    }
};















