<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'price',
        'quantity',
        'weight',
        'unit_label',
        'pricing_method',
        'discount_percent',
        'subtotal',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'weight' => 'decimal:3',
        'discount_percent' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function saleItemLots(): HasMany
    {
        return $this->hasMany(SaleItemLot::class);
    }

    /**
     * Obtener el costo total de venta basado en los lotes vendidos
     */
    public function getTotalCost(): float
    {
        return $this->saleItemLots()->sum('total_cost');
    }
}






