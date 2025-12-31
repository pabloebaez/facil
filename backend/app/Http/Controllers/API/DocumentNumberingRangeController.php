<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DocumentNumberingRange;
use App\Services\DocumentNumberingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DocumentNumberingRangeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $ranges = DocumentNumberingRange::where('company_id', $companyId)
            ->orderBy('document_type')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($ranges);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Solo admin y super_admin pueden crear rangos
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'document_type' => 'required|in:invoice,credit_note,debit_note',
            'prefix' => 'nullable|string|max:4|regex:/^[A-Z0-9]+$/',
            'authorization_number' => 'required|string|max:50',
            'authorization_date' => 'required|date',
            'valid_from' => 'required|date',
            'valid_to' => 'required|date|after:valid_from',
            'range_from' => 'required|integer|min:1',
            'range_to' => 'required|integer|gt:range_from',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar que no haya otro rango activo del mismo tipo en el mismo período
        $overlappingRange = DocumentNumberingRange::where('company_id', $companyId)
            ->where('document_type', $request->document_type)
            ->where('is_active', true)
            ->where(function ($query) use ($request) {
                $query->whereBetween('valid_from', [$request->valid_from, $request->valid_to])
                    ->orWhereBetween('valid_to', [$request->valid_from, $request->valid_to])
                    ->orWhere(function ($q) use ($request) {
                        $q->where('valid_from', '<=', $request->valid_from)
                          ->where('valid_to', '>=', $request->valid_to);
                    });
            })
            ->first();

        if ($overlappingRange) {
            return response()->json([
                'error' => 'Ya existe un rango activo para este tipo de documento en el período especificado'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $range = DocumentNumberingRange::create([
                'company_id' => $companyId,
                'document_type' => $request->document_type,
                'prefix' => strtoupper($request->prefix ?? ''),
                'authorization_number' => $request->authorization_number,
                'authorization_date' => $request->authorization_date,
                'valid_from' => $request->valid_from,
                'valid_to' => $request->valid_to,
                'range_from' => $request->range_from,
                'range_to' => $request->range_to,
                'current_number' => $request->range_from - 1, // Inicia en el número anterior al primero
                'is_active' => true,
                'notes' => $request->notes,
            ]);

            DB::commit();

            return response()->json($range, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al crear el rango de numeración',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Solo admin y super_admin pueden actualizar rangos
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $range = DocumentNumberingRange::where('company_id', $companyId)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'prefix' => 'nullable|string|max:4|regex:/^[A-Z0-9]+$/',
            'authorization_number' => 'sometimes|required|string|max:50',
            'authorization_date' => 'sometimes|required|date',
            'valid_from' => 'sometimes|required|date',
            'valid_to' => 'sometimes|required|date|after:valid_from',
            'range_from' => 'sometimes|required|integer|min:1',
            'range_to' => 'sometimes|required|integer|gt:range_from',
            'is_active' => 'sometimes|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // No permitir modificar si ya se han usado números del rango
        if ($range->current_number >= $range->range_from && $request->has('range_from')) {
            return response()->json([
                'error' => 'No se puede modificar el rango inicial porque ya se han usado números de este rango'
            ], 422);
        }

        DB::beginTransaction();
        try {
            if ($request->has('prefix')) {
                $range->prefix = strtoupper($request->prefix);
            }
            if ($request->has('authorization_number')) {
                $range->authorization_number = $request->authorization_number;
            }
            if ($request->has('authorization_date')) {
                $range->authorization_date = $request->authorization_date;
            }
            if ($request->has('valid_from')) {
                $range->valid_from = $request->valid_from;
            }
            if ($request->has('valid_to')) {
                $range->valid_to = $request->valid_to;
            }
            if ($request->has('range_from')) {
                $range->range_from = $request->range_from;
                $range->current_number = $request->range_from - 1;
            }
            if ($request->has('range_to')) {
                $range->range_to = $request->range_to;
            }
            if ($request->has('is_active')) {
                $range->is_active = $request->is_active;
            }
            if ($request->has('notes')) {
                $range->notes = $request->notes;
            }

            $range->save();

            DB::commit();

            return response()->json($range);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al actualizar el rango de numeración',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        $range = DocumentNumberingRange::where('company_id', $companyId)
            ->findOrFail($id);

        return response()->json($range);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;

        // Solo admin y super_admin pueden eliminar rangos
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $range = DocumentNumberingRange::where('company_id', $companyId)
            ->findOrFail($id);

        // No permitir eliminar si ya se han usado números del rango
        if ($range->current_number >= $range->range_from) {
            return response()->json([
                'error' => 'No se puede eliminar el rango porque ya se han usado números de este rango. Puede desactivarlo en su lugar.'
            ], 422);
        }

        $range->delete();

        return response()->json(['message' => 'Rango eliminado exitosamente']);
    }
}















