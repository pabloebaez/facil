# Guía de Instalación Completa del Backend Laravel

## Prerrequisitos

- PHP >= 8.1
- Composer instalado
- MySQL/MariaDB instalado y corriendo
- Extensiones PHP: pdo_mysql, mbstring, xml, openssl, tokenizer, json, ctype

## Paso 1: Crear Proyecto Laravel

Si aún no tienes Laravel instalado, ejecuta:

```bash
composer create-project laravel/laravel backend_temp
```

Luego copia los archivos que creamos a la carpeta `backend_temp` y renómbrala a `backend`.

**O mejor aún**, si ya tienes una instalación de Laravel, simplemente copia nuestros archivos a tu proyecto.

## Paso 2: Instalar Dependencias

```bash
cd backend
composer install
```

## Paso 3: Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura:

```env
APP_NAME="POS Multi-Tenant"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_multitenant
DB_USERNAME=root
DB_PASSWORD=tu_password_aqui

FRONTEND_URL=http://localhost:3000

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,localhost:3000
SESSION_DOMAIN=localhost
```

Genera la clave de la aplicación:

```bash
php artisan key:generate
```

## Paso 4: Crear Base de Datos

Crea la base de datos en MySQL:

```sql
CREATE DATABASE pos_multitenant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Paso 5: Ejecutar Migraciones

```bash
php artisan migrate
```

## Paso 6: Instalar Laravel Sanctum

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## Paso 7: Ejecutar Seeders (Crear Usuarios de Prueba)

### Opción A: Seeder Completo (Recomendado)

```bash
php artisan db:seed --class=DatabaseSeeder
```

Esto creará:
- 3 empresas de ejemplo
- 1 super admin
- 9 usuarios con diferentes roles
- Impuestos configurados
- Productos de ejemplo
- Clientes de ejemplo

### Opción B: Solo Usuarios (Si ya tienes empresas)

```bash
php artisan db:seed --class=CreateTestUsersSeeder
```

## Paso 8: Verificar Instalación

Ejecuta el servidor de desarrollo:

```bash
php artisan serve
```

Debería iniciar en `http://localhost:8000`

## Credenciales de Prueba Creadas

### Super Admin
- **Email:** `superadmin@pos.com`
- **Password:** `admin123`

### Empresa 1 - Cafetería El Buen Sabor
- **Admin:** `maria@buensabor.com` / `admin123`
- **Cajero:** `carlos@buensabor.com` / `cajero123`
- **Cajero:** `ana@buensabor.com` / `cajero123`
- **Contador:** `pedro@buensabor.com` / `contador123`

### Empresa 2 - Restaurante La Esquina
- **Admin:** `luis@laesquina.com` / `admin123`
- **Cajero:** `sofia@laesquina.com` / `cajero123`
- **Cajero:** `diego@laesquina.com` / `cajero123`

### Empresa 3 - Tienda de Conveniencia 24/7
- **Admin:** `laura@tienda24.com` / `admin123`
- **Cajero:** `roberto@tienda24.com` / `cajero123`

## Probar el Login

Puedes probar el login con una petición POST a:

```
POST http://localhost:8000/api/login
Content-Type: application/json

{
    "email": "superadmin@pos.com",
    "password": "admin123"
}
```

Deberías recibir un token de autenticación y la información del usuario con su empresa.

## Solución de Problemas

### Error: "Class 'Database\Seeders\DatabaseSeeder' not found"

Asegúrate de que el namespace en `DatabaseSeeder.php` sea correcto y que esté en `database/seeders/`.

### Error: "SQLSTATE[HY000] [1045] Access denied"

Verifica las credenciales de MySQL en el archivo `.env`.

### Error: "SQLSTATE[42S02] Base table or view not found"

Ejecuta las migraciones primero: `php artisan migrate`

### Error: "Target class [EnsureCompanyAccess] does not exist"

Asegúrate de registrar el middleware en `app/Http/Kernel.php`:

```php
protected $routeMiddleware = [
    // ... otros middlewares
    'company.access' => \App\Http\Middleware\EnsureCompanyAccess::class,
];
```

## Estructura de Archivos Necesarios

Asegúrate de tener estos archivos en tu proyecto Laravel:

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/AuthController.php
│   │   │   └── API/
│   │   │       ├── CompanyController.php
│   │   │       └── UserController.php
│   │   ├── Kernel.php
│   │   └── Middleware/
│   │       └── EnsureCompanyAccess.php
│   └── Models/ (todos los modelos)
├── config/
│   ├── cors.php
│   └── sanctum.php
├── database/
│   ├── migrations/ (todas las migraciones)
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── CreateTestUsersSeeder.php
└── routes/
    └── api.php
```

## Próximos Pasos

Una vez que tengas los usuarios creados, puedes:

1. Probar el login desde el frontend React
2. Crear más empresas desde el super admin
3. Crear usuarios desde el admin de cada empresa
4. Comenzar a usar el sistema POS















