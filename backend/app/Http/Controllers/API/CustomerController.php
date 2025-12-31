<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $customers = Customer::where('company_id', $companyId)->get();

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $validator = Validator::make($request->all(), [
            'doc_type' => 'required|in:cedula,ruc,passport',
            'doc_num' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'history_log' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $customer = Customer::create([
            'company_id' => $companyId,
            'doc_type' => $request->doc_type,
            'doc_num' => $request->doc_num,
            'name' => $request->name,
            'address' => $request->address,
            'email' => $request->email,
            'phone' => $request->phone,
            'history_log' => $request->history_log ?? [],
        ]);

        return response()->json($customer, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $customer = Customer::where('company_id', $companyId)
            ->with(['sales', 'recurringServices'])
            ->findOrFail($id);

        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $customer = Customer::where('company_id', $companyId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'doc_type' => 'sometimes|required|in:cedula,ruc,passport',
            'doc_num' => 'sometimes|required|string|max:50',
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'history_log' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $customer->update($request->only([
            'doc_type', 'doc_num', 'name', 'address', 'email', 'phone', 'history_log'
        ]));

        return response()->json($customer);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $customer = Customer::where('company_id', $companyId)->findOrFail($id);
        $customer->delete();

        return response()->json(['message' => 'Cliente eliminado']);
    }
}















