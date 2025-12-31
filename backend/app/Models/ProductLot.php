<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductLot extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'product_id',
        'purchase_id',
        'purchase_item_id',
        'supplier_id',
        'lot_number',
        'quantity',
        'remaining_quantity',
        'unit_cost',
        'entry_date',
        'expiration_date',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'entry_date' => 'date',
        'expiration_date' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function saleItemLots(): HasMany
    {
        return $this->hasMany(SaleItemLot::class);
    }

    /**
     * Verificar si el lote tiene cantidad disponible
     */
    public function hasAvailableQuantity(): bool
    {
        return $this->remaining_quantity > 0;
    }

    /**
     * Verificar si el lote está vencido
     */
    public function isExpired(): bool
    {
        if (!$this->expiration_date) {
            return false;
        }
        return $this->expiration_date < now()->toDateString();
    }
}
