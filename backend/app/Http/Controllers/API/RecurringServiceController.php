<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RecurringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecurringServiceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $query = RecurringService::where('company_id', $companyId)
            ->with('customer');

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $services = $query->get();

        return response()->json($services);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'billing_cycle' => 'required|in:daily,weekly,monthly,yearly',
            'start_date' => 'required|date',
            'next_due_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $service = RecurringService::create([
            'company_id' => $companyId,
            'customer_id' => $request->customer_id,
            'product_id' => $request->product_id,
            'billing_cycle' => $request->billing_cycle,
            'start_date' => $request->start_date,
            'next_due_date' => $request->next_due_date ?? $request->start_date,
            'status' => $request->status ?? 'active',
        ]);

        $service->load('customer');

        return response()->json($service, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $service = RecurringService::where('company_id', $companyId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'product_id' => 'nullable|exists:products,id',
            'billing_cycle' => 'sometimes|required|in:daily,weekly,monthly,yearly',
            'start_date' => 'sometimes|required|date',
            'next_due_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $service->update($request->only([
            'product_id', 'billing_cycle', 'start_date', 'next_due_date', 'status'
        ]));

        $service->load('customer');

        return response()->json($service);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $service = RecurringService::where('company_id', $companyId)->findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Servicio recurrente eliminado']);
    }
}

