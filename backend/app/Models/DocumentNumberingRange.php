<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentNumberingRange extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'document_type',
        'prefix',
        'authorization_number',
        'authorization_date',
        'valid_from',
        'valid_to',
        'range_from',
        'range_to',
        'current_number',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'authorization_date' => 'date',
        'valid_from' => 'date',
        'valid_to' => 'date',
        'range_from' => 'integer',
        'range_to' => 'integer',
        'current_number' => 'integer',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Obtener el siguiente número consecutivo del rango
     */
    public function getNextNumber(): string
    {
        if (!$this->is_active) {
            throw new \Exception('El rango de numeración no está activo');
        }

        $today = now()->toDateString();
        if ($today < $this->valid_from->toDateString() || $today > $this->valid_to->toDateString()) {
            throw new \Exception('El rango de numeración está fuera de su período de vigencia');
        }

        $nextNumber = $this->current_number + 1;

        if ($nextNumber > $this->range_to) {
            throw new \Exception('Se ha alcanzado el límite del rango de numeración autorizado');
        }

        // Formato: PREFIJO-NÚMERO (ej: FAC-00000001)
        $number = str_pad($nextNumber, 8, '0', STR_PAD_LEFT);
        
        if ($this->prefix) {
            return $this->prefix . '-' . $number;
        }

        return $number;
    }

    /**
     * Incrementar el contador después de usar un número
     */
    public function incrementNumber(): void
    {
        $this->current_number++;
        $this->save();
    }
}















