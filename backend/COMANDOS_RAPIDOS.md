# Comandos Rápidos - Backend Laravel

## Instalación Inicial

```bash
# 1. Instalar dependencias
composer install

# 2. Configurar .env
cp .env.example .env
php artisan key:generate

# 3. Crear base de datos (en MySQL)
mysql -u root -p
CREATE DATABASE pos_multitenant;

# 4. Ejecutar migraciones
php artisan migrate

# 5. Publicar Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 6. Crear usuarios de prueba
php artisan db:seed --class=DatabaseSeeder
```

## Comandos Útiles

### Resetear Base de Datos Completa
```bash
php artisan migrate:fresh --seed
```

### Solo Ejecutar Seeders
```bash
php artisan db:seed --class=DatabaseSeeder
php artisan db:seed --class=CreateTestUsersSeeder
```

### Crear Nuevo Usuario Manualmente
```bash
php artisan tinker
```

```php
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$company = Company::first();
User::create([
    'company_id' => $company->id,
    'name' => 'Test User',
    'email' => 'test@test.com',
    'password' => Hash::make('password123'),
    'role' => 'cashier',
    'is_active' => true,
]);
```

### Ver Usuarios Creados
```bash
php artisan tinker
```

```php
User::with('company')->get(['id', 'name', 'email', 'role', 'company_id']);
```

### Iniciar Servidor
```bash
php artisan serve
```

### Limpiar Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## Verificar Instalación

### Probar Login con cURL
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@pos.com","password":"admin123"}'
```

### Probar Endpoint Protegido
```bash
# Primero obtén el token del login anterior
TOKEN="tu_token_aqui"

curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```















