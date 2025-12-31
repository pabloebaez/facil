<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringService extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_id',
        'product_id',
        'billing_cycle',
        'start_date',
        'next_due_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'next_due_date' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}















