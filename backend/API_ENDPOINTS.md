# Endpoints API Disponibles

Todos los endpoints requieren autenticación mediante token Bearer y están protegidos por el middleware `company.access` que asegura que cada usuario solo acceda a datos de su empresa.

## Autenticación

- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión (requiere auth)
- `GET /api/me` - Obtener usuario actual (requiere auth)

## Productos

- `GET /api/products` - Listar productos de la empresa
- `POST /api/products` - Crear producto
- `GET /api/products/{id}` - Obtener producto
- `PUT /api/products/{id}` - Actualizar producto
- `DELETE /api/products/{id}` - Eliminar producto

**Body para crear/actualizar:**
```json
{
  "name": "Producto ejemplo",
  "price": 10.50,
  "cost_price": 5.00,
  "inventory": 100,
  "image": "url_imagen",
  "discount_percent": 0,
  "pricing_method": "fixed",
  "unit_label": "unidad",
  "tax_ids": [1, 2]
}
```

## Clientes

- `GET /api/customers` - Listar clientes de la empresa
- `POST /api/customers` - Crear cliente
- `GET /api/customers/{id}` - Obtener cliente con historial
- `PUT /api/customers/{id}` - Actualizar cliente
- `DELETE /api/customers/{id}` - Eliminar cliente

**Body para crear/actualizar:**
```json
{
  "doc_type": "cedula",
  "doc_num": "1234567890",
  "name": "Cliente ejemplo",
  "address": "Dirección",
  "email": "cliente@email.com",
  "phone": "1234567890",
  "history_log": []
}
```

## Ventas

- `GET /api/sales` - Listar ventas (soporta filtros: date_from, date_to, customer_id)
- `POST /api/sales` - Crear venta
- `GET /api/sales/{id}` - Obtener venta con detalles

**Body para crear venta:**
```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 10.50,
      "discount_amount": 0,
      "tax_amount": 1.05
    }
  ],
  "subtotal": 21.00,
  "total_discount_amount": 0,
  "subtotal_after_discounts": 21.00,
  "total_tax_amount": 1.05,
  "final_total": 22.05,
  "tax_breakdown_details": []
}
```

## Impuestos

- `GET /api/taxes` - Listar impuestos de la empresa
- `POST /api/taxes` - Crear impuesto
- `PUT /api/taxes/{id}` - Actualizar impuesto
- `DELETE /api/taxes/{id}` - Eliminar impuesto

**Body para crear/actualizar:**
```json
{
  "name": "IVA",
  "rate": 15.00,
  "enabled": true
}
```

## Cajones de Efectivo

- `GET /api/cash-drawers` - Listar cajones de efectivo
- `POST /api/cash-drawers` - Abrir cajón de efectivo
- `GET /api/cash-drawers/{id}` - Obtener cajón
- `PUT /api/cash-drawers/{id}` - Actualizar/cerrar cajón
- `DELETE /api/cash-drawers/{id}` - Eliminar cajón
- `POST /api/cash-drawers/{id}/expenses` - Agregar gasto

**Body para abrir cajón:**
```json
{
  "opening_amount": 100.00
}
```

**Body para agregar gasto:**
```json
{
  "description": "Gasto ejemplo",
  "amount": 10.50
}
```

## Servicios Recurrentes

- `GET /api/recurring-services` - Listar servicios recurrentes (soporta filtro: customer_id)
- `POST /api/recurring-services` - Crear servicio recurrente
- `GET /api/recurring-services/{id}` - Obtener servicio
- `PUT /api/recurring-services/{id}` - Actualizar servicio
- `DELETE /api/recurring-services/{id}` - Eliminar servicio

**Body para crear/actualizar:**
```json
{
  "customer_id": 1,
  "product_id": 1,
  "billing_cycle": "monthly",
  "start_date": "2024-01-01",
  "next_due_date": "2024-02-01",
  "status": "active"
}
```

## Empresas (Solo Super Admin)

- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Crear empresa
- `GET /api/companies/{id}` - Obtener empresa
- `PUT /api/companies/{id}` - Actualizar empresa
- `DELETE /api/companies/{id}` - Eliminar empresa

## Usuarios

- `GET /api/users` - Listar usuarios (soporta filtro: company_id)
- `POST /api/users` - Crear usuario
- `GET /api/users/{id}` - Obtener usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario















