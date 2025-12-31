<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\User;
use App\Models\CashDrawer;
use App\Services\DocumentNumberingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class ReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $query = ReturnModel::where('company_id', $companyId)
            ->with(['sale', 'user']);

        // Si es cajero, solo mostrar sus propias devoluciones
        // Si es admin o super_admin, mostrar todas las devoluciones de la empresa
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
        if ($request->has('sale_id')) {
            $query->where('sale_id', $request->sale_id);
        }
        // Filtro por número de factura (sale_number)
        if ($request->has('sale_number')) {
            $saleNumber = $request->sale_number;
            $query->whereHas('sale', function ($q) use ($saleNumber) {
                $q->where('sale_number', 'like', "%{$saleNumber}%");
            });
        }

        // Paginación opcional - por defecto 50 items, máximo 200
        $perPage = min($request->get('per_page', 50), 200);
        
        // Si se solicita paginación explícitamente o hay muchos resultados esperados
        if ($request->has('paginate') || $perPage < 1000) {
            $returns = $query->orderBy('created_at', 'desc')->paginate($perPage);
            return response()->json($returns);
        }

        // Para listados pequeños, devolver todos sin paginación
        $returns = $query->orderBy('created_at', 'desc')->get();
        return response()->json($returns);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'sale_id' => 'required|exists:sales,id',
            'reason' => 'nullable|string|max:500',
            'return_all_items' => 'boolean', // Si true, devuelve todos los items
            'items' => 'required_if:return_all_items,false|array', // Items específicos a devolver
            'items.*.sale_item_id' => 'required_with:items|exists:sale_items,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0.01',
            'admin_password' => 'required|string', // Contraseña del administrador para autorizar
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validar que la contraseña del administrador sea correcta
        $adminPassword = $request->input('admin_password');
        $admin = User::where('company_id', $companyId)
            ->where(function ($query) {
                $query->where('role', 'admin')
                      ->orWhere('role', 'super_admin');
            })
            ->where('is_active', true)
            ->get()
            ->first(function ($user) use ($adminPassword) {
                return Hash::check($adminPassword, $user->password);
            });

        if (!$admin) {
            return response()->json([
                'error' => 'No autorizado',
                'message' => 'La contraseña del administrador es incorrecta',
            ], 403);
        }

        Log::info('Devolución autorizada por administrador', [
            'cashier_id' => $user->id,
            'cashier_name' => $user->name,
            'admin_id' => $admin->id,
            'admin_name' => $admin->name,
            'sale_id' => $request->sale_id,
        ]);

        DB::beginTransaction();
        try {
            // Obtener la venta original
            $sale = Sale::where('company_id', $companyId)
                ->with(['items.product'])
                ->findOrFail($request->sale_id);

            // Verificar que la venta pertenece a la empresa
            if ($sale->company_id !== $companyId) {
                return response()->json(['error' => 'No autorizado'], 403);
            }

            $returnAllItems = $request->input('return_all_items', false);
            $totalReturned = 0;
            $itemsToReturn = [];

            if ($returnAllItems) {
                // Devolver todos los items de la venta
                foreach ($sale->items as $saleItem) {
                    $itemTotal = $saleItem->subtotal;
                    $totalReturned += $itemTotal;
                    $itemsToReturn[] = [
                        'sale_item' => $saleItem,
                        'quantity' => $saleItem->quantity,
                    ];
                }
            } else {
                // Devolver solo items específicos
                foreach ($request->items as $returnItem) {
                    $saleItem = SaleItem::where('sale_id', $sale->id)
                        ->where('id', $returnItem['sale_item_id'])
                        ->firstOrFail();

                    $returnQuantity = $returnItem['quantity'];
                    
                    // Verificar que no se devuelva más de lo vendido
                    if ($returnQuantity > $saleItem->quantity) {
                        throw new \Exception("No se puede devolver más cantidad de la vendida para el item {$saleItem->product_name}");
                    }

                    // Calcular el monto proporcional a devolver
                    $itemTotal = $saleItem->subtotal;
                    $proportionalTotal = ($returnQuantity / $saleItem->quantity) * $itemTotal;
                    $totalReturned += $proportionalTotal;

                    $itemsToReturn[] = [
                        'sale_item' => $saleItem,
                        'quantity' => $returnQuantity,
                    ];
                }
            }

            // Generar número de nota de crédito según normativa DIAN
            $documentNumberingService = new DocumentNumberingService();
            $returnNumber = $documentNumberingService->generateDocumentNumber($companyId, 'credit_note');

            // Obtener información del rango usado
            $range = $documentNumberingService->getActiveRange($companyId, 'credit_note');

            // Crear la devolución
            $return = ReturnModel::create([
                'company_id' => $companyId,
                'sale_id' => $sale->id,
                'user_id' => $user->id,
                'return_number' => $returnNumber,
                'document_type' => 'credit_note',
                'authorization_number' => $range->authorization_number,
                'total_returned' => $totalReturned,
                'reason' => $request->reason ?? 'Devolución de venta',
            ]);

            // Restaurar inventario para cada item devuelto
            foreach ($itemsToReturn as $itemData) {
                $saleItem = $itemData['sale_item'];
                $returnQuantity = $itemData['quantity'];
                
                $product = Product::where('company_id', $companyId)
                    ->find($saleItem->product_id);

                if ($product && $product->pricing_method === 'unit') {
                    // Solo restaurar inventario para productos con pricing_method 'unit'
                    $product->inventory += $returnQuantity;
                    $product->save();
                }
            }

            // Actualizar la caja registradora del usuario que está haciendo la devolución
            $cashDrawer = CashDrawer::where('company_id', $companyId)
                ->where('user_id', $user->id)
                ->where('is_closed', false)
                ->whereDate('date', now()->toDateString())
                ->first();

            if ($cashDrawer) {
                $cashDrawer->returns_total += $totalReturned;
                $cashDrawer->current_amount = $cashDrawer->initial_amount + $cashDrawer->sales_total - $cashDrawer->returns_total - $cashDrawer->expenses_total;
                $cashDrawer->save();
            }

            DB::commit();

            $return->load(['sale', 'user']);

            Log::info('Devolución creada exitosamente', [
                'return_id' => $return->id,
                'sale_id' => $sale->id,
                'total_returned' => $totalReturned,
            ]);

            return response()->json($return, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear devolución', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'error' => 'Error al crear la devolución',
                'message' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $return = ReturnModel::where('company_id', $companyId)
            ->with(['sale.items.product', 'user'])
            ->findOrFail($id);

        return response()->json($return);
    }
}

