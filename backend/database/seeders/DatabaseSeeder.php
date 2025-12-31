<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\User;
use App\Models\Product;
use App\Models\Tax;
use App\Models\Customer;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Crear empresas de prueba
        $empresa1 = Company::create([
            'name' => 'Cafetería El Buen Sabor',
            'tax_id' => 'NIT: 900.123.456-7',
            'address' => 'Calle 123 #45-67, Bogotá',
            'phone' => '+57 300 123 4567',
            'email' => 'contacto@buensabor.com',
            'logo_url' => 'https://placehold.co/200x200/4A5568/FFFFFF?text=Cafetería',
            'footer_note' => '¡Gracias por su compra! Vuelva pronto.',
            'is_active' => true,
        ]);

        $empresa2 = Company::create([
            'name' => 'Restaurante La Esquina',
            'tax_id' => 'NIT: 900.987.654-3',
            'address' => 'Avenida Principal 789, Medellín',
            'phone' => '+57 310 987 6543',
            'email' => 'info@laesquina.com',
            'logo_url' => 'https://placehold.co/200x200/2D3748/FFFFFF?text=Restaurante',
            'footer_note' => 'Servicio con calidad y calidez.',
            'is_active' => true,
        ]);

        $empresa3 = Company::create([
            'name' => 'Tienda de Conveniencia 24/7',
            'tax_id' => 'NIT: 900.555.888-1',
            'address' => 'Carrera 50 #30-15, Cali',
            'phone' => '+57 320 555 8888',
            'email' => 'ventas@tienda24.com',
            'logo_url' => 'https://placehold.co/200x200/1A202C/FFFFFF?text=Tienda',
            'footer_note' => 'Abiertos las 24 horas del día.',
            'is_active' => true,
        ]);

        // Crear Super Admin (sin empresa específica o con empresa principal)
        $superAdmin = User::create([
            'company_id' => $empresa1->id,
            'name' => 'Super Administrador',
            'email' => 'superadmin@pos.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // Empresa 1 - Cafetería El Buen Sabor
        User::create([
            'company_id' => $empresa1->id,
            'name' => 'María González',
            'email' => 'maria@buensabor.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'company_id' => $empresa1->id,
            'name' => 'Carlos Rodríguez',
            'email' => 'carlos@buensabor.com',
            'password' => Hash::make('cajero123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        User::create([
            'company_id' => $empresa1->id,
            'name' => 'Ana Martínez',
            'email' => 'ana@buensabor.com',
            'password' => Hash::make('cajero123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        User::create([
            'company_id' => $empresa1->id,
            'name' => 'Pedro Contador',
            'email' => 'pedro@buensabor.com',
            'password' => Hash::make('contador123'),
            'role' => 'accountant',
            'is_active' => true,
        ]);

        // Empresa 2 - Restaurante La Esquina
        User::create([
            'company_id' => $empresa2->id,
            'name' => 'Luis Fernández',
            'email' => 'luis@laesquina.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'company_id' => $empresa2->id,
            'name' => 'Sofía López',
            'email' => 'sofia@laesquina.com',
            'password' => Hash::make('cajero123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        User::create([
            'company_id' => $empresa2->id,
            'name' => 'Diego Ramírez',
            'email' => 'diego@laesquina.com',
            'password' => Hash::make('cajero123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        // Empresa 3 - Tienda de Conveniencia 24/7
        User::create([
            'company_id' => $empresa3->id,
            'name' => 'Laura Sánchez',
            'email' => 'laura@tienda24.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'company_id' => $empresa3->id,
            'name' => 'Roberto Torres',
            'email' => 'roberto@tienda24.com',
            'password' => Hash::make('cajero123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        // Crear impuestos para cada empresa
        Tax::create([
            'company_id' => $empresa1->id,
            'name' => 'IVA',
            'rate' => 19.00,
            'enabled' => true,
        ]);

        Tax::create([
            'company_id' => $empresa1->id,
            'name' => 'Impoconsumo',
            'rate' => 8.00,
            'enabled' => false,
        ]);

        Tax::create([
            'company_id' => $empresa2->id,
            'name' => 'IVA',
            'rate' => 19.00,
            'enabled' => true,
        ]);

        Tax::create([
            'company_id' => $empresa3->id,
            'name' => 'IVA',
            'rate' => 19.00,
            'enabled' => true,
        ]);

        // Crear productos de ejemplo para Empresa 1
        $productosEmpresa1 = [
            [
                'name' => 'Café Americano',
                'price' => 2.50,
                'cost_price' => 0.80,
                'inventory' => 100,
                'image' => 'https://placehold.co/100x100/A9A9A9/FFFFFF?text=Café',
                'pricing_method' => 'unit',
                'unit_label' => 'u',
            ],
            [
                'name' => 'Croissant',
                'price' => 1.80,
                'cost_price' => 0.60,
                'inventory' => 50,
                'image' => 'https://placehold.co/100x100/D2B48C/FFFFFF?text=Croissant',
                'pricing_method' => 'unit',
                'unit_label' => 'u',
            ],
            [
                'name' => 'Jugo de Naranja',
                'price' => 3.00,
                'cost_price' => 1.00,
                'inventory' => 30,
                'image' => 'https://placehold.co/100x100/FFA500/FFFFFF?text=Jugo',
                'pricing_method' => 'unit',
                'unit_label' => 'u',
            ],
        ];

        foreach ($productosEmpresa1 as $producto) {
            Product::create(array_merge($producto, [
                'company_id' => $empresa1->id,
                'discount_percent' => 0,
                'is_active' => true,
            ]));
        }

        // Crear clientes de ejemplo
        Customer::create([
            'company_id' => $empresa1->id,
            'doc_type' => 'CC',
            'doc_num' => '11223344',
            'name' => 'Cliente General',
            'address' => 'N/A',
            'email' => 'N/A',
            'phone' => 'N/A',
            'history_log' => [],
        ]);

        Customer::create([
            'company_id' => $empresa1->id,
            'doc_type' => 'NIT',
            'doc_num' => '98765432-1',
            'name' => 'Empresa Ejemplo SAS',
            'address' => 'Carrera 4 5-6',
            'email' => 'contacto@empresa.com',
            'phone' => '3009876543',
            'history_log' => [],
        ]);

        Customer::create([
            'company_id' => $empresa1->id,
            'doc_type' => 'CC',
            'doc_num' => '55667788',
            'name' => 'Ana García',
            'address' => 'Avenida Siempre Viva 742',
            'email' => 'ana.g@mail.com',
            'phone' => '3101112233',
            'history_log' => [
                [
                    'timestamp' => now()->subDays(1)->timestamp,
                    'type' => 'note',
                    'details' => 'Consultó sobre garantía extendida.',
                ],
            ],
        ]);

        $this->command->info('✅ Usuarios de prueba creados exitosamente!');
        $this->command->info('');
        $this->command->info('📋 Credenciales de acceso:');
        $this->command->info('');
        $this->command->info('SUPER ADMIN:');
        $this->command->info('  Email: superadmin@pos.com');
        $this->command->info('  Password: admin123');
        $this->command->info('');
        $this->command->info('EMPRESA 1 - Cafetería El Buen Sabor:');
        $this->command->info('  Admin: maria@buensabor.com / admin123');
        $this->command->info('  Cajero: carlos@buensabor.com / cajero123');
        $this->command->info('  Cajero: ana@buensabor.com / cajero123');
        $this->command->info('  Contador: pedro@buensabor.com / contador123');
        $this->command->info('');
        $this->command->info('EMPRESA 2 - Restaurante La Esquina:');
        $this->command->info('  Admin: luis@laesquina.com / admin123');
        $this->command->info('  Cajero: sofia@laesquina.com / cajero123');
        $this->command->info('  Cajero: diego@laesquina.com / cajero123');
        $this->command->info('');
        $this->command->info('EMPRESA 3 - Tienda de Conveniencia 24/7:');
        $this->command->info('  Admin: laura@tienda24.com / admin123');
        $this->command->info('  Cajero: roberto@tienda24.com / cajero123');
    }
}















