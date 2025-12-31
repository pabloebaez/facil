<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $suppliers = Supplier::where('company_id', $user->company_id)
            ->orderBy('name')
            ->get();

        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $supplier = Supplier::create([
            'company_id' => $user->company_id,
            'name' => $request->name,
            'contact_name' => $request->contact_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'tax_id' => $request->tax_id,
            'notes' => $request->notes,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($supplier, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $supplier = Supplier::where('company_id', $user->company_id)
            ->findOrFail($id);

        return response()->json($supplier);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $supplier = Supplier::where('company_id', $user->company_id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $supplier->update($request->all());

        return response()->json($supplier);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $supplier = Supplier::where('company_id', $user->company_id)
            ->findOrFail($id);

        $supplier->delete();

        return response()->json(['message' => 'Proveedor eliminado']);
    }
}
