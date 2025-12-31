<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CashDrawer;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class CashDrawerController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $cashDrawers = CashDrawer::where('company_id', $companyId)
            ->with('expenses')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($cashDrawers);
    }

    /**
     * Obtener la caja activa del usuario actual
     */
    public function getActive(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $companyId = $user->company_id;
            
            if (!$companyId) {
                return response()->json(['error' => 'Usuario sin empresa asignada'], 400);
            }

            // Buscar caja activa del usuario para hoy
            // Usar whereDate para comparar correctamente el campo date
            $today = now()->toDateString();
            
            $cashDrawer = CashDrawer::where('company_id', $companyId)
                ->where('user_id', $user->id)
                ->where('is_closed', false)
                ->whereDate('date', $today)
                ->orderBy('created_at', 'desc')
                ->first();

            // Si no se encuentra una caja abierta, verificar si hay alguna caja de hoy (para debugging)
            if (!$cashDrawer) {
                $anyCashDrawerToday = CashDrawer::where('company_id', $companyId)
                    ->where('user_id', $user->id)
                    ->whereDate('date', $today)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                // Si hay una caja pero está cerrada, loguear para debugging
                if ($anyCashDrawerToday && $anyCashDrawerToday->is_closed) {
                    Log::info('Caja encontrada pero está cerrada', [
                        'cash_drawer_id' => $anyCashDrawerToday->id,
                        'is_closed' => $anyCashDrawerToday->is_closed,
                        'closed_at' => $anyCashDrawerToday->closed_at,
                        'date' => $anyCashDrawerToday->date,
                    ]);
                }
                
                return response()->json(null);
            }

            // No cargar gastos por ahora para evitar errores
            // Los gastos se pueden cargar cuando se necesiten específicamente

            return response()->json($cashDrawer);
        } catch (\Exception $e) {
            Log::error('Error al obtener caja activa', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Error al obtener la caja activa',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'opening_amount' => 'required|numeric|min:0',
            'closing_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validar que el usuario tenga empresa asignada
        if (!$companyId) {
            return response()->json([
                'error' => 'Usuario sin empresa asignada'
            ], 400);
        }

        // Obtener la fecha actual en formato correcto
        $today = now()->toDateString();

        // Verificar si ya existe una caja (abierta o cerrada) para este usuario hoy
        // La restricción única en la BD solo permite una caja por día/usuario/empresa
        $existingCashDrawer = CashDrawer::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if ($existingCashDrawer) {
            if (!$existingCashDrawer->is_closed) {
                // Ya existe una caja abierta, retornarla
                return response()->json([
                    'error' => 'Ya existe una caja abierta para este usuario hoy',
                    'cash_drawer' => $existingCashDrawer
                ], 409);
            } else {
                // Si la caja está cerrada, reabrirla en lugar de crear una nueva
                // Esto evita problemas con la restricción única y permite continuar trabajando
                $existingCashDrawer->is_closed = false;
                $existingCashDrawer->closed_at = null;
                $existingCashDrawer->initial_amount = $request->opening_amount;
                $existingCashDrawer->current_amount = $request->opening_amount;
                // Resetear totales si se desea empezar de cero, o mantenerlos si se quiere continuar
                // Por ahora, resetear para empezar limpio
                $existingCashDrawer->sales_total = 0;
                $existingCashDrawer->returns_total = 0;
                $existingCashDrawer->expenses_total = 0;
                $existingCashDrawer->save();
                
                return response()->json([
                    'message' => 'Caja cerrada reabierta exitosamente',
                    'cash_drawer' => $existingCashDrawer
                ], 200);
            }
        }

        try {
            // Crear la caja con los datos proporcionados
            $cashDrawer = CashDrawer::create([
                'company_id' => $companyId,
                'user_id' => $user->id,
                'date' => $today,
                'initial_amount' => floatval($request->opening_amount),
                'sales_total' => 0,
                'returns_total' => 0,
                'expenses_total' => 0,
                'current_amount' => floatval($request->opening_amount),
                'is_closed' => false,
            ]);

            // Recargar el modelo para obtener todos los campos
            $cashDrawer->refresh();

            return response()->json($cashDrawer, 201);
        } catch (QueryException $e) {
            \Log::error('Error creating cash drawer (Database)', [
                'error' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Verificar si es un error de duplicado único (código 23000 en MySQL)
            $errorCode = $e->getCode();
            $errorMessage = $e->getMessage();
            
            if ($errorCode == 23000 || strpos($errorMessage, 'Duplicate entry') !== false || strpos($errorMessage, 'UNIQUE constraint') !== false) {
                // Intentar obtener la caja existente
                $existingCashDrawer = CashDrawer::where('company_id', $companyId)
                    ->where('user_id', $user->id)
                    ->whereDate('date', $today)
                    ->first();

                if ($existingCashDrawer) {
                    if (!$existingCashDrawer->is_closed) {
                        return response()->json([
                            'error' => 'Ya existe una caja abierta para este usuario hoy',
                            'cash_drawer' => $existingCashDrawer
                        ], 409);
                    } else {
                        return response()->json([
                            'error' => 'Ya existe una caja cerrada para este usuario hoy. La restricción de la base de datos solo permite una caja por día.',
                            'cash_drawer' => $existingCashDrawer
                        ], 409);
                    }
                }
            }

            return response()->json([
                'error' => 'Error al crear la caja',
                'message' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Error creating cash drawer', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Error al crear la caja',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $cashDrawer = CashDrawer::where('company_id', $companyId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'closing_amount' => 'sometimes|required|numeric|min:0',
            'current_amount' => 'sometimes|required|numeric|min:0',
            'is_closed' => 'sometimes|boolean',
            'notes' => 'nullable|string',
            'count_details' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = [];
        
        // Actualizar monto actual si se proporciona
        if ($request->has('current_amount')) {
            $data['current_amount'] = $request->current_amount;
        }
        
        // Cerrar la caja si se solicita
        if ($request->has('is_closed') && $request->is_closed) {
            $data['is_closed'] = true;
            $data['closed_at'] = now();
        }
        
        // Actualizar solo si hay datos que cambiar
        if (!empty($data)) {
            $cashDrawer->update($data);
        }
        
        // Log de detalles del conteo para auditoría (opcional)
        if ($request->has('count_details') || $request->has('notes')) {
            Log::info('Caja cerrada con arqueo', [
                'cash_drawer_id' => $cashDrawer->id,
                'count_details' => $request->count_details,
                'notes' => $request->notes,
                'closing_amount' => $request->closing_amount ?? null,
                'current_amount' => $request->current_amount ?? null,
            ]);
        }
        
        // Recargar el modelo para obtener los datos actualizados
        $cashDrawer->refresh();
        
        return response()->json($cashDrawer);
    }

    public function addExpense(Request $request, $cashDrawerId)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $cashDrawer = CashDrawer::where('company_id', $companyId)->findOrFail($cashDrawerId);

        $validator = Validator::make($request->all(), [
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $expense = Expense::create([
            'company_id' => $companyId,
            'cash_drawer_id' => $cashDrawer->id,
            'user_id' => $user->id,
            'description' => $request->description,
            'amount' => $request->amount,
        ]);

        // Actualizar total de gastos del cajón
        $cashDrawer->expenses_total = $cashDrawer->expenses()->sum('amount');
        $cashDrawer->current_amount = $cashDrawer->initial_amount + $cashDrawer->sales_total - $cashDrawer->returns_total - $cashDrawer->expenses_total;
        $cashDrawer->save();

        return response()->json($expense, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $cashDrawer = CashDrawer::where('company_id', $companyId)
            ->with('expenses')
            ->findOrFail($id);

        return response()->json($cashDrawer);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $cashDrawer = CashDrawer::where('company_id', $companyId)->findOrFail($id);
        $cashDrawer->delete();

        return response()->json(['message' => 'Caja eliminada exitosamente']);
    }
}

