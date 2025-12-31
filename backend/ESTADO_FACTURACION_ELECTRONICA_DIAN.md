# Estado de la Facturación Electrónica DIAN

## Resumen Ejecutivo

El sistema actualmente tiene implementada la **numeración consecutiva autorizada por DIAN**, pero **NO tiene implementada la facturación electrónica completa** que incluye generación de XML UBL 2.1, firma digital, envío a DIAN, y gestión del CUFE.

---

## ✅ Lo que SÍ está implementado

### 1. Numeración Consecutiva Autorizada por DIAN
- ✅ Sistema de rangos de numeración (`document_numbering_ranges`)
- ✅ Generación automática de números consecutivos
- ✅ Validación de vigencia de rangos
- ✅ Control de prefijos autorizados (hasta 4 caracteres)
- ✅ Números de autorización DIAN almacenados
- ✅ Uso de consecutivos autorizados en facturas y notas de crédito

**Archivos relacionados:**
- `backend/app/Services/DocumentNumberingService.php`
- `backend/app/Models/DocumentNumberingRange.php`
- `backend/database/migrations/2024_01_01_000013_create_document_numbering_ranges_table.php`
- `backend/app/Http/Controllers/API/DocumentNumberingRangeController.php`

---

## ❌ Lo que NO está implementado

### 1. Generación de XML UBL 2.1
**Estado:** ❌ No implementado

**Qué falta:**
- Servicio para generar XML en formato UBL 2.1 según especificación DIAN
- Mapeo de datos de venta a estructura XML UBL
- Inclusión de todos los campos requeridos por DIAN:
  - Información del emisor (empresa)
  - Información del receptor (cliente)
  - Detalles de productos/servicios
  - Impuestos (IVA, ICA, etc.)
  - Totales y descuentos
  - Información de pago
  - Referencias a documentos relacionados

**Archivos necesarios:**
- `backend/app/Services/ElectronicInvoiceService.php` (nuevo)
- `backend/app/Services/XmlUblGenerator.php` (nuevo)

---

### 2. Firma Digital del XML
**Estado:** ❌ No implementado

**Qué falta:**
- Integración con certificado digital (.p12 o .pfx)
- Firma XML usando XAdES (XML Advanced Electronic Signatures)
- Validación de certificado digital
- Almacenamiento seguro de certificados

**Dependencias necesarias:**
- Librería PHP para firma XML (ej: `robrichards/xmlseclibs` o similar)
- Certificado digital de la empresa

**Archivos necesarios:**
- `backend/app/Services/XmlSignerService.php` (nuevo)
- Configuración de certificados en `.env`

---

### 3. Envío a DIAN mediante API/Proveedor Tecnológico
**Estado:** ❌ No implementado

**Qué falta:**
- Integración con proveedor tecnológico DIAN (ej: Facturación Electrónica, Habilitación DIAN, etc.)
- O integración directa con API DIAN (si está habilitada)
- Manejo de autenticación con proveedor
- Envío del XML firmado
- Manejo de respuestas del proveedor

**Proveedores comunes en Colombia:**
- Facturación Electrónica (FE)
- Habilitación DIAN
- Otros proveedores certificados por DIAN

**Archivos necesarios:**
- `backend/app/Services/DianApiService.php` (nuevo)
- Configuración de proveedor en `.env`

---

### 4. Validación del Estado DIAN
**Estado:** ❌ No implementado

**Qué falta:**
- Consulta del estado de la factura en DIAN
- Manejo de estados: aceptada, rechazada, pendiente
- Polling automático para verificar estado
- Notificaciones cuando cambia el estado

**Archivos necesarios:**
- Método en `DianApiService` para consultar estado
- Job/Queue para verificación periódica

---

### 5. Almacenamiento de CUFE y Acuse DIAN
**Estado:** ❌ No implementado

**Qué falta:**
- Campos en la tabla `sales` para almacenar:
  - `cufe` (Código Único de Factura Electrónica)
  - `dian_status` (estado: pending, accepted, rejected)
  - `dian_response` (respuesta completa de DIAN)
  - `dian_acuse` (acuse de recibo)
  - `xml_path` (ruta al XML generado)
  - `signed_xml_path` (ruta al XML firmado)
  - `dian_errors` (errores de validación si es rechazada)
  - `dian_sent_at` (fecha de envío)
  - `dian_response_at` (fecha de respuesta)

**Archivos necesarios:**
- Migración para agregar campos a `sales`
- Actualización del modelo `Sale`

---

### 6. Manejo de Errores de Validación DIAN
**Estado:** ❌ No implementado

**Qué falta:**
- Captura de errores de validación de DIAN
- Almacenamiento de errores en base de datos
- Mostrar errores al usuario en el frontend
- Reintentos automáticos para errores temporales
- Notificaciones de facturas rechazadas

**Archivos necesarios:**
- Actualización de `SaleController` para manejar errores
- Componente frontend para mostrar errores

---

## 📋 Estructura de Base de Datos Necesaria

### Campos a agregar a la tabla `sales`:

```php
$table->string('cufe', 100)->nullable(); // Código Único de Factura Electrónica
$table->enum('dian_status', ['pending', 'accepted', 'rejected'])->default('pending');
$table->text('dian_response')->nullable(); // Respuesta completa de DIAN (JSON)
$table->text('dian_acuse')->nullable(); // Acuse de recibo DIAN
$table->string('xml_path')->nullable(); // Ruta al XML generado
$table->string('signed_xml_path')->nullable(); // Ruta al XML firmado
$table->json('dian_errors')->nullable(); // Errores de validación
$table->timestamp('dian_sent_at')->nullable(); // Fecha de envío a DIAN
$table->timestamp('dian_response_at')->nullable(); // Fecha de respuesta de DIAN
```

### Tabla para configuración de proveedor tecnológico:

```php
Schema::create('dian_provider_configs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->onDelete('cascade');
    $table->string('provider_name'); // Nombre del proveedor
    $table->string('api_url'); // URL de la API
    $table->string('api_key')->nullable(); // API Key
    $table->string('api_secret')->nullable(); // API Secret
    $table->text('certificate_path')->nullable(); // Ruta al certificado
    $table->string('certificate_password')->nullable(); // Contraseña del certificado
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

---

## 🚀 Plan de Implementación Recomendado

### Fase 1: Preparación de Base de Datos
1. Crear migración para agregar campos DIAN a `sales`
2. Crear migración para tabla `dian_provider_configs`
3. Actualizar modelo `Sale` con nuevos campos

### Fase 2: Generación de XML UBL 2.1
1. Crear servicio `XmlUblGenerator`
2. Implementar generación de XML según especificación UBL 2.1
3. Validar estructura XML antes de firmar

### Fase 3: Firma Digital
1. Crear servicio `XmlSignerService`
2. Integrar librería de firma XML
3. Configurar certificado digital

### Fase 4: Integración con DIAN
1. Crear servicio `DianApiService`
2. Implementar envío de XML a proveedor
3. Manejar respuestas y errores

### Fase 5: Gestión de Estados
1. Implementar consulta de estado DIAN
2. Crear jobs para verificación periódica
3. Actualizar estados automáticamente

### Fase 6: Frontend
1. Mostrar estado DIAN en facturas
2. Mostrar errores de validación
3. Permitir reenvío de facturas rechazadas

---

## 📚 Referencias Técnicas

- **UBL 2.1**: http://docs.oasis-open.org/ubl/os-UBL-2.1/
- **Resolución DIAN 0165 de 2023**: Especificaciones técnicas facturación electrónica
- **Resolución DIAN 0042 de 2020**: Validación y firma digital
- **XAdES**: Estándar de firma XML avanzada

---

## ⚠️ Consideraciones Importantes

1. **Certificado Digital**: Se requiere certificado digital válido emitido por entidad certificadora reconocida por DIAN
2. **Proveedor Tecnológico**: Debe estar habilitado y certificado por DIAN
3. **Ambiente de Pruebas**: DIAN proporciona ambiente de pruebas (habilitación) antes de producción
4. **Almacenamiento**: Los XML deben almacenarse por mínimo 5 años según normativa
5. **Seguridad**: Los certificados y credenciales deben almacenarse de forma segura

---

## 💡 Próximos Pasos

¿Deseas que implemente la facturación electrónica completa? Puedo crear:

1. Migraciones para agregar campos DIAN
2. Servicios para generación de XML UBL 2.1
3. Servicio de firma digital
4. Integración con API DIAN (configurable por proveedor)
5. Sistema de gestión de estados
6. Frontend para mostrar estados y errores














