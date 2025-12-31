# Seeders - Usuarios de Prueba

## Ejecutar Seeders

### Opción 1: Seeder Completo (Recomendado para primera vez)

Este seeder crea empresas, usuarios, productos, impuestos y clientes de ejemplo:

```bash
php artisan db:seed --class=DatabaseSeeder
```

**Credenciales creadas:**

#### Super Admin
- Email: `superadmin@pos.com`
- Password: `admin123`

#### Empresa 1 - Cafetería El Buen Sabor
- Admin: `maria@buensabor.com` / `admin123`
- Cajero: `carlos@buensabor.com` / `cajero123`
- Cajero: `ana@buensabor.com` / `cajero123`
- Contador: `pedro@buensabor.com` / `contador123`

#### Empresa 2 - Restaurante La Esquina
- Admin: `luis@laesquina.com` / `admin123`
- Cajero: `sofia@laesquina.com` / `cajero123`
- Cajero: `diego@laesquina.com` / `cajero123`

#### Empresa 3 - Tienda de Conveniencia 24/7
- Admin: `laura@tienda24.com` / `admin123`
- Cajero: `roberto@tienda24.com` / `cajero123`

### Opción 2: Solo Usuarios (Si ya tienes empresas)

Si ya tienes empresas creadas y solo quieres agregar usuarios:

```bash
php artisan db:seed --class=CreateTestUsersSeeder
```

Este seeder crea usuarios para todas las empresas existentes con el patrón:
- Admin: `adminX@empresaX.com` / `admin123`
- Cajero A: `cajeroXa@empresaX.com` / `cajero123`
- Cajero B: `cajeroXb@empresaX.com` / `cajero123`
- Contador: `contadorX@empresaX.com` / `contador123`

Donde X es el número de empresa (1, 2, 3, etc.)

## Resetear Base de Datos

Si quieres empezar desde cero:

```bash
php artisan migrate:fresh --seed
```

⚠️ **ADVERTENCIA**: Esto eliminará todos los datos existentes.

## Crear Usuario Manualmente

También puedes crear usuarios manualmente usando Tinker:

```bash
php artisan tinker
```

```php
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Obtener una empresa
$company = Company::first();

// Crear usuario
$user = User::create([
    'company_id' => $company->id,
    'name' => 'Nombre Usuario',
    'email' => 'usuario@empresa.com',
    'password' => Hash::make('password123'),
    'role' => 'cashier', // o 'admin', 'accountant', 'super_admin'
    'is_active' => true,
]);
```

## Roles Disponibles

- `super_admin`: Puede crear empresas y gestionar todo
- `admin`: Puede gestionar usuarios de su empresa
- `cashier`: Puede realizar ventas
- `accountant`: Puede ver reportes

## Notas

- Todas las contraseñas de prueba son simples para facilitar las pruebas
- En producción, usa contraseñas seguras
- Los usuarios están activos por defecto (`is_active = true`)
- Cada usuario pertenece a una empresa específica















