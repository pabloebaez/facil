<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\TaxController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\SaleController;
use App\Http\Controllers\API\ReturnController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\CompanyController;
use App\Http\Controllers\API\CashDrawerController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\API\PurchaseController;
use App\Http\Controllers\API\RecurringServiceController;
use App\Http\Controllers\API\DocumentNumberingRangeController;
use App\Http\Controllers\API\DianProviderConfigController;
use App\Http\Controllers\API\DigitalPaymentConfigController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\WarehouseController;

// Rutas de autenticación (públicas)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/validate-admin-password', [AuthController::class, 'validateAdminPassword'])->middleware('auth:sanctum');

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    // Autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Productos
    Route::apiResource('products', ProductController::class);

    // Impuestos
    Route::apiResource('taxes', TaxController::class);

    // Clientes
    Route::apiResource('customers', CustomerController::class);

    // Ventas
    Route::apiResource('sales', SaleController::class);
    Route::get('sales/{id}/invoice', [SaleController::class, 'getInvoice']);

    // Devoluciones
    Route::apiResource('returns', ReturnController::class);

    // Usuarios
    Route::apiResource('users', UserController::class);

    // Empresas
    Route::apiResource('companies', CompanyController::class);

    // Cajones de efectivo (rutas específicas antes del apiResource)
    Route::get('cash-drawers/active', [CashDrawerController::class, 'getActive']);
    Route::post('cash-drawers/{id}/expenses', [CashDrawerController::class, 'addExpense']);
    Route::apiResource('cash-drawers', CashDrawerController::class);

    // Proveedores
    Route::apiResource('suppliers', SupplierController::class);

    // Compras
    Route::apiResource('purchases', PurchaseController::class);

    // Servicios recurrentes
    Route::apiResource('recurring-services', RecurringServiceController::class);

    // Rangos de numeración de documentos
    Route::apiResource('document-numbering-ranges', DocumentNumberingRangeController::class);

    // Configuración de proveedores DIAN
    Route::apiResource('dian-provider-configs', DianProviderConfigController::class);

    // Configuración de pagos digitales
    Route::apiResource('digital-payment-configs', DigitalPaymentConfigController::class);

    // Bodegas
    Route::apiResource('warehouses', WarehouseController::class);

    // Reportes
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales']);
        Route::get('/products', [ReportController::class, 'products']);
        Route::get('/customers', [ReportController::class, 'customers']);
    });
});
