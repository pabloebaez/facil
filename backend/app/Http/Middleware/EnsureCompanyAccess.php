<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Super admin puede acceder a cualquier empresa
        if ($user->isSuperAdmin()) {
            // Si hay un parámetro company_id en la request, validar que existe
            if ($request->has('company_id')) {
                $companyId = $request->input('company_id');
                if (!$user->company_id && $companyId) {
                    // Super admin puede especificar empresa
                    $request->merge(['current_company_id' => $companyId]);
                }
            }
            return $next($request);
        }

        // Usuarios normales solo pueden acceder a su empresa
        $request->merge(['current_company_id' => $user->company_id]);
        
        // Validar que cualquier operación sea sobre su empresa
        if ($request->has('company_id') && $request->input('company_id') != $user->company_id) {
            return response()->json(['message' => 'No tienes acceso a esta empresa'], 403);
        }

        return $next($request);
    }
}















