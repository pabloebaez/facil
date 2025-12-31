<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Para MariaDB/MySQL, usar CHANGE en lugar de renameColumn
        DB::statement('ALTER TABLE `companies` CHANGE `llave_bbr` `llave_bre_b` VARCHAR(50) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Para MariaDB/MySQL, revertir el cambio
        \DB::statement('ALTER TABLE `companies` CHANGE `llave_bre_b` `llave_bbr` VARCHAR(50) NULL');
    }
};
