# Backend Laravel - Sistema POS Multi-Tenant

## Instalación

1. Instalar dependencias:
```bash
composer install
```

2. Configurar `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_multitenant
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
SESSION_DOMAIN=localhost
```

3. Ejecutar migraciones:
```bash
php artisan migrate
```

4. Crear usuario super admin (seeder o manualmente):
```bash
php artisan tinker
```

```php
$company = App\Models\Company::create([
    'name' => 'Sistema Principal',
    'is_active' => true,
]);

$user = App\Models\User::create([
    'company_id' => $company->id,
    'name' => 'Super Admin',
    'email' => 'admin@pos.com',
    'password' => Hash::make('password'),
    'role' => 'super_admin',
]);
```

## Estructura Multi-Tenant

- Cada empresa tiene su propio `company_id`
- Todos los modelos tienen relación con `Company`
- El middleware `EnsureCompanyAccess` valida que los usuarios solo accedan a su empresa
- Super admin puede acceder a todas las empresas

## Roles

- `super_admin`: Puede crear empresas y gestionar todo
- `admin`: Puede gestionar usuarios de su empresa
- `cashier`: Cajero, puede realizar ventas
- `accountant`: Contador, puede ver reportes

## API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/me` - Obtener usuario actual

### Empresas
- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Crear empresa (solo super admin)
- `GET /api/companies/{id}` - Ver empresa
- `PUT /api/companies/{id}` - Actualizar empresa

### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario















