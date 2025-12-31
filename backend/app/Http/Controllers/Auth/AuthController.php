<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
            ->where('is_active', true)
            ->with('company')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

            if (!$user->company) {
                throw ValidationException::withMessages([
                    'email' => ['El usuario no tiene una empresa asociada.'],
                ]);
            }

        if (!$user->company->is_active) {
            throw ValidationException::withMessages([
                'email' => ['La empresa está inactiva.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company' => [
                        'id' => $user->company->id ?? null,
                        'name' => $user->company->name ?? null,
                        'tax_id' => $user->company->tax_id ?? null,
                        'address' => $user->company->address ?? null,
                        'phone' => $user->company->phone ?? null,
                        'email' => $user->company->email ?? null,
                        'logo_url' => $user->company->logo_url ?? null,
                        'footer_note' => $user->company->footer_note ?? null,
                        'electronicInvoicingEnabled' => $user->company->electronic_invoicing_enabled ?? false,
                ],
            ],
            'token' => $token,
        ]);
        } catch (ValidationException $e) {
            Log::warning('Login validation failed: ' . $e->getMessage(), ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Login failed: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Error interno del servidor al intentar iniciar sesión.'], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada exitosamente']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('company');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company' => [
                    'id' => $user->company->id ?? null,
                    'name' => $user->company->name ?? null,
                    'tax_id' => $user->company->tax_id ?? null,
                    'address' => $user->company->address ?? null,
                    'phone' => $user->company->phone ?? null,
                    'email' => $user->company->email ?? null,
                    'logo_url' => $user->company->logo_url ?? null,
                    'footer_note' => $user->company->footer_note ?? null,
                    'electronicInvoicingEnabled' => $user->company->electronic_invoicing_enabled ?? false,
                ],
            ],
        ]);
    }

    public function validateAdminPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['valid' => false], 401);
        }

        return response()->json(['valid' => true]);
    }
}
