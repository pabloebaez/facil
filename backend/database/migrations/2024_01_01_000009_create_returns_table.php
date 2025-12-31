<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('return_number');
            $table->unique(['company_id', 'return_number']); // Único por empresa
            $table->string('document_type')->default('credit_note'); // credit_note o debit_note
            $table->string('authorization_number')->nullable(); // Número de autorización DIAN del rango usado
            $table->decimal('total_returned', 10, 2);
            $table->text('reason')->nullable();
            $table->timestamps();
            
            $table->index('company_id');
            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};

