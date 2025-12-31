<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class DigitalPaymentConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'payment_provider',
        'client_id',
        'client_secret',
        'api_key',
        'api_secret',
        'merchant_id',
        'phone_number',
        'llave_bre_b_value',
        'access_token',
        'refresh_token',
        'environment',
        'additional_config',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'additional_config' => 'array',
    ];

    protected $hidden = [
        'client_secret',
        'api_secret',
        'access_token',
        'refresh_token',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Obtener el client secret desencriptado
     */
    public function getDecryptedClientSecret(): ?string
    {
        return $this->client_secret ? Crypt::decryptString($this->client_secret) : null;
    }

    /**
     * Obtener el API secret desencriptado
     */
    public function getDecryptedApiSecret(): ?string
    {
        return $this->api_secret ? Crypt::decryptString($this->api_secret) : null;
    }

    /**
     * Obtener el access token desencriptado
     */
    public function getDecryptedAccessToken(): ?string
    {
        return $this->access_token ? Crypt::decryptString($this->access_token) : null;
    }

    /**
     * Obtener el refresh token desencriptado
     */
    public function getDecryptedRefreshToken(): ?string
    {
        return $this->refresh_token ? Crypt::decryptString($this->refresh_token) : null;
    }

    /**
     * Encriptar y guardar el client secret
     */
    public function setClientSecretAttribute($value)
    {
        $this->attributes['client_secret'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Encriptar y guardar el API secret
     */
    public function setApiSecretAttribute($value)
    {
        $this->attributes['api_secret'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Encriptar y guardar el access token
     */
    public function setAccessTokenAttribute($value)
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Encriptar y guardar el refresh token
     */
    public function setRefreshTokenAttribute($value)
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }
}
