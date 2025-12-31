<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dian_provider_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('provider_name', 100); // Nombre del proveedor (ej: Facturación Electrónica, Habilitación DIAN)
            $table->string('api_url'); // URL de la API del proveedor
            $table->string('api_key')->nullable(); // API Key
            $table->text('api_secret')->nullable(); // API Secret (encriptado)
            $table->string('username')->nullable(); // Usuario para autenticación
            $table->text('password')->nullable(); // Contraseña (encriptada)
            $table->string('certificate_path')->nullable(); // Ruta al certificado digital (.p12 o .pfx)
            $table->text('certificate_password')->nullable(); // Contraseña del certificado (encriptada)
            $table->enum('environment', ['test', 'production'])->default('test'); // Ambiente: prueba o producción
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('company_id');
            $table->index(['company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dian_provider_configs');
    }
};














