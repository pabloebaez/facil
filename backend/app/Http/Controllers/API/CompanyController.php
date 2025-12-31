<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $company = Company::findOrFail($user->company_id);

        return response()->json($company);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        // Los usuarios solo pueden ver su propia empresa
        if ($id != $user->company_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $company = Company::findOrFail($id);

        return response()->json($company);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        // Los usuarios solo pueden actualizar su propia empresa
        if ($id != $user->company_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $company = Company::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'logo_url' => 'nullable|string',
            'footer_note' => 'nullable|string',
            'electronic_invoicing_enabled' => 'sometimes|boolean',
            'is_tax_responsible' => 'sometimes|boolean',
            'default_interest_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($request->only([
            'name', 'tax_id', 'address', 'phone', 'email', 'logo_url', 'footer_note',
            'electronic_invoicing_enabled', 'is_tax_responsible', 'default_interest_rate'
        ]));

        return response()->json($company);
    }
}
