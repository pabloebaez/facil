<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemLot;
use App\Models\Product;
use App\Models\ProductLot;
use App\Models\Company;
use App\Models\CashDrawer;
use App\Services\DocumentNumberingService;
use App\Services\TicketNumberingService;
use App\Services\ElectronicInvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $query = Sale::where('company_id', $companyId)
            ->with([
                'customer' => function($q) {
                    $q->select('id', 'name', 'doc_num', 'company_id');
                },
                'user' => function($q) {
                    $q->select('id', 'name', 'company_id');
                },
                'items.product' => function($q) {
                    $q->select('id', 'name', 'price', 'company_id');
                }
            ]);

        // Si es cajero, solo mostrar sus propias ventas
        // Si es admin o super_admin, mostrar todas las ventas de la empresa
        if ($user->role === 'cashier') {
            $query->where('user_id', $user->id);
        }

        // Filtros opcionales
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        // Filtro por cajero/usuario (solo para administradores)
        if ($request->has('user_id') && ($user->role === 'admin' || $user->role === 'super_admin')) {
            $query->where('user_id', $request->user_id);
        }

        // Paginación opcional - por defecto 50 items, máximo 200
        $perPage = min($request->get('per_page', 50), 200);
        
        // Si se solicita paginación explícitamente o hay muchos resultados esperados
        if ($request->has('paginate') || $perPage < 1000) {
            $sales = $query->orderBy('created_at', 'desc')->paginate($perPage);
            return response()->json($sales);
        }

        // Para listados pequeños, devolver todos sin paginación
        $sales = $query->orderBy('created_at', 'desc')->get();
        return response()->json($sales);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'total_discount_amount' => 'nullable|numeric|min:0',
            'subtotal_after_discounts' => 'nullable|numeric|min:0',
            'total_tax_amount' => 'nullable|numeric|min:0',
            'final_total' => 'required|numeric|min:0',
            'tax_breakdown_details' => 'nullable|array',
            'document_type' => 'nullable|in:ticket,electronic_invoice',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Obtener empresa y verificar si tiene facturación electrónica habilitada
            $company = Company::findOrFail($companyId);
            $electronicInvoicingEnabled = $company->electronic_invoicing_enabled ?? false;

            // Determinar tipo de documento
            // Si el frontend especifica un tipo, usarlo (solo si facturación electrónica está habilitada)
            $requestedDocumentType = $request->document_type;
            
            if ($requestedDocumentType && $electronicInvoicingEnabled) {
                // El usuario eligió explícitamente un tipo
                $documentType = $requestedDocumentType;
            } elseif ($electronicInvoicingEnabled) {
                // Por defecto, si está habilitada, usar factura electrónica
                $documentType = 'electronic_invoice';
            } else {
                // Si no está habilitada, siempre ticket
                $documentType = 'ticket';
            }

            // Generar número según tipo de documento
            if ($documentType === 'electronic_invoice') {
                // Facturación electrónica: usar numeración DIAN
                $documentNumberingService = new DocumentNumberingService();
                $saleNumber = $documentNumberingService->generateDocumentNumber($companyId, 'invoice');
            } else {
                // Ticket de venta: usar numeración simple consecutiva
                $ticketService = new TicketNumberingService();
                $saleNumber = $ticketService->generateTicketNumber($companyId);
            }

            // Crear venta
            $sale = Sale::create([
                'company_id' => $companyId,
                'user_id' => $user->id,
                'customer_id' => $request->customer_id,
                'sale_number' => $saleNumber,
                'document_type' => $documentType,
                'subtotal' => $request->subtotal,
                'total_discount_amount' => $request->total_discount_amount ?? 0,
                'subtotal_after_discounts' => $request->subtotal_after_discounts ?? $request->subtotal,
                'total_tax_amount' => $request->total_tax_amount ?? 0,
                'final_total' => $request->final_total,
                'tax_breakdown_details' => $request->tax_breakdown_details ?? [],
            ]);

            // Crear items de venta y actualizar inventario
            foreach ($request->items as $item) {
                $product = Product::where('company_id', $companyId)
                    ->findOrFail($item['product_id']);

                // Calcular subtotal correctamente
                $itemQuantity = $item['quantity'] ?? 0;
                $itemPrice = $item['price'] ?? 0;
                $discountAmount = $item['discount_amount'] ?? 0;
                $itemSubtotal = ($itemQuantity * $itemPrice) - $discountAmount;
                
                // Calcular discount_percent si no viene
                $discountPercent = $item['discount_percent'] ?? 0;
                if ($discountPercent == 0 && $discountAmount > 0 && ($itemQuantity * $itemPrice) > 0) {
                    $discountPercent = ($discountAmount / ($itemQuantity * $itemPrice)) * 100;
                }
                
                // Asegurar que pricing_method sea válido para el enum
                $pricingMethod = $product->pricing_method ?? 'unit';
                if (!in_array($pricingMethod, ['unit', 'weight', 'consumption'])) {
                    $pricingMethod = 'unit';
                }

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'quantity' => $itemQuantity > 0 ? (int)$itemQuantity : null,
                    'price' => $itemPrice,
                    'weight' => $item['weight'] ?? null,
                    'unit_label' => $product->unit_label ?? 'u',
                    'pricing_method' => $pricingMethod,
                    'discount_percent' => $discountPercent,
                    'subtotal' => $itemSubtotal,
                ]);

                // Actualizar inventario usando sistema de lotes (kardex) - FIFO
                if ($product->pricing_method === 'unit') {
                    $remainingToAssign = $itemQuantity;
                    $totalCost = 0;

                    // Obtener lotes disponibles ordenados por fecha de entrada (FIFO)
                    $availableLots = ProductLot::where('product_id', $product->id)
                        ->where('company_id', $companyId)
                        ->where('remaining_quantity', '>', 0)
                        ->orderBy('entry_date', 'asc') // FIFO: primero los más antiguos
                        ->orderBy('id', 'asc') // Si tienen la misma fecha, por ID
                        ->lockForUpdate() // Bloquear para evitar condiciones de carrera
                        ->get();

                    // Verificar que haya suficiente inventario
                    $totalAvailable = $availableLots->sum('remaining_quantity');
                    if ($totalAvailable < $remainingToAssign) {
                        throw new \Exception("Inventario insuficiente para el producto {$product->name}. Disponible: {$totalAvailable}, Solicitado: {$remainingToAssign}");
                    }

                    // Asignar cantidad vendida a los lotes (FIFO)
                    foreach ($availableLots as $lot) {
                        if ($remainingToAssign <= 0) {
                            break;
                        }

                        $quantityFromLot = min($lot->remaining_quantity, $remainingToAssign);
                        
                        // Crear registro de venta por lote
                        SaleItemLot::create([
                            'sale_id' => $sale->id,
                            'sale_item_id' => $saleItem->id,
                            'product_lot_id' => $lot->id,
                            'quantity' => $quantityFromLot,
                            'unit_cost' => $lot->unit_cost,
                            'total_cost' => $quantityFromLot * $lot->unit_cost,
                        ]);

                        // Actualizar cantidad restante del lote
                        $lot->remaining_quantity -= $quantityFromLot;
                        $lot->save();

                        // Acumular costo total
                        $totalCost += $quantityFromLot * $lot->unit_cost;
                        $remainingToAssign -= $quantityFromLot;
                    }

                    // Actualizar inventario total del producto
                    $product->inventory -= $itemQuantity;
                    if ($product->inventory < 0) {
                        $product->inventory = 0; // No permitir inventario negativo
                    }
                    $product->save();
                }
            }

            // Actualizar caja registradora si existe una caja abierta
            $cashDrawer = CashDrawer::where('company_id', $companyId)
                ->where('user_id', $user->id)
                ->where('is_closed', false)
                ->whereDate('date', now()->toDateString())
                ->first();

            if ($cashDrawer) {
                $cashDrawer->sales_total += $request->final_total;
                $cashDrawer->current_amount = $cashDrawer->initial_amount + $cashDrawer->sales_total - $cashDrawer->returns_total - $cashDrawer->expenses_total;
                $cashDrawer->save();
            }

            DB::commit();

            // Si es facturación electrónica, procesar con DIAN (en segundo plano, no bloquea la respuesta)
            if ($electronicInvoicingEnabled && $documentType === 'electronic_invoice') {
                try {
                    // Intentar procesar facturación electrónica, pero no bloquear si falla
                    $electronicInvoiceService = app(ElectronicInvoiceService::class);
                    $invoiceResult = $electronicInvoiceService->processElectronicInvoice($sale);
                    
                    // Recargar venta para obtener datos actualizados de DIAN
                    $sale->refresh();
                    
                    // Si hay errores en el procesamiento, incluirlos en la respuesta pero no fallar
                    if (!$invoiceResult['success']) {
                        Log::warning('Factura electrónica procesada con errores', [
                            'sale_id' => $sale->id,
                            'errors' => $invoiceResult['error'] ?? 'Error desconocido',
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error al procesar factura electrónica después de crear venta', [
                        'sale_id' => $sale->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    // La venta ya está creada, pero la facturación electrónica falló
                    // Actualizar el estado manualmente
                    try {
                        $sale->update([
                            'dian_status' => 'rejected',
                            'dian_errors' => [
                                [
                                    'code' => 'PROCESSING_ERROR',
                                    'message' => $e->getMessage(),
                                ]
                            ],
                            'dian_response_at' => now(),
                        ]);
                    } catch (\Exception $updateError) {
                        Log::error('Error al actualizar estado DIAN después de fallo', [
                            'sale_id' => $sale->id,
                            'error' => $updateError->getMessage(),
                        ]);
                    }
                    
                    $sale->refresh();
                }
            }

            $sale->load(['customer', 'user', 'items.product']);

            return response()->json($sale, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear venta', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'error' => 'Error al crear la venta',
                'message' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $sale = Sale::where('company_id', $companyId)
            ->with(['customer', 'user', 'items.product'])
            ->findOrFail($id);

        return response()->json($sale);
    }

    /**
     * Consultar estado de factura en DIAN
     */
    public function checkDianStatus(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $sale = Sale::where('company_id', $companyId)
            ->findOrFail($id);

        // Solo facturas electrónicas pueden consultar estado DIAN
        if ($sale->document_type !== 'electronic_invoice') {
            return response()->json([
                'error' => 'Esta venta no es una factura electrónica',
            ], 400);
        }

        try {
            $electronicInvoiceService = app(ElectronicInvoiceService::class);
            $status = $electronicInvoiceService->checkInvoiceStatus($sale);

            $sale->refresh();

            return response()->json([
                'sale' => $sale->load(['customer', 'user', 'items.product']),
                'dian_status' => $status,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al consultar estado DIAN', [
                'sale_id' => $sale->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Error al consultar estado DIAN',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}

