# Solución de Problemas - Login No Funciona

## Checklist de Verificación

### 1. Verificar que el Backend esté Corriendo

```bash
cd backend
php artisan serve
```

Debería iniciar en `http://localhost:8000`

### 2. Verificar la URL de la API

Abre la consola del navegador (F12) y verifica:
- La URL que se está usando: `http://localhost:8000/api/login`
- Si hay errores de CORS
- Si hay errores de conexión

### 3. Probar el Login con cURL o Postman

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"superadmin@pos.com","password":"admin123"}'
```

Si esto funciona, el problema está en el frontend. Si no funciona, el problema está en el backend.

### 4. Verificar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto React con:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

Luego reinicia el servidor de desarrollo:
```bash
npm start
```

### 5. Verificar CORS en Backend

En `backend/config/cors.php` debe estar configurado:

```php
'allowed_origins' => ['http://localhost:3000'],
'supports_credentials' => true,
```

### 6. Verificar que los Usuarios Existan

```bash
cd backend
php artisan tinker
```

```php
User::all(['id', 'name', 'email', 'role', 'is_active']);
```

### 7. Verificar la Consola del Navegador

Abre las herramientas de desarrollador (F12) y revisa:
- **Console**: Busca errores de JavaScript
- **Network**: Verifica las peticiones HTTP
  - ¿Se está haciendo la petición?
  - ¿Qué status code devuelve?
  - ¿Qué respuesta viene del servidor?

## Errores Comunes

### Error: "Network Error" o "ERR_CONNECTION_REFUSED"

**Causa**: El backend no está corriendo o la URL es incorrecta.

**Solución**:
1. Verifica que `php artisan serve` esté corriendo
2. Verifica la URL en `.env`: `REACT_APP_API_URL=http://localhost:8000/api`
3. Reinicia el servidor React

### Error: "CORS policy" o "Access-Control-Allow-Origin"

**Causa**: CORS no está configurado correctamente.

**Solución**:
1. Verifica `backend/config/cors.php`
2. Asegúrate de que `FRONTEND_URL=http://localhost:3000` esté en `.env` del backend
3. Limpia la caché: `php artisan config:clear`

### Error: "401 Unauthorized" o "Las credenciales proporcionadas son incorrectas"

**Causa**: Email o contraseña incorrectos, o el usuario no existe.

**Solución**:
1. Verifica que los usuarios existan: `php artisan tinker` → `User::all()`
2. Si no existen, ejecuta: `php artisan db:seed --class=DatabaseSeeder`
3. Usa las credenciales correctas:
   - Super Admin: `superadmin@pos.com` / `admin123`

### Error: "500 Internal Server Error"

**Causa**: Error en el servidor backend.

**Solución**:
1. Revisa los logs: `backend/storage/logs/laravel.log`
2. Verifica que las migraciones estén ejecutadas: `php artisan migrate`
3. Verifica que Sanctum esté instalado: `composer require laravel/sanctum`

### El Login Funciona pero No Redirige

**Causa**: Problema con React Router o localStorage.

**Solución**:
1. Abre la consola del navegador y verifica:
   - ¿Se guardó el token? `localStorage.getItem('auth_token')`
   - ¿Se guardó el usuario? `localStorage.getItem('user')`
2. Verifica que React Router esté instalado: `npm list react-router-dom`

## Debugging Paso a Paso

1. **Abre la consola del navegador (F12)**
2. **Intenta hacer login**
3. **Revisa la pestaña "Network"**:
   - Busca la petición a `/api/login`
   - Haz clic en ella
   - Revisa:
     - **Request**: ¿Se enviaron los datos correctos?
     - **Response**: ¿Qué devolvió el servidor?
     - **Headers**: ¿Hay algún problema con CORS?

4. **Revisa la consola**:
   - Busca mensajes de error
   - Busca los `console.log` que agregamos

## Prueba Rápida

Ejecuta esto en la consola del navegador después de intentar login:

```javascript
// Verificar token
console.log('Token:', localStorage.getItem('auth_token'));

// Verificar usuario
console.log('User:', localStorage.getItem('user'));

// Probar petición manual
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    email: 'superadmin@pos.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => console.log('Respuesta:', data))
.catch(err => console.error('Error:', err));
```

## Si Nada Funciona

1. Verifica que todas las dependencias estén instaladas:
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   composer install
   ```

2. Verifica que la base de datos esté creada y las migraciones ejecutadas:
   ```bash
   php artisan migrate
   php artisan db:seed --class=DatabaseSeeder
   ```

3. Reinicia ambos servidores:
   ```bash
   # Terminal 1 - Backend
   cd backend
   php artisan serve
   
   # Terminal 2 - Frontend
   npm start
   ```















