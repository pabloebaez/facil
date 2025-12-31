<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseTax extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'tax_id',
        'tax_name',
        'tax_base',
        'tax_rate',
        'tax_amount',
    ];

    protected $casts = [
        'tax_base' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}







