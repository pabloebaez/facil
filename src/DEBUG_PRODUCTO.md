# Debug: Agregar Producto

## Pasos para depurar:

1. Abre la consola del navegador (F12)
2. Intenta crear un producto
3. Revisa los logs en la consola:
   - "Creando producto con datos:" - muestra los datos del formulario
   - "Enviando a API:" - muestra los datos que se envían a la API
   - "Respuesta de API:" - muestra la respuesta del servidor
   - "Productos recargados:" - muestra la lista actualizada

## Posibles problemas:

1. **Error 401**: No estás autenticado - recarga la página y vuelve a iniciar sesión
2. **Error 422**: Errores de validación - revisa los campos requeridos
3. **Error 500**: Error del servidor - revisa los logs del backend
4. **Sin error pero no aparece**: El producto se creó pero no se recargó la lista

## Verificar en el backend:

```bash
cd backend
php artisan tinker
```

Luego ejecuta:
```php
$products = App\Models\Product::with('company')->get();
$products->each(function($p) { echo "ID: {$p->id}, Nombre: {$p->name}, Empresa: {$p->company->name}\n"; });
```

Esto mostrará todos los productos en la base de datos.

