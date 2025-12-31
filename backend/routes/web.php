<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'API POS Multi-Tenant',
        'version' => '1.0.0',
        'endpoints' => [
            'login' => '/api/login',
            'logout' => '/api/logout',
            'me' => '/api/me',
        ],
    ]);
});















