<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\ProductSupplier;
use App\Models\ProductLot;
use App\Models\CashDrawer;
use App\Models\Expense;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $purchases = Purchase::where('company_id', $user->company_id)
            ->with(['supplier:id,name', 'user:id,name', 'items.product:id,name', 'purchaseTaxes'])
            ->orderBy('purchase_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($purchases);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'total_paid' => 'required|numeric|min:0.01', // Total de la factura pagada (egreso)
            'invoice_number' => 'nullable|string|max:100', // Número de factura (alfanumérico)
            'cufe' => 'nullable|string|max:200', // Código Único de Factura Electrónica
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.lot_number' => 'nullable|string|max:100',
            'items.*.expiration_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string',
            'taxes' => 'nullable|array',
            'taxes.*.tax_id' => 'nullable|exists:taxes,id', // Puede ser null para impuestos personalizados
            'taxes.*.tax_name' => 'required_with:taxes|string|max:100', // Requerido para identificar el impuesto
            'taxes.*.tax_base' => 'required_with:taxes|numeric|min:0',
            'taxes.*.tax_rate' => 'required_with:taxes|numeric|min:0|max:100',
            'taxes.*.tax_amount' => 'required_with:taxes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Generar número de compra
            $purchaseNumber = 'COMP-' . date('Ymd') . '-' . str_pad(
                Purchase::where('company_id', $user->company_id)
                    ->whereDate('created_at', today())
                    ->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );

            // Calcular total de impuestos si se proporcionan
            $taxAmount = 0;
            if ($request->has('taxes') && is_array($request->taxes) && count($request->taxes) > 0) {
                foreach ($request->taxes as $tax) {
                    $taxAmount += $tax['tax_amount'];
                }
            }
            
            // Calcular subtotal: total_paid - impuestos
            // El total_paid incluye impuestos, así que el subtotal es sin impuestos
            $subtotal = $request->total_paid - $taxAmount;
            
            // El total es el total_paid (incluye impuestos)
            $total = $request->total_paid;

            // Crear compra
            $purchase = Purchase::create([
                'company_id' => $user->company_id,
                'supplier_id' => $request->supplier_id,
                'user_id' => $user->id,
                'purchase_number' => $purchaseNumber,
                'invoice_number' => $request->invoice_number ?? null,
                'cufe' => $request->cufe ?? null,
                'purchase_date' => $request->purchase_date,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'notes' => $request->notes,
            ]);

            // Registrar el total como egreso en la caja activa
            $cashDrawer = CashDrawer::where('company_id', $user->company_id)
                ->where('user_id', $user->id)
                ->where('is_closed', false)
                ->whereDate('date', now()->toDateString())
                ->first();

            if ($cashDrawer) {
                // Obtener nombre del proveedor
                $supplier = Supplier::find($request->supplier_id);
                $supplierName = $supplier ? $supplier->name : 'N/A';
                
                // Crear egreso para la compra
                $expense = Expense::create([
                    'company_id' => $user->company_id,
                    'cash_drawer_id' => $cashDrawer->id,
                    'user_id' => $user->id,
                    'description' => "Compra #{$purchaseNumber} - Proveedor: {$supplierName}",
                    'amount' => $total,
                ]);

                // Actualizar total de gastos del cajón
                $cashDrawer->expenses_total = $cashDrawer->expenses()->sum('amount');
                $cashDrawer->current_amount = $cashDrawer->initial_amount + $cashDrawer->sales_total - $cashDrawer->returns_total - $cashDrawer->expenses_total;
                $cashDrawer->save();
            }

            // Crear items y actualizar inventario y ProductSupplier
            foreach ($request->items as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                
                // Verificar que el producto pertenezca a la empresa
                if ($product->company_id !== $user->company_id) {
                    throw new \Exception('El producto no pertenece a la empresa');
                }

                // Crear item de compra
                $purchaseItem = PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal' => $itemData['quantity'] * $itemData['unit_price'],
                ]);

                // Crear lote del producto (kardex)
                // Si no se proporciona número de lote, usar "Lote Inicial" por defecto
                $lotNumber = !empty($itemData['lot_number']) && trim($itemData['lot_number']) !== '' 
                    ? trim($itemData['lot_number']) 
                    : 'Lote Inicial';
                
                // El unit_price ya viene sin impuestos del frontend cuando la empresa es responsable
                // Si la empresa NO es responsable, unit_price es el precio total
                // En ambos casos, usamos unit_price como costo del producto (sin impuestos)
                $unitCost = $itemData['unit_price'];
                
                $productLot = ProductLot::create([
                    'company_id' => $user->company_id,
                    'product_id' => $product->id,
                    'purchase_id' => $purchase->id,
                    'purchase_item_id' => $purchaseItem->id,
                    'supplier_id' => $request->supplier_id,
                    'lot_number' => $lotNumber,
                    'quantity' => $itemData['quantity'],
                    'remaining_quantity' => $itemData['quantity'], // Inicialmente toda la cantidad está disponible
                    'unit_cost' => $unitCost, // Costo sin impuestos
                    'entry_date' => $request->purchase_date,
                    'expiration_date' => $itemData['expiration_date'] ?? null,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                // Actualizar inventario del producto (suma total de todos los lotes)
                // NO actualizar cost_price automáticamente - mantener el precio original de compra
                $product->inventory += $itemData['quantity'];
                $product->save();

                // Actualizar o crear ProductSupplier
                $productSupplier = ProductSupplier::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'supplier_id' => $request->supplier_id,
                    ],
                    [
                        'last_purchase_price' => $itemData['unit_price'],
                        'last_purchase_date' => $request->purchase_date,
                    ]
                );
            }

            // Crear impuestos de la compra si se proporcionan
            if ($request->has('taxes') && is_array($request->taxes)) {
                foreach ($request->taxes as $taxData) {
                    // Verificar que el impuesto pertenezca a la empresa
                    $tax = \App\Models\Tax::find($taxData['tax_id']);
                    if ($tax && $tax->company_id === $user->company_id) {
                        PurchaseTax::create([
                            'purchase_id' => $purchase->id,
                            'tax_id' => $taxData['tax_id'],
                            'tax_base' => $taxData['tax_base'],
                            'tax_rate' => $taxData['tax_rate'],
                            'tax_amount' => $taxData['tax_amount'],
                        ]);
                    }
                }
            }

            DB::commit();

            $purchase->load(['supplier', 'user', 'items.product', 'purchaseTaxes']);

            return response()->json($purchase, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al registrar la compra',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $purchase = Purchase::where('company_id', $user->company_id)
            ->with(['supplier', 'user', 'items.product', 'purchaseTaxes.tax'])
            ->findOrFail($id);

        return response()->json($purchase);
    }
}
