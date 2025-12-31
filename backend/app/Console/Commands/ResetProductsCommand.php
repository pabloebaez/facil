<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\ResetProductsAndCreateRealDataSeeder;

class ResetProductsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'products:reset {--force : Ejecutar sin confirmación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Resetea todos los productos, ventas y devoluciones, y crea productos nuevos con precios reales en pesos colombianos y compras iniciales';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Iniciando reset de productos, ventas y devoluciones...');
        $this->warn('⚠️  Esta acción eliminará todos los productos, ventas y devoluciones existentes.');
        
        if (!$this->option('force') && !$this->confirm('¿Estás seguro de que deseas continuar?')) {
            $this->info('Operación cancelada.');
            return 0;
        }

        $seeder = new ResetProductsAndCreateRealDataSeeder();
        $seeder->setCommand($this);
        $seeder->run();

        $this->info('');
        $this->info('✅ Proceso completado exitosamente!');
        
        return 0;
    }
}
