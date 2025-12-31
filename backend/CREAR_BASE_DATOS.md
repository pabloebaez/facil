# Crear Base de Datos

## El Problema
El error indica que la base de datos `pos_multitenant` no existe.

## Solución

### Opción 1: Desde MySQL Command Line

```bash
mysql -u root -p
```

Luego ejecuta:
```sql
CREATE DATABASE pos_multitenant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Opción 2: Desde PHPMyAdmin o MySQL Workbench

1. Abre PHPMyAdmin o MySQL Workbench
2. Crea una nueva base de datos llamada `pos_multitenant`
3. Usa el collation: `utf8mb4_unicode_ci`

### Opción 3: Desde Laravel Tinker

```bash
php artisan tinker
```

Luego:
```php
DB::statement('CREATE DATABASE IF NOT EXISTS pos_multitenant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
```

## Después de Crear la Base de Datos

1. Ejecuta las migraciones:
   ```bash
   php artisan migrate
   ```

2. Ejecuta los seeders:
   ```bash
   php artisan db:seed --class=DatabaseSeeder
   ```

3. Prueba el login nuevamente















