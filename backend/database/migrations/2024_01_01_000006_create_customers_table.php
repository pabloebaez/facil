<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('doc_type')->default('CC');
            $table->string('doc_num');
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->json('history_log')->nullable();
            $table->timestamps();
            
            $table->index('company_id');
            $table->unique(['company_id', 'doc_type', 'doc_num']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};















