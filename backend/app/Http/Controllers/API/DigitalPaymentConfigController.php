<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DigitalPaymentConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DigitalPaymentConfigController extends Controller
{
    /**
     * Obtener todas las configuraciones de pagos digitales de la empresa
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $configs = DigitalPaymentConfig::where('company_id', $user->company_id)->get();
        
        return response()->json($configs);
    }

    /**
     * Obtener una configuración específica
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $config = DigitalPaymentConfig::where('company_id', $user->company_id)
            ->findOrFail($id);
        
        return response()->json($config);
    }

    /**
     * Crear o actualizar una configuración de pago digital
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_provider' => 'required|in:nequi,daviplata,llave_bre_b',
            'client_id' => 'nullable|string|max:255',
            'client_secret' => 'nullable|string',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string',
            'merchant_id' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'llave_bre_b_value' => 'nullable|string|max:255',
            'environment' => 'nullable|in:sandbox,production',
            'additional_config' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $request->user();
            
            // Buscar si ya existe una configuración para este proveedor
            $config = DigitalPaymentConfig::where('company_id', $user->company_id)
                ->where('payment_provider', $request->payment_provider)
                ->first();

            $data = $request->all();
            $data['company_id'] = $user->company_id;
            
            // Solo actualizar campos que se envían (no sobrescribir con null si no se envía)
            if ($config) {
                // Actualizar solo campos presentes
                foreach ($data as $key => $value) {
                    if ($key !== 'company_id' && $key !== 'payment_provider') {
                        if ($value !== null || in_array($key, ['is_active'])) {
                            $config->$key = $value;
                        }
                    }
                }
                $config->save();
            } else {
                $config = DigitalPaymentConfig::create($data);
            }

            return response()->json($config);
        } catch (\Exception $e) {
            Log::error('Error al guardar configuración de pago digital', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Error al guardar la configuración',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar una configuración existente
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'nullable|string|max:255',
            'client_secret' => 'nullable|string',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string',
            'merchant_id' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'llave_bre_b_value' => 'nullable|string|max:255',
            'environment' => 'nullable|in:sandbox,production',
            'additional_config' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $request->user();
            $config = DigitalPaymentConfig::where('company_id', $user->company_id)
                ->findOrFail($id);

            $config->update($request->all());

            return response()->json($config);
        } catch (\Exception $e) {
            Log::error('Error al actualizar configuración de pago digital', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);

            return response()->json([
                'error' => 'Error al actualizar la configuración',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una configuración
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $config = DigitalPaymentConfig::where('company_id', $user->company_id)
                ->findOrFail($id);

            $config->delete();

            return response()->json(['message' => 'Configuración eliminada exitosamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar configuración de pago digital', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);

            return response()->json([
                'error' => 'Error al eliminar la configuración',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}










