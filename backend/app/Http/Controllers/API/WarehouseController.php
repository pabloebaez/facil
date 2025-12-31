<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $warehouses = Warehouse::where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($warehouses);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $warehouse = Warehouse::create([
            'company_id' => $companyId,
            'name' => $request->name,
            'code' => $request->code,
            'address' => $request->address,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return response()->json($warehouse, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $warehouse->update($request->only(['name', 'code', 'address', 'description', 'is_active']));

        return response()->json($warehouse);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($id);
        
        // Verificar si hay productos asociados
        if ($warehouse->products()->count() > 0) {
            return response()->json([
                'error' => 'No se puede eliminar la bodega porque tiene productos asociados'
            ], 422);
        }

        $warehouse->delete();

        return response()->json(['message' => 'Bodega eliminada exitosamente']);
    }
}

