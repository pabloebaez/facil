# Pasos para Instalar y Ejecutar el Backend

## ⚠️ IMPORTANTE: Necesitas tener instalado

- PHP >= 8.1
- Composer
- MySQL/MariaDB

## Paso 1: Instalar Dependencias de Laravel

Abre una terminal en la carpeta `backend` y ejecuta:

```bash
cd backend
composer install
```

**Si no tienes Composer instalado:**
1. Descarga desde: https://getcomposer.org/download/
2. O usa: `php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"`
3. Ejecuta: `php composer-setup.php`

## Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Generar clave de aplicación
php artisan key:generate
```

## Paso 3: Editar .env

Abre el archivo `backend/.env` con un editor de texto y configura:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_multitenant
DB_USERNAME=root
DB_PASSWORD=tu_password_de_mysql_aqui
```

## Paso 4: Crear Base de Datos

Abre MySQL (phpMyAdmin, MySQL Workbench, o línea de comandos) y ejecuta:

```sql
CREATE DATABASE pos_multitenant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Paso 5: Ejecutar Migraciones

```bash
php artisan migrate
```

## Paso 6: Publicar Configuración de Sanctum

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## Paso 7: Crear Usuarios de Prueba

```bash
php artisan db:seed --class=DatabaseSeeder
```

## Paso 8: Iniciar el Servidor

```bash
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

## ✅ Verificar que Funciona

1. Abre en el navegador: `http://localhost:8000`
   - Deberías ver un JSON con información de la API

2. Prueba el login con Postman o cURL:
```bash
curl -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d "{\"email\":\"superadmin@pos.com\",\"password\":\"admin123\"}"
```

## 🔧 Solución de Problemas Comunes

### Error: "composer: command not found"
- Instala Composer desde https://getcomposer.org/
- O usa: `php composer.phar install` si descargaste composer.phar

### Error: "PHP version"
- Necesitas PHP >= 8.1
- Verifica con: `php -v`
- Descarga desde: https://www.php.net/downloads.php

### Error: "Access denied" en MySQL
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Prueba conectarte manualmente: `mysql -u root -p`

### Error: "No application encryption key"
- Ejecuta: `php artisan key:generate`

### Error: "Class not found"
- Ejecuta: `composer dump-autoload`

### Error: "Target class does not exist"
- Verifica que todos los archivos estén en las carpetas correctas
- Ejecuta: `composer install` de nuevo

## 📝 Nota para Windows PowerShell

Si usas PowerShell, algunos comandos pueden ser diferentes:

```powershell
# En lugar de &&
cd backend; composer install

# En lugar de copy
Copy-Item .env.example .env
```

## 🚀 Una vez que el Backend Esté Corriendo

1. El frontend debería poder conectarse automáticamente
2. Prueba el login desde la interfaz web
3. Verifica la consola del navegador para ver los logs















