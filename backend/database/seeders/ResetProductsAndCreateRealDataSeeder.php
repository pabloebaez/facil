<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use App\Models\Product;
use App\Models\Sale;
use App\Models\ReturnModel;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\ProductLot;
use App\Models\Supplier;
use App\Models\User;
use App\Models\ProductSupplier;
use App\Models\SaleItem;
use App\Models\SaleItemLot;
use Carbon\Carbon;

class ResetProductsAndCreateRealDataSeeder extends Seeder
{
    public function run(): void
    {
        if ($this->command) {
            $this->command->info('🔄 Iniciando reset de productos, ventas y devoluciones...');
        }

        // Obtener todas las empresas
        $companies = Company::all();

        foreach ($companies as $company) {
            $this->command->info("Procesando empresa: {$company->name}");

            // Eliminar en orden para respetar foreign keys
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Eliminar registros relacionados
            SaleItemLot::whereHas('saleItem.sale', function($query) use ($company) {
                $query->where('company_id', $company->id);
            })->delete();

            SaleItem::whereHas('sale', function($query) use ($company) {
                $query->where('company_id', $company->id);
            })->delete();

            ReturnModel::where('company_id', $company->id)->delete();
            Sale::where('company_id', $company->id)->delete();

            ProductLot::where('company_id', $company->id)->delete();
            PurchaseItem::whereHas('purchase', function($query) use ($company) {
                $query->where('company_id', $company->id);
            })->delete();

            Purchase::where('company_id', $company->id)->delete();
            ProductSupplier::whereHas('product', function($query) use ($company) {
                $query->where('company_id', $company->id);
            })->delete();

            // Eliminar productos
            Product::where('company_id', $company->id)->delete();

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            if ($this->command) {
                $this->command->info("  ✓ Datos eliminados para {$company->name}");
            }

            // Crear proveedor por defecto si no existe
            $supplier = Supplier::firstOrCreate(
                [
                    'company_id' => $company->id,
                    'name' => 'Proveedor Principal',
                ],
                [
                    'contact_name' => 'Contacto Principal',
                    'email' => 'proveedor@' . strtolower(str_replace(' ', '', $company->name)) . '.com',
                    'phone' => '+57 300 000 0000',
                    'address' => 'Dirección del proveedor',
                    'is_active' => true,
                ]
            );

            // Obtener un usuario admin de la empresa para las compras
            $adminUser = User::where('company_id', $company->id)
                ->whereIn('role', ['admin', 'super_admin'])
                ->first();

            if (!$adminUser) {
                $this->command->warn("  ⚠ No se encontró usuario admin para {$company->name}, saltando creación de productos");
                continue;
            }

            // Crear productos con precios reales en pesos colombianos
            $productos = $this->getProductosReales($company->id);

            foreach ($productos as $productoData) {
                // Crear producto sin inventario inicial
                $producto = Product::create([
                    'company_id' => $company->id,
                    'name' => $productoData['name'],
                    'description' => $productoData['description'] ?? null,
                    'barcode' => $productoData['barcode'] ?? null,
                    'price' => $productoData['price'],
                    'cost_price' => $productoData['cost_price'],
                    'inventory' => 0, // Se actualizará con la compra
                    'image' => $productoData['image'] ?? null,
                    'discount_percent' => 0,
                    'pricing_method' => $productoData['pricing_method'] ?? 'unit',
                    'unit_label' => $productoData['unit_label'] ?? 'u',
                    'is_active' => true,
                ]);

                // Asociar impuestos si existen
                if (isset($productoData['tax_ids']) && !empty($productoData['tax_ids'])) {
                    $producto->taxes()->attach($productoData['tax_ids']);
                }

                // Crear compra inicial para el producto
                $purchaseDate = Carbon::now()->subDays(rand(1, 30)); // Fecha aleatoria en los últimos 30 días

                // Generar número de compra único globalmente
                // Usar microsegundos para asegurar unicidad
                $timestamp = microtime(true);
                $purchaseNumber = 'COMP-' . date('Ymd') . '-' . str_replace('.', '', sprintf('%.6f', $timestamp));
                
                // Verificar unicidad y ajustar si es necesario
                $attempts = 0;
                while (Purchase::where('purchase_number', $purchaseNumber)->exists() && $attempts < 10) {
                    usleep(1000); // Esperar 1 milisegundo
                    $timestamp = microtime(true);
                    $purchaseNumber = 'COMP-' . date('Ymd') . '-' . str_replace('.', '', sprintf('%.6f', $timestamp));
                    $attempts++;
                }

                // Crear compra
                $purchase = Purchase::create([
                    'company_id' => $company->id,
                    'supplier_id' => $supplier->id,
                    'user_id' => $adminUser->id,
                    'purchase_number' => $purchaseNumber,
                    'purchase_date' => $purchaseDate,
                    'subtotal' => $productoData['cost_price'] * $productoData['initial_quantity'],
                    'tax_amount' => 0,
                    'total' => $productoData['cost_price'] * $productoData['initial_quantity'],
                    'notes' => 'Compra inicial - Lote inicial',
                ]);

                // Crear item de compra
                $purchaseItem = PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $producto->id,
                    'quantity' => $productoData['initial_quantity'],
                    'unit_price' => $productoData['cost_price'],
                    'subtotal' => $productoData['cost_price'] * $productoData['initial_quantity'],
                ]);

                // Crear lote inicial
                ProductLot::create([
                    'company_id' => $company->id,
                    'product_id' => $producto->id,
                    'purchase_id' => $purchase->id,
                    'purchase_item_id' => $purchaseItem->id,
                    'supplier_id' => $supplier->id,
                    'lot_number' => null, // Lote inicial sin número
                    'quantity' => $productoData['initial_quantity'],
                    'remaining_quantity' => $productoData['initial_quantity'],
                    'unit_cost' => $productoData['cost_price'],
                    'entry_date' => $purchaseDate,
                    'expiration_date' => $productoData['expiration_date'] ?? null,
                    'notes' => 'Lote inicial',
                ]);

                // Actualizar inventario del producto
                $producto->inventory = $productoData['initial_quantity'];
                $producto->save();

                // Crear o actualizar ProductSupplier
                ProductSupplier::updateOrCreate(
                    [
                        'product_id' => $producto->id,
                        'supplier_id' => $supplier->id,
                    ],
                    [
                        'last_purchase_price' => $productoData['cost_price'],
                        'last_purchase_date' => $purchaseDate,
                    ]
                );
            }

            if ($this->command) {
                $this->command->info("  ✓ Productos creados para {$company->name}");
            }
        }

        if ($this->command) {
            $this->command->info('');
            $this->command->info('✅ Reset completado exitosamente!');
            $this->command->info('📦 Todos los productos tienen compras iniciales con lotes');
        }
    }

    private function getProductosReales($companyId)
    {
        // Obtener impuestos IVA si existen
        $ivaTax = \App\Models\Tax::where('company_id', $companyId)
            ->where('name', 'IVA')
            ->first();

        $taxIds = $ivaTax ? [$ivaTax->id] : [];

        // Productos con precios reales en pesos colombianos
        return [
            // Bebidas
            [
                'name' => 'Coca Cola 350ml',
                'description' => 'Gaseosa Coca Cola 350ml',
                'barcode' => '7702006000015',
                'price' => 2500,
                'cost_price' => 1500,
                'initial_quantity' => 48,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Agua Cristal 500ml',
                'description' => 'Agua embotellada 500ml',
                'barcode' => '7702006000022',
                'price' => 1500,
                'cost_price' => 800,
                'initial_quantity' => 60,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => [],
            ],
            [
                'name' => 'Cerveza Águila 330ml',
                'description' => 'Cerveza Águila lata 330ml',
                'barcode' => '7702006000039',
                'price' => 3500,
                'cost_price' => 2200,
                'initial_quantity' => 24,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Jugo Hit 500ml',
                'description' => 'Jugo Hit sabor a fruta 500ml',
                'barcode' => '7702006000046',
                'price' => 2800,
                'cost_price' => 1800,
                'initial_quantity' => 36,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],

            // Snacks y Dulces
            [
                'name' => 'Papas Margarita Original 40g',
                'description' => 'Papas fritas Margarita 40g',
                'barcode' => '7702006000053',
                'price' => 2000,
                'cost_price' => 1200,
                'initial_quantity' => 50,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Chocorramo',
                'description' => 'Chocorramo individual',
                'barcode' => '7702006000060',
                'price' => 1500,
                'cost_price' => 900,
                'initial_quantity' => 40,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Chicles Trident',
                'description' => 'Chicles Trident sabor menta',
                'barcode' => '7702006000077',
                'price' => 1200,
                'cost_price' => 700,
                'initial_quantity' => 30,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],

            // Productos de Aseo
            [
                'name' => 'Jabón Protex 125g',
                'description' => 'Jabón antibacterial Protex',
                'barcode' => '7702006000084',
                'price' => 3500,
                'cost_price' => 2200,
                'initial_quantity' => 20,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Shampoo Pantene 400ml',
                'description' => 'Shampoo Pantene Pro-V',
                'barcode' => '7702006000091',
                'price' => 12000,
                'cost_price' => 7500,
                'initial_quantity' => 12,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Crema Dental Colgate 75g',
                'description' => 'Crema dental Colgate Total',
                'barcode' => '7702006000107',
                'price' => 4500,
                'cost_price' => 2800,
                'initial_quantity' => 25,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],

            // Productos de Panadería
            [
                'name' => 'Pan Bimbo Integral',
                'description' => 'Pan de molde Bimbo integral',
                'barcode' => '7702006000114',
                'price' => 5500,
                'cost_price' => 3500,
                'initial_quantity' => 15,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Galletas Festival',
                'description' => 'Galletas Festival surtidas',
                'barcode' => '7702006000121',
                'price' => 3200,
                'cost_price' => 2000,
                'initial_quantity' => 20,
                'pricing_method' => 'unit',
                'unit_label' => 'u',
                'image' => null,
                'tax_ids' => $taxIds,
            ],

            // Productos por peso
            [
                'name' => 'Arroz Roa 1kg',
                'description' => 'Arroz Roa blanco 1kg',
                'barcode' => '7702006000138',
                'price' => 4500,
                'cost_price' => 3000,
                'initial_quantity' => 30,
                'pricing_method' => 'unit',
                'unit_label' => 'kg',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Azúcar Manuelita 1kg',
                'description' => 'Azúcar blanca Manuelita 1kg',
                'barcode' => '7702006000145',
                'price' => 3800,
                'cost_price' => 2500,
                'initial_quantity' => 25,
                'pricing_method' => 'unit',
                'unit_label' => 'kg',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Aceite Girasoli 1L',
                'description' => 'Aceite de girasol Girasoli 1 litro',
                'barcode' => '7702006000152',
                'price' => 8500,
                'cost_price' => 5500,
                'initial_quantity' => 18,
                'pricing_method' => 'unit',
                'unit_label' => 'L',
                'image' => null,
                'tax_ids' => $taxIds,
            ],

            // Lácteos
            [
                'name' => 'Leche Alpina 1L',
                'description' => 'Leche entera Alpina 1 litro',
                'barcode' => '7702006000169',
                'price' => 4200,
                'cost_price' => 2800,
                'initial_quantity' => 24,
                'pricing_method' => 'unit',
                'unit_label' => 'L',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Yogurt Alpina 1L',
                'description' => 'Yogurt Alpina natural 1 litro',
                'barcode' => '7702006000176',
                'price' => 5500,
                'cost_price' => 3500,
                'initial_quantity' => 20,
                'pricing_method' => 'unit',
                'unit_label' => 'L',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
            [
                'name' => 'Queso Costeño 250g',
                'description' => 'Queso costeño Alpina 250g',
                'barcode' => '7702006000183',
                'price' => 6500,
                'cost_price' => 4200,
                'initial_quantity' => 15,
                'pricing_method' => 'unit',
                'unit_label' => 'g',
                'image' => null,
                'tax_ids' => $taxIds,
            ],
        ];
    }
}









