<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_numbering', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('prefix', 10)->default('TKT'); // Prefijo para tickets (ej: TKT)
            $table->bigInteger('current_number')->default(0); // Último número usado
            $table->timestamps();
            
            $table->unique('company_id'); // Una empresa solo puede tener una secuencia de tickets
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_numbering');
    }
};














