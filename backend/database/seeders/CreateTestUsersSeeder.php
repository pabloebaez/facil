<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateTestUsersSeeder extends Seeder
{
    /**
     * Seeder rápido solo para crear usuarios de prueba
     * Útil cuando ya tienes empresas creadas
     */
    public function run(): void
    {
        $companies = Company::all();

        if ($companies->isEmpty()) {
            $this->command->error('No hay empresas creadas. Ejecuta DatabaseSeeder primero.');
            return;
        }

        $empresa1 = $companies->first();

        // Crear Super Admin si no existe
        $superAdmin = User::where('email', 'superadmin@pos.com')->first();
        if (!$superAdmin) {
            User::create([
                'company_id' => $empresa1->id,
                'name' => 'Super Administrador',
                'email' => 'superadmin@pos.com',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]);
            $this->command->info('✅ Super Admin creado');
        }

        // Crear usuarios para cada empresa
        foreach ($companies as $index => $company) {
            $suffix = $index + 1;

            // Admin
            $adminEmail = "admin{$suffix}@empresa{$suffix}.com";
            if (!User::where('email', $adminEmail)->exists()) {
                User::create([
                    'company_id' => $company->id,
                    'name' => "Admin Empresa {$suffix}",
                    'email' => $adminEmail,
                    'password' => Hash::make('admin123'),
                    'role' => 'admin',
                    'is_active' => true,
                ]);
            }

            // Cajero 1
            $cashier1Email = "cajero{$suffix}a@empresa{$suffix}.com";
            if (!User::where('email', $cashier1Email)->exists()) {
                User::create([
                    'company_id' => $company->id,
                    'name' => "Cajero A Empresa {$suffix}",
                    'email' => $cashier1Email,
                    'password' => Hash::make('cajero123'),
                    'role' => 'cashier',
                    'is_active' => true,
                ]);
            }

            // Cajero 2
            $cashier2Email = "cajero{$suffix}b@empresa{$suffix}.com";
            if (!User::where('email', $cashier2Email)->exists()) {
                User::create([
                    'company_id' => $company->id,
                    'name' => "Cajero B Empresa {$suffix}",
                    'email' => $cashier2Email,
                    'password' => Hash::make('cajero123'),
                    'role' => 'cashier',
                    'is_active' => true,
                ]);
            }

            // Contador
            $accountantEmail = "contador{$suffix}@empresa{$suffix}.com";
            if (!User::where('email', $accountantEmail)->exists()) {
                User::create([
                    'company_id' => $company->id,
                    'name' => "Contador Empresa {$suffix}",
                    'email' => $accountantEmail,
                    'password' => Hash::make('contador123'),
                    'role' => 'accountant',
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('✅ Usuarios de prueba creados para todas las empresas');
        $this->command->info('');
        $this->command->info('📋 Credenciales (reemplaza X por el número de empresa):');
        $this->command->info('  Super Admin: superadmin@pos.com / admin123');
        $this->command->info('  Admin: adminX@empresaX.com / admin123');
        $this->command->info('  Cajero A: cajeroXa@empresaX.com / cajero123');
        $this->command->info('  Cajero B: cajeroXb@empresaX.com / cajero123');
        $this->command->info('  Contador: contadorX@empresaX.com / contador123');
    }
}















