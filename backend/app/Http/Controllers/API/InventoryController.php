<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\ProductLot;
use App\Models\ProductSupplier;
use App\Models\Supplier;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class InventoryController extends Controller
{
    public function importInitialInventory(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240', // Máximo 10MB
        ]);

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo debe tener al menos una fila de datos (además del encabezado)',
                ], 400);
            }

            // Obtener encabezados (primera fila)
            $headers = array_map('strtolower', array_map('trim', $rows[0]));
            
            // Obtener impuestos disponibles para la empresa
            $availableTaxes = \App\Models\Tax::where('company_id', $companyId)
                ->where('enabled', true)
                ->get()
                ->keyBy('name');
            
            // Mapear nombres de columnas posibles
            $columnMap = [
                'nombre' => 'name',
                'name' => 'name',
                'codigo' => 'barcode',
                'código' => 'barcode',
                'codigo de barras' => 'barcode',
                'barcode' => 'barcode',
                'descripcion' => 'description',
                'descripción' => 'description',
                'description' => 'description',
                'precio' => 'price',
                'precio de venta' => 'price',
                'price' => 'price',
                'costo' => 'cost_price',
                'precio de costo' => 'cost_price',
                'cost_price' => 'cost_price',
                'cantidad' => 'quantity',
                'cantidad inicial' => 'quantity',
                'quantity' => 'quantity',
                'unidad' => 'unit',
                'unit' => 'unit',
                'proveedor' => 'supplier',
                'supplier' => 'supplier',
                'fecha' => 'purchase_date',
                'fecha de compra' => 'purchase_date',
                'purchase_date' => 'purchase_date',
            ];

            // Encontrar índices de columnas
            $columnIndexes = [];
            foreach ($columnMap as $headerKey => $fieldName) {
                $index = array_search($headerKey, $headers);
                if ($index !== false) {
                    $columnIndexes[$fieldName] = $index;
                }
            }

            // Buscar columnas de impuestos dinámicas (formato: "Nombre Impuesto (%)")
            $taxColumnIndexes = [];
            foreach ($headers as $index => $header) {
                $headerLower = strtolower(trim($header));
                foreach ($availableTaxes as $tax) {
                    $taxNameLower = strtolower($tax->name);
                    // Verificar si el encabezado coincide con el nombre del impuesto seguido de " (%)"
                    $suffix = ' (%)';
                    if (strpos($headerLower, $taxNameLower) === 0) {
                        $remaining = substr($headerLower, strlen($taxNameLower));
                        if ($remaining === $suffix || $remaining === ' (%)') {
                            $taxColumnIndexes[$tax->id] = $index;
                            break;
                        }
                    }
                }
            }

            // Validar columnas requeridas
            $requiredColumns = ['name', 'price', 'cost_price', 'quantity'];
            $missingColumns = [];
            foreach ($requiredColumns as $col) {
                if (!isset($columnIndexes[$col])) {
                    $missingColumns[] = $col;
                }
            }

            if (!empty($missingColumns)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Faltan columnas requeridas: ' . implode(', ', $missingColumns),
                ], 400);
            }

            DB::beginTransaction();

            $productsCreated = 0;
            $purchasesCreated = 0;
            $lotsCreated = 0;
            $errors = [];

            // Obtener o crear proveedor por defecto si no se especifica
            $defaultSupplier = Supplier::where('company_id', $companyId)->first();
            if (!$defaultSupplier) {
                $defaultSupplier = Supplier::create([
                    'company_id' => $companyId,
                    'name' => 'Proveedor General',
                    'contact_name' => 'N/A',
                    'email' => null,
                    'phone' => null,
                ]);
            }

            // Procesar filas de datos (empezar desde la fila 1, ya que 0 es el encabezado)
            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                
                // Saltar filas vacías
                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    // Extraer datos de la fila
                    $name = trim($row[$columnIndexes['name']] ?? '');
                    $barcode = trim($row[$columnIndexes['barcode'] ?? -1] ?? '') ?: null;
                    $description = trim($row[$columnIndexes['description'] ?? -1] ?? '') ?: null;
                    $price = floatval($row[$columnIndexes['price']] ?? 0);
                    $costPrice = floatval($row[$columnIndexes['cost_price']] ?? 0);
                    $quantity = floatval($row[$columnIndexes['quantity']] ?? 0);
                    $unit = trim($row[$columnIndexes['unit'] ?? -1] ?? '') ?: 'u';
                    
                    // Procesar impuestos con porcentajes personalizados
                    $productTaxes = [];
                    foreach ($taxColumnIndexes as $taxId => $columnIndex) {
                        $taxRate = isset($row[$columnIndex]) && !empty($row[$columnIndex])
                            ? floatval($row[$columnIndex])
                            : null;
                        if ($taxRate !== null && $taxRate >= 0) {
                            $productTaxes[$taxId] = ['rate' => $taxRate];
                        }
                    }
                    
                    $supplierName = trim($row[$columnIndexes['supplier'] ?? -1] ?? '');
                    $purchaseDate = isset($columnIndexes['purchase_date']) && !empty($row[$columnIndexes['purchase_date']])
                        ? Carbon::parse($row[$columnIndexes['purchase_date']])
                        : Carbon::now();

                    // Validar datos requeridos
                    if (empty($name) || $price <= 0 || $costPrice <= 0 || $quantity <= 0) {
                        $errors[] = "Fila " . ($i + 1) . ": Datos inválidos o incompletos";
                        continue;
                    }

                    // Buscar o crear proveedor
                    $supplier = $defaultSupplier;
                    if (!empty($supplierName)) {
                        $supplier = Supplier::firstOrCreate(
                            [
                                'company_id' => $companyId,
                                'name' => $supplierName,
                            ],
                            [
                                'contact_name' => 'N/A',
                                'email' => null,
                                'phone' => null,
                            ]
                        );
                    }

                    // Buscar o crear producto
                    $product = Product::where('company_id', $companyId)
                        ->where(function($query) use ($name, $barcode) {
                            $query->where('name', $name);
                            if ($barcode) {
                                $query->orWhere('barcode', $barcode);
                            }
                        })
                        ->first();

                    if (!$product) {
                        $product = Product::create([
                            'company_id' => $companyId,
                            'name' => $name,
                            'barcode' => $barcode,
                            'description' => $description,
                            'price' => $price,
                            'cost_price' => $costPrice,
                            'inventory' => 0, // Se actualizará con la compra
                            'pricing_method' => 'unit',
                            'unit_label' => $unit,
                            'is_active' => true,
                        ]);
                        $productsCreated++;
                    }

                    // Asociar impuestos con porcentajes personalizados
                    if (!empty($productTaxes)) {
                        $product->taxes()->sync($productTaxes);
                    }

                    // Crear compra inicial
                    $timestamp = microtime(true);
                    $purchaseNumber = 'COMP-INICIAL-' . date('Ymd') . '-' . str_replace('.', '', sprintf('%.6f', $timestamp));
                    
                    $attempts = 0;
                    while (Purchase::where('company_id', $companyId)
                            ->where('purchase_number', $purchaseNumber)
                            ->exists() && $attempts < 10) {
                        usleep(1000);
                        $timestamp = microtime(true);
                        $purchaseNumber = 'COMP-INICIAL-' . date('Ymd') . '-' . str_replace('.', '', sprintf('%.6f', $timestamp));
                        $attempts++;
                    }

                    $purchase = Purchase::create([
                        'company_id' => $companyId,
                        'supplier_id' => $supplier->id,
                        'user_id' => $user->id,
                        'purchase_number' => $purchaseNumber,
                        'purchase_date' => $purchaseDate,
                        'subtotal' => $costPrice * $quantity,
                        'tax_amount' => 0,
                        'total' => $costPrice * $quantity,
                        'notes' => 'Compra inicial - Lote inicial (Importado desde Excel)',
                    ]);
                    $purchasesCreated++;

                    // Crear item de compra
                    $purchaseItem = PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'unit_price' => $costPrice,
                        'subtotal' => $costPrice * $quantity,
                    ]);

                    // Crear lote inicial
                    ProductLot::create([
                        'company_id' => $companyId,
                        'product_id' => $product->id,
                        'purchase_id' => $purchase->id,
                        'purchase_item_id' => $purchaseItem->id,
                        'supplier_id' => $supplier->id,
                        'lot_number' => null, // Lote inicial sin número
                        'quantity' => $quantity,
                        'remaining_quantity' => $quantity,
                        'unit_cost' => $costPrice,
                        'entry_date' => $purchaseDate,
                        'expiration_date' => null,
                        'notes' => 'Lote inicial (Importado desde Excel)',
                    ]);
                    $lotsCreated++;

                    // Actualizar inventario del producto
                    $product->inventory += $quantity;
                    $product->save();

                    // Crear o actualizar ProductSupplier
                    ProductSupplier::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'supplier_id' => $supplier->id,
                        ],
                        [
                            'last_purchase_price' => $costPrice,
                            'last_purchase_date' => $purchaseDate,
                        ]
                    );

                } catch (\Exception $e) {
                    Log::error('Error processing row ' . ($i + 1) . ': ' . $e->getMessage());
                    $errors[] = "Fila " . ($i + 1) . ": " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Importación completada',
                'products_created' => $productsCreated,
                'purchases_created' => $purchasesCreated,
                'lots_created' => $lotsCreated,
                'errors' => $errors,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error importing inventory: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el archivo: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function downloadTemplate()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Obtener impuestos disponibles para la empresa (si hay usuario autenticado)
            $taxes = [];
            if (auth()->check()) {
                $companyId = auth()->user()->company_id;
                $taxes = \App\Models\Tax::where('company_id', $companyId)
                    ->where('enabled', true)
                    ->orderBy('name')
                    ->get();
            }

            // Encabezados base
            $headers = [
                'Nombre',
                'Código de Barras',
                'Descripción',
                'Precio de Venta',
                'Precio de Costo',
                'Cantidad Inicial',
                'Unidad',
            ];

            // Agregar columnas de impuestos dinámicamente
            foreach ($taxes as $tax) {
                $headers[] = $tax->name . ' (%)';
            }

            // Columnas finales
            $headers[] = 'Proveedor';
            $headers[] = 'Fecha de Compra';

            $sheet->fromArray([$headers], null, 'A1');

            // Datos de ejemplo
            $exampleRow1 = ['Producto Ejemplo 1', '1234567890123', 'Descripción del producto 1', 15000, 10000, 50, 'u'];
            $exampleRow2 = ['Producto Ejemplo 2', '9876543210987', 'Descripción del producto 2', 25000, 18000, 30, 'u'];
            $exampleRow3 = ['Producto Ejemplo 3', '', 'Descripción del producto 3', 35000, 25000, 20, 'kg'];

            // Agregar porcentajes de impuestos de ejemplo (usar el rate por defecto o 0)
            foreach ($taxes as $index => $tax) {
                $exampleRow1[] = $index === 0 ? $tax->rate : ''; // Solo el primer impuesto tiene valor en el ejemplo
                $exampleRow2[] = $index === 0 ? $tax->rate : '';
                $exampleRow3[] = '';
            }

            // Agregar proveedor y fecha
            $exampleRow1[] = 'Proveedor ABC';
            $exampleRow1[] = '2024-01-15';
            $exampleRow2[] = 'Proveedor XYZ';
            $exampleRow2[] = '2024-01-20';
            $exampleRow3[] = 'Proveedor ABC';
            $exampleRow3[] = '';

            $examples = [$exampleRow1, $exampleRow2, $exampleRow3];

            $sheet->fromArray($examples, null, 'A2');

            // Calcular el número de columnas
            $lastColumnIndex = count($headers);
            $lastColumn = Coordinate::stringFromColumnIndex($lastColumnIndex);

            // Estilizar encabezados
            $sheet->getStyle('A1:' . $lastColumn . '1')->getFont()->setBold(true);
            $sheet->getStyle('A1:' . $lastColumn . '1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');

            // Ajustar ancho de columnas
            for ($col = 1; $col <= $lastColumnIndex; $col++) {
                $colLetter = Coordinate::stringFromColumnIndex($col);
                $sheet->getColumnDimension($colLetter)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            $filename = 'plantilla_inventario_inicial.xlsx';
            
            // Guardar en un archivo temporal
            $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
            $writer->save($tempFile);
            
            // Leer el archivo y devolverlo como respuesta
            $fileContent = file_get_contents($tempFile);
            unlink($tempFile);
            
            return response($fileContent, 200)
                ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                ->header('Content-Disposition', 'attachment;filename="' . $filename . '"')
                ->header('Cache-Control', 'max-age=0');

        } catch (\Exception $e) {
            Log::error('Error generating template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al generar la plantilla: ' . $e->getMessage(),
            ], 500);
        }
    }
}








