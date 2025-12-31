<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Tax;
use App\Models\ProductLot;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function getReports(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $period = $request->input('period', 'today'); // today, week, month, quarter, semester, year, custom
        $customStartDate = $request->input('custom_start_date');
        $customEndDate = $request->input('custom_end_date');

        // Calcular fechas según el período
        $dates = $this->getPeriodDates($period, $customStartDate, $customEndDate);
        $startDate = $dates['startDate'];
        $endDate = $dates['endDate'];

        // Obtener ventas del período
        $sales = Sale::where('company_id', $companyId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with(['items.product'])
            ->get();

        // Obtener compras del período con sus impuestos
        $purchases = Purchase::where('company_id', $companyId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('purchaseTaxes.tax')
            ->get();

        // Obtener IDs de compras iniciales (asociadas a lotes iniciales)
        $initialPurchaseIds = ProductLot::where('company_id', $companyId)
            ->where(function($query) {
                $query->whereNull('lot_number')
                      ->orWhere('lot_number', '')
                      ->orWhere('lot_number', 'Lote Inicial');
            })
            ->pluck('purchase_id')
            ->filter()
            ->unique()
            ->toArray();

        // Filtrar compras iniciales del cálculo de egresos
        // Las compras iniciales son capital invertido, no egresos operativos del período
        $operationalPurchases = $purchases->filter(function($purchase) use ($initialPurchaseIds) {
            // Excluir compras iniciales (por ID o por notas)
            if (in_array($purchase->id, $initialPurchaseIds)) {
                return false;
            }
            $notes = strtolower($purchase->notes ?? '');
            if (strpos($notes, 'inicial') !== false || 
                strpos($notes, 'lote inicial') !== false || 
                strpos($notes, 'compra inicial') !== false) {
                return false;
            }
            return true;
        });

        // Obtener gastos del período
        $expenses = Expense::where('company_id', $companyId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        // Calcular ingresos
        $totalIncome = $sales->sum('final_total');
        $totalTaxesCollected = $sales->sum('total_tax_amount');
        $totalDiscounts = $sales->sum('total_discount_amount');
        $netIncome = $totalIncome - $totalTaxesCollected;

        // Calcular egresos (solo compras operativas + gastos, excluyendo capital inicial)
        $totalPurchases = $operationalPurchases->sum('total');
        $totalExpenses = $expenses->sum('amount');
        $totalExpensesAmount = $totalPurchases + $totalExpenses;
        
        // Calcular impuestos pagados en compras (solo compras operativas)
        $totalTaxesPaid = $operationalPurchases->sum('tax_amount');
        $totalPurchasesWithoutTaxes = $operationalPurchases->sum('subtotal');
        
        // Desglose de impuestos pagados por tipo
        $purchaseTaxesBreakdown = [];
        foreach ($operationalPurchases as $purchase) {
            foreach ($purchase->purchaseTaxes as $purchaseTax) {
                // Usar tax_name si está disponible (para impuestos personalizados), sino usar el nombre del impuesto global
                $taxName = $purchaseTax->tax_name ?? ($purchaseTax->tax->name ?? 'Impuesto');
                if (!isset($purchaseTaxesBreakdown[$taxName])) {
                    $purchaseTaxesBreakdown[$taxName] = [
                        'name' => $taxName,
                        'rate' => $purchaseTax->tax_rate,
                        'total_amount' => 0,
                        'count' => 0,
                    ];
                }
                $purchaseTaxesBreakdown[$taxName]['total_amount'] += $purchaseTax->tax_amount;
                $purchaseTaxesBreakdown[$taxName]['count']++;
            }
        }
        $purchaseTaxesBreakdown = array_values($purchaseTaxesBreakdown);
        
        // Calcular ganancia
        $profit = $totalIncome - $totalExpensesAmount;

        // Calcular productos más vendidos
        $productSales = [];
        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $productId = $item->product_id;
                $productName = $item->product_name ?? ($item->product->name ?? 'Producto desconocido');
                $quantity = floatval($item->quantity ?? 0);
                $price = floatval($item->price ?? 0);
                
                if ($quantity > 0) {
                    if (!isset($productSales[$productId])) {
                        $productSales[$productId] = [
                            'product_id' => $productId,
                            'product_name' => $productName,
                            'quantity' => 0,
                            'total_sales' => 0,
                        ];
                    }
                    $productSales[$productId]['quantity'] += $quantity;
                    $productSales[$productId]['total_sales'] += $price * $quantity;
                }
            }
        }

        // Ordenar productos
        $topProducts = collect($productSales)
            ->sortByDesc('quantity')
            ->values()
            ->take(10)
            ->toArray();

        $leastSoldProducts = collect($productSales)
            ->sortBy('quantity')
            ->values()
            ->take(10)
            ->toArray();

        // Calcular desglose de impuestos
        $taxesBreakdown = $this->calculateTaxesBreakdown($sales, $companyId);

        // Calcular valor del inventario inicial (lotes iniciales)
        $initialInventoryValue = $this->calculateInitialInventoryValue($companyId);

        // Calcular valor del inventario actual
        $products = Product::where('company_id', $companyId)->get();
        $currentInventoryAtCost = $products->sum(function($product) {
            return ($product->inventory ?? 0) * ($product->cost_price ?? 0);
        });
        $currentInventoryAtSalePrice = $products->sum(function($product) {
            return ($product->inventory ?? 0) * ($product->price ?? 0);
        });
        // La ganancia estimada es simplemente la diferencia entre el precio de venta y el costo
        // El inventario inicial ya está incluido en el costo actual, no se debe restar dos veces
        $estimatedInventoryProfit = $currentInventoryAtSalePrice - $currentInventoryAtCost;

        return response()->json([
            'period' => $period,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'income' => [
                'total' => $totalIncome,
                'taxes' => $totalTaxesCollected,
                'discounts' => $totalDiscounts,
                'net' => $netIncome,
            ],
            'expenses' => [
                'total' => $totalExpensesAmount,
                'purchases' => $totalPurchases,
                'purchases_without_taxes' => $totalPurchasesWithoutTaxes,
                'purchase_taxes' => $totalTaxesPaid,
                'purchase_taxes_breakdown' => $purchaseTaxesBreakdown,
                'other_expenses' => $totalExpenses,
            ],
            'profit' => $profit,
            'sales_count' => $sales->count(),
            'top_products' => $topProducts,
            'least_sold_products' => $leastSoldProducts,
            'taxes_breakdown' => $taxesBreakdown,
            'inventory' => [
                'initial_value' => $initialInventoryValue,
                'current_at_cost' => $currentInventoryAtCost,
                'current_at_sale_price' => $currentInventoryAtSalePrice,
                'estimated_profit' => $estimatedInventoryProfit,
            ],
        ]);
    }

    private function calculateInitialInventoryValue($companyId)
    {
        try {
            // Buscar todos los lotes iniciales (lot_number es null, vacío o "Lote Inicial")
            $initialLots = ProductLot::where('company_id', $companyId)
                ->where(function($query) {
                    $query->whereNull('lot_number')
                          ->orWhere('lot_number', '')
                          ->orWhere('lot_number', 'Lote Inicial');
                })
                ->get();

            // Calcular el valor total: cantidad inicial * costo unitario
            $totalValue = $initialLots->sum(function($lot) {
                $quantity = floatval($lot->quantity ?? 0);
                $unitCost = floatval($lot->unit_cost ?? 0);
                return $quantity * $unitCost;
            });

            return $totalValue;
        } catch (\Exception $e) {
            // Si hay error, retornar 0 y loguear el error
            Log::error('Error calculating initial inventory value: ' . $e->getMessage());
            return 0;
        }
    }

    private function getPeriodDates($period, $customStartDate = null, $customEndDate = null)
    {
        $endDate = Carbon::now()->endOfDay();
        $startDate = Carbon::now()->startOfDay();

        if ($period === 'custom') {
            // Usar fechas personalizadas
            if ($customStartDate && $customEndDate) {
                $startDate = Carbon::parse($customStartDate)->startOfDay();
                $endDate = Carbon::parse($customEndDate)->endOfDay();
            } else {
                // Si no hay fechas personalizadas, usar hoy por defecto
                $startDate = Carbon::now()->startOfDay();
            }
            return [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ];
        }

        switch ($period) {
            case 'today':
                // Ya está configurado arriba
                break;
            case 'week':
                $startDate = Carbon::now()->subDays(7)->startOfDay();
                break;
            case 'month':
                $startDate = Carbon::now()->subMonth()->startOfDay();
                break;
            case 'quarter':
                $startDate = Carbon::now()->subMonths(3)->startOfDay();
                break;
            case 'semester':
                $startDate = Carbon::now()->subMonths(6)->startOfDay();
                break;
            case 'year':
                $startDate = Carbon::now()->subYear()->startOfDay();
                break;
            default:
                $startDate = Carbon::now()->startOfDay();
        }

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
        ];
    }

    private function calculateTaxesBreakdown($sales, $companyId)
    {
        // Obtener todos los impuestos de la empresa
        $taxes = Tax::where('company_id', $companyId)
            ->where('enabled', true)
            ->get();

        $taxBreakdown = [];
        
        foreach ($taxes as $tax) {
            $taxBreakdown[$tax->id] = [
                'id' => $tax->id,
                'name' => $tax->name,
                'rate' => $tax->rate,
                'total' => 0,
            ];
        }

        // Calcular total por impuesto desde las ventas
        foreach ($sales as $sale) {
            if ($sale->tax_breakdown_details && is_array($sale->tax_breakdown_details)) {
                foreach ($sale->tax_breakdown_details as $detail) {
                    $taxId = $detail['tax_id'] ?? null;
                    $amount = floatval($detail['amount'] ?? 0);
                    
                    if ($taxId && isset($taxBreakdown[$taxId])) {
                        $taxBreakdown[$taxId]['total'] += $amount;
                    }
                }
            }
        }

        // Filtrar solo impuestos con recaudación
        return array_values(array_filter($taxBreakdown, function($tax) {
            return $tax['total'] > 0;
        }));
    }
}
