<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashDrawer extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'date',
        'initial_amount',
        'sales_total',
        'returns_total',
        'expenses_total',
        'current_amount',
        'is_closed',
        'closed_at',
    ];

    protected $casts = [
        'date' => 'date',
        'initial_amount' => 'decimal:2',
        'sales_total' => 'decimal:2',
        'returns_total' => 'decimal:2',
        'expenses_total' => 'decimal:2',
        'current_amount' => 'decimal:2',
        'is_closed' => 'boolean',
        'closed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}















