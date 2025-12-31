<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $products = Product::where('company_id', $companyId)
            ->with(['taxes', 'warehouse'])
            ->orderBy('name')
            ->get();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'barcode' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'inventory' => 'nullable|integer|min:0',
            'image' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'pricing_method' => 'required|in:unit,weight,consumption',
            'unit_label' => 'nullable|string|max:50',
            'tax_ids' => 'nullable|array',
            'tax_ids.*' => 'exists:taxes,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::create([
            'company_id' => $companyId,
            'warehouse_id' => $request->warehouse_id,
            'name' => $request->name,
            'description' => $request->description,
            'barcode' => $request->barcode,
            'price' => $request->price,
            'cost_price' => $request->cost_price ?? 0,
            'inventory' => $request->inventory ?? 0,
            'image' => $request->image,
            'discount_percent' => $request->discount_percent ?? 0,
            'pricing_method' => $request->pricing_method,
            'unit_label' => $request->unit_label ?? 'u',
            'is_active' => true,
        ]);

        if ($request->has('tax_ids') && is_array($request->tax_ids)) {
            $taxIds = Tax::where('company_id', $companyId)
                ->whereIn('id', $request->tax_ids)
                ->pluck('id')
                ->toArray();
            $product->taxes()->sync($taxIds);
        }

        $product->load(['taxes', 'warehouse']);

        return response()->json($product, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $product = Product::where('company_id', $companyId)
            ->with(['taxes', 'warehouse'])
            ->findOrFail($id);

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $product = Product::where('company_id', $companyId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'barcode' => 'nullable|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'inventory' => 'nullable|integer|min:0',
            'image' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'pricing_method' => 'sometimes|required|in:unit,weight,consumption',
            'unit_label' => 'nullable|string|max:50',
            'tax_ids' => 'nullable|array',
            'tax_ids.*' => 'exists:taxes,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product->update($request->only([
            'name', 'description', 'barcode', 'price', 'cost_price', 'inventory',
            'image', 'discount_percent', 'pricing_method', 'unit_label', 'warehouse_id', 'is_active'
        ]));

        if ($request->has('tax_ids') && is_array($request->tax_ids)) {
            $taxIds = Tax::where('company_id', $companyId)
                ->whereIn('id', $request->tax_ids)
                ->pluck('id')
                ->toArray();
            $product->taxes()->sync($taxIds);
        }

        $product->load(['taxes', 'warehouse']);

        return response()->json($product);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $product = Product::where('company_id', $companyId)->findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }
}
