<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tax_id',
        'address',
        'phone',
        'email',
        'logo_url',
        'footer_note',
        'is_active',
        'electronic_invoicing_enabled',
        'is_tax_responsible',
        'default_interest_rate',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'electronic_invoicing_enabled' => 'boolean',
        'is_tax_responsible' => 'boolean',
        'default_interest_rate' => 'decimal:2',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function taxes(): HasMany
    {
        return $this->hasMany(Tax::class);
    }

    public function cashDrawers(): HasMany
    {
        return $this->hasMany(CashDrawer::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function recurringServices(): HasMany
    {
        return $this->hasMany(RecurringService::class);
    }

    public function documentNumberingRanges(): HasMany
    {
        return $this->hasMany(DocumentNumberingRange::class);
    }

    public function dianProviderConfigs(): HasMany
    {
        return $this->hasMany(DianProviderConfig::class);
    }

    public function digitalPaymentConfigs(): HasMany
    {
        return $this->hasMany(DigitalPaymentConfig::class);
    }
}
