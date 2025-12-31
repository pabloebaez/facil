# Inicio Rápido del Backend

## Paso 1: Instalar Laravel y Dependencias

```bash
cd backend
composer install
```

## Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Generar clave de aplicación
php artisan key:generate
```

## Paso 3: Editar .env

Abre `backend/.env` y configura:

```env
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

## Paso 4: Crear Base de Datos

En MySQL:

```sql
CREATE DATABASE pos_multitenant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Paso 5: Ejecutar Migraciones

```bash
php artisan migrate
```

## Paso 6: Instalar Sanctum

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## Paso 7: Crear Usuarios de Prueba

```bash
php artisan db:seed --class=DatabaseSeeder
```

## Paso 8: Iniciar Servidor

```bash
php artisan serve
```

El servidor iniciará en `http://localhost:8000`

## Verificar que Funciona

Abre en el navegador: `http://localhost:8000`

Deberías ver un JSON con información de la API.

## Probar Login

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"superadmin@pos.com\",\"password\":\"admin123\"}"
```

## Solución de Problemas

### Error: "composer: command not found"
Instala Composer desde: https://getcomposer.org/

### Error: "PHP version"
Necesitas PHP >= 8.1. Verifica con: `php -v`

### Error: "Class not found"
Ejecuta: `composer dump-autoload`

### Error: "Access denied" en MySQL
Verifica las credenciales en `.env`

### Error: "No application encryption key"
Ejecuta: `php artisan key:generate`















