# Comandos para Correr el Backend

## Iniciar el Servidor

```bash
cd backend
php artisan serve
```

El servidor iniciará en: **http://localhost:8000**

## En Windows (Más Fácil)

Doble clic en el archivo: **`INICIAR_BACKEND.bat`**

O desde PowerShell/CMD:
```bash
cd backend
.\INICIAR_BACKEND.bat
```

## Verificar que Funciona

Abre en el navegador: **http://localhost:8000**

Deberías ver un JSON con información de la API.

## Probar el Login

```bash
curl -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d "{\"email\":\"superadmin@pos.com\",\"password\":\"admin123\"}"
```

## Antes de Iniciar el Servidor

Asegúrate de haber ejecutado:

1. **Instalar dependencias:**
   ```bash
   composer install
   ```

2. **Configurar .env:**
   - Edita `backend/.env`
   - Configura `DB_PASSWORD` con tu contraseña de MySQL

3. **Crear base de datos:**
   ```sql
   CREATE DATABASE pos_multitenant;
   ```

4. **Ejecutar migraciones:**
   ```bash
   php artisan migrate
   ```

5. **Crear usuarios de prueba:**
   ```bash
   php artisan db:seed --class=DatabaseSeeder
   ```

## Detener el Servidor

Presiona **Ctrl+C** en la terminal donde está corriendo.

## Cambiar Puerto

Si el puerto 8000 está ocupado:

```bash
php artisan serve --port=8001
```

Luego actualiza `REACT_APP_API_URL` en el `.env` del frontend.















