<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DianProviderConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DianProviderConfigController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $configs = DianProviderConfig::where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($configs);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Solo admin y super_admin pueden crear configuraciones
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'provider_name' => 'required|string|max:100',
            'api_url' => 'required|url',
            'api_key' => 'nullable|string',
            'api_secret' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'certificate_path' => 'nullable|string',
            'certificate_password' => 'nullable|string',
            'environment' => 'required|in:test,production',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si se marca como activa, desactivar las demás
        if ($request->is_active) {
            DianProviderConfig::where('company_id', $companyId)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $config = DianProviderConfig::create([
            'company_id' => $companyId,
            'provider_name' => $request->provider_name,
            'api_url' => $request->api_url,
            'api_key' => $request->api_key,
            'api_secret' => $request->api_secret,
            'username' => $request->username,
            'password' => $request->password,
            'certificate_path' => $request->certificate_path,
            'certificate_password' => $request->certificate_password,
            'environment' => $request->environment,
            'is_active' => $request->is_active ?? false,
        ]);

        return response()->json($config, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $config = DianProviderConfig::where('company_id', $companyId)
            ->findOrFail($id);

        return response()->json($config);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Solo admin y super_admin pueden actualizar
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $config = DianProviderConfig::where('company_id', $companyId)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'provider_name' => 'sometimes|required|string|max:100',
            'api_url' => 'sometimes|required|url',
            'api_key' => 'nullable|string',
            'api_secret' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'certificate_path' => 'nullable|string',
            'certificate_password' => 'nullable|string',
            'environment' => 'sometimes|required|in:test,production',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si se marca como activa, desactivar las demás
        if ($request->has('is_active') && $request->is_active) {
            DianProviderConfig::where('company_id', $companyId)
                ->where('id', '!=', $id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $config->update($request->all());

        return response()->json($config);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Solo admin y super_admin pueden eliminar
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $config = DianProviderConfig::where('company_id', $companyId)
            ->findOrFail($id);

        $config->delete();

        return response()->json(['message' => 'Configuración eliminada']);
    }
}














