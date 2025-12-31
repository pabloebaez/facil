<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'customer_id',
        'sale_number',
        'document_type',
        'cufe',
        'dian_status',
        'dian_response',
        'dian_acuse',
        'xml_path',
        'signed_xml_path',
        'dian_errors',
        'dian_sent_at',
        'dian_response_at',
        'subtotal',
        'total_discount_amount',
        'subtotal_after_discounts',
        'total_tax_amount',
        'final_total',
        'tax_breakdown_details',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'total_discount_amount' => 'decimal:2',
        'subtotal_after_discounts' => 'decimal:2',
        'total_tax_amount' => 'decimal:2',
        'final_total' => 'decimal:2',
        'tax_breakdown_details' => 'array',
        'dian_errors' => 'array',
        'dian_sent_at' => 'datetime',
        'dian_response_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(ReturnModel::class);
    }

    /**
     * Obtener el costo total de venta basado en los lotes vendidos (kardex)
     */
    public function getTotalCost(): float
    {
        return $this->items()
            ->with('saleItemLots')
            ->get()
            ->sum(function ($item) {
                return $item->getTotalCost();
            });
    }

    /**
     * Calcular la ganancia bruta de la venta
     */
    public function getGrossProfit(): float
    {
        return $this->final_total - $this->getTotalCost();
    }

    /**
     * Calcular el margen de ganancia porcentual
     */
    public function getProfitMargin(): float
    {
        if ($this->final_total == 0) {
            return 0;
        }
        return ($this->getGrossProfit() / $this->final_total) * 100;
    }
}


