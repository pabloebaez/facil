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
        Schema::create('digital_payment_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->enum('payment_provider', ['nequi', 'daviplata', 'llave_bre_b']);
            $table->string('client_id')->nullable();
            $table->text('client_secret')->nullable(); // Encriptado
            $table->string('api_key')->nullable();
            $table->text('api_secret')->nullable(); // Encriptado
            $table->string('merchant_id')->nullable();
            $table->string('phone_number')->nullable(); // Número de teléfono asociado
            $table->string('llave_bre_b_value')->nullable(); // Valor específico para Llave BRE-B
            $table->text('access_token')->nullable(); // Token de acceso (encriptado)
            $table->text('refresh_token')->nullable(); // Token de refresco (encriptado)
            $table->string('environment')->default('sandbox'); // sandbox o production
            $table->json('additional_config')->nullable(); // Configuraciones adicionales específicas del proveedor
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            // Un proveedor por empresa (único)
            $table->unique(['company_id', 'payment_provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('digital_payment_configs');
    }
};
