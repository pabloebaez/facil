# Implementación de Facturación Electrónica DIAN y Tickets de Venta

## Resumen

Se ha implementado un sistema completo de facturación electrónica DIAN con la opción de desactivarla para emitir tickets de venta simples con numeración consecutiva.

## Características Implementadas

### ✅ Facturación Electrónica DIAN

1. **Generación de XML UBL 2.1**
   - Servicio `XmlUblGenerator` que genera XML según especificación DIAN
   - Incluye todos los campos requeridos: emisor, receptor, productos, impuestos, totales

2. **Firma Digital XML**
   - Servicio `XmlSignerService` preparado para firma XAdES
   - Soporte para certificados digitales (.p12, .pfx)

3. **Integración con API DIAN**
   - Servicio `DianApiService` para envío a proveedores tecnológicos
   - Autenticación con API Key/Secret o Usuario/Contraseña
   - Consulta de estado de facturas

4. **Gestión de Estados DIAN**
   - Estados: `pending`, `accepted`, `rejected`
   - Almacenamiento de CUFE y acuse DIAN
   - Manejo de errores de validación

### ✅ Tickets de Venta

1. **Numeración Consecutiva Simple**
   - Sistema independiente de DIAN
   - Prefijo configurable (por defecto: "TKT")
   - Numeración consecutiva por empresa

### ✅ Configuración por Empresa

- Campo `electronic_invoicing_enabled` en tabla `companies`
- Las empresas pueden activar/desactivar facturación electrónica
- Cuando está desactivada, se emiten tickets automáticamente

## Estructura de Base de Datos

### Nuevas Tablas

1. **`dian_provider_configs`**
   - Configuración de proveedores tecnológicos DIAN
   - Credenciales encriptadas
   - Soporte para ambiente de pruebas y producción

2. **`ticket_numbering`**
   - Control de numeración consecutiva para tickets
   - Una secuencia por empresa

### Campos Agregados a `sales`

- `document_type`: `'electronic_invoice'` o `'ticket'`
- `cufe`: Código Único de Factura Electrónica
- `dian_status`: Estado DIAN (`pending`, `accepted`, `rejected`)
- `dian_response`: Respuesta completa de DIAN (JSON)
- `dian_acuse`: Acuse de recibo DIAN
- `xml_path`: Ruta al XML generado
- `signed_xml_path`: Ruta al XML firmado
- `dian_errors`: Errores de validación (JSON)
- `dian_sent_at`: Fecha de envío a DIAN
- `dian_response_at`: Fecha de respuesta de DIAN

### Campos Agregados a `companies`

- `electronic_invoicing_enabled`: Boolean para activar/desactivar facturación electrónica

## Uso del Sistema

### 1. Configurar Facturación Electrónica

1. Ir a **Configuración** → **Facturación Electrónica DIAN**
2. Activar "Habilitar Facturación Electrónica"
3. Agregar configuración de proveedor tecnológico:
   - Nombre del proveedor
   - URL de la API
   - Credenciales (API Key/Secret o Usuario/Contraseña)
   - Ruta al certificado digital (opcional)
   - Ambiente (Pruebas/Producción)
4. Marcar como "Activo"

### 2. Configurar Rangos de Numeración DIAN

1. Ir a **Configuración** → **Rangos de Numeración DIAN**
2. Crear rango para facturas con:
   - Tipo: Factura de Venta
   - Prefijo autorizado
   - Número de autorización DIAN
   - Fechas de vigencia
   - Rango de números

### 3. Realizar Ventas

- **Con facturación electrónica activada:**
  - Las ventas se procesan como facturas electrónicas
  - Se genera XML UBL 2.1 automáticamente
  - Se firma y envía a DIAN
  - Se muestra el estado DIAN en la lista de ventas

- **Con facturación electrónica desactivada:**
  - Las ventas se procesan como tickets
  - Numeración consecutiva simple (TKT-00000001, TKT-00000002, etc.)
  - Sin procesamiento DIAN

### 4. Consultar Estado DIAN

1. Ir a **Ventas**
2. Buscar la factura electrónica
3. Ver el estado en la columna "Estado DIAN"
4. Hacer clic en "Consultar Estado" para actualizar

## Archivos Creados/Modificados

### Backend

**Migraciones:**
- `2024_01_20_000001_add_electronic_invoicing_to_companies_table.php`
- `2024_01_20_000002_add_dian_fields_to_sales_table.php`
- `2024_01_20_000003_create_dian_provider_configs_table.php`
- `2024_01_20_000004_create_ticket_numbering_table.php`

**Modelos:**
- `app/Models/TicketNumbering.php`
- `app/Models/DianProviderConfig.php`
- `app/Models/Company.php` (actualizado)
- `app/Models/Sale.php` (actualizado)

**Servicios:**
- `app/Services/TicketNumberingService.php`
- `app/Services/ElectronicInvoiceService.php`
- `app/Services/XmlUblGenerator.php`
- `app/Services/XmlSignerService.php`
- `app/Services/DianApiService.php`

**Controladores:**
- `app/Http/Controllers/API/DianProviderConfigController.php`
- `app/Http/Controllers/API/SaleController.php` (actualizado)
- `app/Http/Controllers/API/CompanyController.php` (actualizado)

**Rutas:**
- `routes/api.php` (actualizado)

### Frontend

**Componentes:**
- `src/components/admin/ElectronicInvoicingConfigView.js`
- `src/components/admin/SettingsView.js` (actualizado)
- `src/components/admin/SalesView.js` (actualizado)

**Servicios:**
- `src/services/api.js` (actualizado)

## Notas Importantes

### Firma Digital

El servicio `XmlSignerService` está preparado pero requiere implementación específica según el proveedor tecnológico. Algunos proveedores firman automáticamente el XML, otros requieren firma previa.

**Para implementar firma completa:**
1. Instalar librería PHP para firma XML (ej: `robrichards/xmlseclibs`)
2. Implementar método `signWithCertificate()` en `XmlSignerService`
3. O delegar la firma al proveedor tecnológico

### Proveedores Tecnológicos DIAN

Cada proveedor tiene su propia API. El servicio `DianApiService` es genérico y puede necesitar ajustes según el proveedor específico.

**Proveedores comunes en Colombia:**
- Facturación Electrónica (FE)
- Habilitación DIAN
- Otros proveedores certificados

### Ambiente de Pruebas

DIAN proporciona un ambiente de pruebas (habilitación) antes de producción. Siempre configure primero en ambiente de pruebas.

## Próximos Pasos Recomendados

1. **Configurar Certificado Digital**
   - Obtener certificado digital válido de entidad certificadora reconocida por DIAN
   - Subir certificado al servidor
   - Configurar ruta en proveedor tecnológico

2. **Probar en Ambiente de Pruebas**
   - Configurar proveedor en ambiente de pruebas
   - Realizar ventas de prueba
   - Verificar que las facturas se envíen correctamente a DIAN

3. **Implementar Firma Digital Completa**
   - Si el proveedor no firma automáticamente, implementar firma XAdES
   - Probar firma con certificado de prueba

4. **Monitoreo y Reintentos**
   - Implementar jobs para verificar estado DIAN periódicamente
   - Implementar reintentos automáticos para errores temporales

5. **Almacenamiento de XML**
   - Configurar almacenamiento seguro de XML (mínimo 5 años según normativa)
   - Implementar backup automático

## Comandos para Ejecutar

```bash
# Ejecutar migraciones
php artisan migrate

# Verificar que las tablas se crearon correctamente
php artisan tinker
>>> \App\Models\Company::first()
>>> \App\Models\Sale::first()
```

## Referencias

- Resolución DIAN 0165 de 2023
- Resolución DIAN 0042 de 2020
- Decreto 2242 de 2015
- Especificación UBL 2.1: http://docs.oasis-open.org/ubl/os-UBL-2.1/














