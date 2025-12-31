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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('nequi', 50)->nullable()->after('footer_note');
            $table->string('daviplata', 50)->nullable()->after('nequi');
            $table->string('llave_bre_b', 50)->nullable()->after('daviplata');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['nequi', 'daviplata', 'llave_bre_b']);
        });
    }
};
