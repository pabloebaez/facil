<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $request->input('current_company_id', $user->company_id);

        // Super admin puede ver todos los usuarios
        if ($user->isSuperAdmin()) {
            $users = User::with('company')
                ->when($request->has('company_id'), function ($query) use ($request) {
                    return $query->where('company_id', $request->company_id);
                })
                ->get();
        } else {
            // Admin de empresa puede ver usuarios de su empresa
            if (!$user->canManageUsers()) {
                return response()->json(['message' => 'No autorizado'], 403);
            }
            $users = User::where('company_id', $companyId)->get();
        }

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $request->input('current_company_id', $user->company_id);

        // Solo super admin o admin de empresa puede crear usuarios
        if (!$user->isSuperAdmin() && !$user->canManageUsers()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,cashier,accountant',
            'company_id' => $user->isSuperAdmin() ? 'required|exists:companies,id' : 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si no es super admin, usar su empresa
        if (!$user->isSuperAdmin()) {
            $request->merge(['company_id' => $companyId]);
        }

        // No permitir crear super_admin desde aquí
        if ($request->role === 'super_admin') {
            return response()->json(['message' => 'No se puede crear super admin'], 403);
        }

        $newUser = User::create([
            'company_id' => $request->company_id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return response()->json($newUser, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $targetUser = User::findOrFail($id);
        $companyId = $request->input('current_company_id', $user->company_id);

        // Verificar acceso
        if (!$user->isSuperAdmin() && $targetUser->company_id != $companyId) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if (!$user->isSuperAdmin() && !$user->canManageUsers()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|required|in:admin,cashier,accountant',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // No permitir cambiar a super_admin
        if ($request->has('role') && $request->role === 'super_admin' && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $data = $request->all();
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $targetUser->update($data);

        return response()->json($targetUser);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $targetUser = User::findOrFail($id);
        $companyId = $request->input('current_company_id', $user->company_id);

        // Verificar acceso
        if (!$user->isSuperAdmin() && $targetUser->company_id != $companyId) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if (!$user->isSuperAdmin() && !$user->canManageUsers()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // No permitir eliminar super admin
        if ($targetUser->isSuperAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $targetUser->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }
}















