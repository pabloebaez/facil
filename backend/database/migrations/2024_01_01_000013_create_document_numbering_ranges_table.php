<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_numbering_ranges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->enum('document_type', ['invoice', 'credit_note', 'debit_note']); // Factura, Nota Crédito, Nota Débito
            $table->string('prefix', 4)->nullable(); // Prefijo hasta 4 caracteres alfanuméricos
            $table->string('authorization_number', 50); // Número de autorización DIAN
            $table->date('authorization_date'); // Fecha de autorización
            $table->date('valid_from'); // Fecha de inicio de vigencia
            $table->date('valid_to'); // Fecha de fin de vigencia
            $table->bigInteger('range_from'); // Número inicial del rango
            $table->bigInteger('range_to'); // Número final del rango
            $table->bigInteger('current_number')->default(0); // Último número usado
            $table->boolean('is_active')->default(true); // Si el rango está activo
            $table->text('notes')->nullable(); // Notas adicionales
            $table->timestamps();
            
            $table->index('company_id');
            $table->index(['company_id', 'document_type', 'is_active'], 'doc_num_range_company_type_active_idx');
            $table->unique(['company_id', 'document_type', 'authorization_number'], 'doc_num_range_company_type_auth_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_numbering_ranges');
    }
};

