<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateLotsToLoteInicial extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update:lots-to-lote-inicial';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualiza todos los lotes con número de lote null o vacío a "Lote Inicial"';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Actualizando lotes con número de lote null o vacío...');
        
        $updated = DB::table('product_lots')
            ->where(function($query) {
                $query->whereNull('lot_number')
                      ->orWhere('lot_number', '')
                      ->orWhereRaw("TRIM(COALESCE(lot_number, '')) = ''");
            })
            ->update(['lot_number' => 'Lote Inicial']);
        
        $this->info("Se actualizaron {$updated} lotes.");
        
        $totalWithLoteInicial = DB::table('product_lots')
            ->where('lot_number', 'Lote Inicial')
            ->count();
        
        $this->info("Total de lotes con 'Lote Inicial': {$totalWithLoteInicial}");
        
        return 0;
    }
}
