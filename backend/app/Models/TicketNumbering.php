<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketNumbering extends Model
{
    use HasFactory;

    protected $table = 'ticket_numbering';

    protected $fillable = [
        'company_id',
        'prefix',
        'current_number',
    ];

    protected $casts = [
        'current_number' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Obtener el siguiente número de ticket
     */
    public function getNextNumber(): string
    {
        $this->increment('current_number');
        $this->refresh();
        
        $number = str_pad($this->current_number, 8, '0', STR_PAD_LEFT);
        
        if ($this->prefix) {
            return $this->prefix . '-' . $number;
        }
        
        return $number;
    }
}

