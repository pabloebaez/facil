# Reset de Productos, Ventas y Devoluciones

Este comando resetea todos los productos, ventas y devoluciones en la base de datos y crea productos nuevos con precios reales en pesos colombianos, cada uno con una compra inicial (lote inicial).

## Uso

```bash
php artisan products:reset
```

## ¿Qué hace este comando?

1. **Elimina todos los datos relacionados:**
   - Productos y sus relaciones (impuestos, lotes, etc.)
   - Ventas y sus items
   - Devoluciones
   - Compras y sus items
   - Lotes de productos
   - Relaciones producto-proveedor

2. **Crea productos nuevos con precios reales en pesos colombianos:**
   - Bebidas (Coca Cola, Agua, Cerveza, Jugos)
   - Snacks y Dulces (Papas, Chocorramo, Chicles)
   - Productos de Aseo (Jabón, Shampoo, Crema Dental)
   - Productos de Panadería (Pan, Galletas)
   - Productos por peso (Arroz, Azúcar, Aceite)
   - Lácteos (Leche, Yogurt, Queso)

3. **Crea compras iniciales para cada producto:**
   - Cada producto tiene una compra inicial asociada
   - Se crea un lote inicial para cada producto
   - El inventario se actualiza según la cantidad de la compra inicial
   - Se registra la relación con el proveedor

## Productos creados

El seeder crea aproximadamente 18 productos con precios reales en pesos colombianos, incluyendo:

- **Bebidas:** Coca Cola ($2,500), Agua ($1,500), Cerveza ($3,500), Jugos ($2,800)
- **Snacks:** Papas Margarita ($2,000), Chocorramo ($1,500), Chicles ($1,200)
- **Aseo:** Jabón Protex ($3,500), Shampoo Pantene ($12,000), Crema Dental ($4,500)
- **Panadería:** Pan Bimbo ($5,500), Galletas Festival ($3,200)
- **Básicos:** Arroz ($4,500), Azúcar ($3,800), Aceite ($8,500)
- **Lácteos:** Leche Alpina ($4,200), Yogurt ($5,500), Queso ($6,500)

Cada producto tiene:
- Precio de venta en pesos colombianos
- Costo de compra (precio unitario)
- Cantidad inicial en inventario
- Compra inicial registrada
- Lote inicial creado

## Advertencia

⚠️ **Este comando elimina TODOS los productos, ventas y devoluciones existentes.** Asegúrate de hacer un backup antes de ejecutarlo si tienes datos importantes.

## Ejecución

El comando pedirá confirmación antes de proceder:

```bash
php artisan products:reset

🔄 Iniciando reset de productos, ventas y devoluciones...
⚠️  Esta acción eliminará todos los productos, ventas y devoluciones existentes.
¿Estás seguro de que deseas continuar? (yes/no):
```

Responde `yes` para continuar o `no` para cancelar.









