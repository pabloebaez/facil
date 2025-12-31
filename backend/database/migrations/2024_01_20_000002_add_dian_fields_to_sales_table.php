<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Tipo de documento (factura electrónica o ticket)
            $table->enum('document_type', ['electronic_invoice', 'ticket'])->default('ticket')->after('sale_number');
            
            // Campos para facturación electrónica DIAN
            $table->string('cufe', 100)->nullable()->after('document_type'); // Código Único de Factura Electrónica
            $table->enum('dian_status', ['pending', 'accepted', 'rejected'])->nullable()->after('cufe'); // Estado DIAN
            $table->text('dian_response')->nullable()->after('dian_status'); // Respuesta completa de DIAN (JSON)
            $table->text('dian_acuse')->nullable()->after('dian_response'); // Acuse de recibo DIAN
            $table->string('xml_path')->nullable()->after('dian_acuse'); // Ruta al XML generado
            $table->string('signed_xml_path')->nullable()->after('xml_path'); // Ruta al XML firmado
            $table->json('dian_errors')->nullable()->after('signed_xml_path'); // Errores de validación
            $table->timestamp('dian_sent_at')->nullable()->after('dian_errors'); // Fecha de envío a DIAN
            $table->timestamp('dian_response_at')->nullable()->after('dian_sent_at'); // Fecha de respuesta de DIAN
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'document_type',
                'cufe',
                'dian_status',
                'dian_response',
                'dian_acuse',
                'xml_path',
                'signed_xml_path',
                'dian_errors',
                'dian_sent_at',
                'dian_response_at',
            ]);
        });
    }
};














