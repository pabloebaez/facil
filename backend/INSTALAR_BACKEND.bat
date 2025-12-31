@echo off
echo ========================================
echo Instalacion del Backend Laravel
echo ========================================
echo.

echo [1/7] Verificando Composer...
composer --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Composer no esta instalado!
    echo Descarga desde: https://getcomposer.org/download/
    pause
    exit /b 1
)
echo OK: Composer encontrado
echo.

echo [2/7] Instalando dependencias de Laravel...
composer install
if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo OK: Dependencias instaladas
echo.

echo [3/7] Configurando variables de entorno...
if not exist .env (
    copy .env.example .env
    echo Archivo .env creado
) else (
    echo Archivo .env ya existe
)
echo.

echo [4/7] Generando clave de aplicacion...
php artisan key:generate
echo.

echo [5/7] Configurando base de datos...
echo IMPORTANTE: Edita el archivo .env y configura:
echo   DB_DATABASE=pos_multitenant
echo   DB_USERNAME=root
echo   DB_PASSWORD=tu_password
echo.
echo Luego crea la base de datos en MySQL:
echo   CREATE DATABASE pos_multitenant;
echo.
pause
echo.

echo [6/7] Ejecutando migraciones...
php artisan migrate
echo.

echo [7/7] Creando usuarios de prueba...
php artisan db:seed --class=DatabaseSeeder
echo.

echo ========================================
echo Instalacion completada!
echo ========================================
echo.
echo Para iniciar el servidor ejecuta:
echo   php artisan serve
echo.
pause















