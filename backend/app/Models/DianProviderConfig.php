<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class DianProviderConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'provider_name',
        'api_url',
        'api_key',
        'api_secret',
        'username',
        'password',
        'certificate_path',
        'certificate_password',
        'environment',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'api_secret',
        'password',
        'certificate_password',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Obtener el secreto de API desencriptado
     */
    public function getDecryptedApiSecret(): ?string
    {
        return $this->api_secret ? Crypt::decryptString($this->api_secret) : null;
    }

    /**
     * Obtener la contraseña desencriptada
     */
    public function getDecryptedPassword(): ?string
    {
        return $this->password ? Crypt::decryptString($this->password) : null;
    }

    /**
     * Obtener la contraseña del certificado desencriptada
     */
    public function getDecryptedCertificatePassword(): ?string
    {
        return $this->certificate_password ? Crypt::decryptString($this->certificate_password) : null;
    }

    /**
     * Establecer el secreto de API encriptado
     */
    public function setApiSecretAttribute($value): void
    {
        $this->attributes['api_secret'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Establecer la contraseña encriptada
     */
    public function setPasswordAttribute($value): void
    {
        $this->attributes['password'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Establecer la contraseña del certificado encriptada
     */
    public function setCertificatePasswordAttribute($value): void
    {
        $this->attributes['certificate_password'] = $value ? Crypt::encryptString($value) : null;
    }
}





