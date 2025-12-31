# Instalación Completa de Laravel

## Opción 1: Crear Proyecto Laravel Nuevo (Recomendado)

Si prefieres empezar con un proyecto Laravel limpio:

```bash
# Desde la carpeta raíz del proyecto (facil)
cd ..
composer create-project laravel/laravel backend_temp

# Copiar nuestros archivos personalizados
# (migraciones, modelos, controladores, etc.)
```

## Opción 2: Completar la Instalación Actual

Si prefieres usar lo que ya tenemos, necesitas crear algunos archivos más:

### 1. Crear estructura de carpetas faltantes

```bash
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache
```

### 2. Configurar permisos (Linux/Mac)

```bash
chmod -R 775 storage bootstrap/cache
```

### 3. Generar clave de aplicación

```bash
php artisan key:generate
```

### 4. Limpiar caché

```bash
php artisan config:clear
php artisan cache:clear
```

## Opción 3: Usar Laravel Sail (Docker) - Más Fácil

Si tienes Docker instalado:

```bash
composer require laravel/sail --dev
php artisan sail:install
./vendor/bin/sail up
```

## Comando para Iniciar el Backend

Una vez que todo esté configurado:

```bash
cd backend
php artisan serve
```

El servidor iniciará en: **http://localhost:8000**

## Verificar que Funciona

Abre: **http://localhost:8000**

Deberías ver información de la API o un JSON.















