# Guía de Configuración - Sistema POS Multi-Tenant

## Backend (Laravel)

### 1. Instalación

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

### 2. Configurar Base de Datos

Editar `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_multitenant
DB_USERNAME=root
DB_PASSWORD=tu_password
```

### 3. Ejecutar Migraciones

```bash
php artisan migrate
```

### 4. Crear Usuario Super Admin

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
    'password' => Hash::make('password123'),
    'role' => 'super_admin',
]);
```

### 5. Configurar CORS

En `config/cors.php`:
```php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:3000'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### 6. Iniciar Servidor

```bash
php artisan serve
```

## Frontend (React)

### 1. Instalar Dependencias

```bash
npm install axios react-router-dom
```

### 2. Configurar Variables de Entorno

Crear archivo `.env`:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. Iniciar Aplicación

```bash
npm start
```

## Estructura Multi-Tenant

### Características:

1. **Separación de Datos**: Cada empresa tiene su propio `company_id` en todas las tablas
2. **Autenticación**: El login detecta automáticamente la empresa del usuario
3. **Roles**:
   - `super_admin`: Puede crear empresas y gestionar todo
   - `admin`: Puede gestionar usuarios de su empresa
   - `cashier`: Puede realizar ventas
   - `accountant`: Puede ver reportes

4. **Seguridad**: 
   - Middleware valida que usuarios solo accedan a su empresa
   - Super admin puede acceder a todas las empresas

## Próximos Pasos

1. Completar controladores de API para:
   - Productos
   - Ventas
   - Clientes
   - Impuestos
   - Caja
   - Pagos recurrentes

2. Modificar componentes React para usar API en lugar de estado local

3. Implementar manejo de errores y loading states

4. Agregar validaciones en frontend y backend















