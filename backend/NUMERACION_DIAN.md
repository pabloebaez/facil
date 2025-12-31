# Sistema de Numeración DIAN - Colombia

## Implementación Completa

Este sistema implementa los requisitos legales de la DIAN (Dirección de Impuestos y Aduanas Nacionales) de Colombia para la numeración de documentos fiscales.

## Características Implementadas

### 1. Rangos de Numeración Autorizados

- **Facturas de Venta**: Rangos independientes con prefijo "FAC"
- **Notas de Crédito**: Rangos independientes con prefijo "NC"
- **Notas de Débito**: Rangos independientes con prefijo "ND" (preparado para futuro)

### 2. Requisitos DIAN Cumplidos

✅ **Numeración Consecutiva**: Los números se generan de forma consecutiva sin saltos
✅ **Numeración Continua**: No hay interrupciones en la secuencia
✅ **Prefijo Autorizado**: Hasta 4 caracteres alfanuméricos por establecimiento
✅ **Rango Autorizado**: Control de números iniciales y finales del rango
✅ **Vigencia**: Control de fechas de inicio y fin de vigencia del rango
✅ **Número de Autorización DIAN**: Almacenamiento del número de autorización

### 3. Estructura de Base de Datos

#### Tabla: `document_numbering_ranges`
- `company_id`: Empresa propietaria del rango
- `document_type`: Tipo de documento (invoice, credit_note, debit_note)
- `prefix`: Prefijo autorizado (hasta 4 caracteres)
- `authorization_number`: Número de autorización DIAN
- `authorization_date`: Fecha de autorización
- `valid_from`: Fecha de inicio de vigencia
- `valid_to`: Fecha de fin de vigencia
- `range_from`: Número inicial del rango
- `range_to`: Número final del rango
- `current_number`: Último número usado (para control consecutivo)
- `is_active`: Si el rango está activo

### 4. Formato de Numeración

**Facturas**: `PREFIJO-NÚMERO` (ej: `FAC-00000001`)
**Notas de Crédito**: `PREFIJO-NÚMERO` (ej: `NC-00000001`)
**Notas de Débito**: `PREFIJO-NÚMERO` (ej: `ND-00000001`)

El número tiene 8 dígitos con ceros a la izquierda.

### 5. Uso del Sistema

#### Crear Rango Autorizado por DIAN

```php
use App\Services\DocumentNumberingService;

$service = new DocumentNumberingService();

$range = $service->createAuthorizedRange(
    companyId: 1,
    documentType: 'invoice',
    authorizationNumber: 'AUT-2024-001',
    prefix: 'FAC',
    rangeFrom: 1,
    rangeTo: 99999999,
    authorizationDate: new \DateTime('2024-01-01'),
    validFrom: new \DateTime('2024-01-01'),
    validTo: new \DateTime('2024-12-31')
);
```

#### Generar Número Automáticamente

El sistema genera automáticamente los números cuando se crean:
- **Facturas**: Al crear una venta (`SaleController`)
- **Notas de Crédito**: Al crear una devolución (`ReturnController`)

### 6. Validaciones Implementadas

- ✅ Verifica que el rango esté activo
- ✅ Verifica que la fecha actual esté dentro del período de vigencia
- ✅ Verifica que no se exceda el límite del rango
- ✅ Genera números consecutivos sin saltos
- ✅ Controla la unicidad por empresa

### 7. Rango por Defecto (Desarrollo)

Si no existe un rango autorizado, el sistema crea automáticamente uno para desarrollo con:
- Prefijo según tipo de documento
- Rango amplio (1 a 99,999,999)
- Vigencia de 10 años
- Nota indicando que es para desarrollo

**⚠️ IMPORTANTE**: En producción, los rangos deben ser creados manualmente con autorización DIAN real.

### 8. Campos Adicionales en Documentos

#### Ventas (Facturas)
- `sale_number`: Número generado según DIAN (ej: `FAC-00000001`)

#### Devoluciones (Notas de Crédito)
- `return_number`: Número generado según DIAN (ej: `NC-00000001`)
- `document_type`: Tipo de documento (`credit_note`)
- `authorization_number`: Número de autorización del rango usado

## Próximos Pasos Recomendados

1. **Configurar Rangos Reales**: Crear rangos con autorización DIAN real para producción
2. **Notas de Débito**: Implementar funcionalidad completa de notas de débito
3. **Reportes DIAN**: Generar reportes de numeración para auditoría
4. **Validación CUFE**: Integrar generación y validación de CUFE (Código Único de Factura Electrónica)
5. **Firma Electrónica**: Integrar firma electrónica para documentos fiscales

## Referencias Legales

- Resolución DIAN 0165 de 2023
- Resolución DIAN 0042 de 2020
- Decreto 2242 de 2015















