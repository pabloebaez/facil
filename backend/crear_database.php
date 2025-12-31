<?php

// Script para crear la base de datos
// Uso: php crear_database.php

// Leer .env manualmente
$envFile = __DIR__ . '/.env';
$config = [];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $config[trim($key)] = trim($value);
    }
}

$host = $config['DB_HOST'] ?? '127.0.0.1';
$port = $config['DB_PORT'] ?? '3306';
$username = $config['DB_USERNAME'] ?? 'root';
$password = $config['DB_PASSWORD'] ?? '';
$database = $config['DB_DATABASE'] ?? 'pos_multitenant';

try {
    // Conectar sin especificar base de datos
    $pdo = new PDO("mysql:host={$host};port={$port}", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crear base de datos
    $sql = "CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $pdo->exec($sql);
    
    echo "✅ Base de datos '{$database}' creada exitosamente!\n";
    echo "\nAhora ejecuta:\n";
    echo "  php artisan migrate\n";
    echo "  php artisan db:seed --class=DatabaseSeeder\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nPuedes crear la base de datos manualmente:\n";
    echo "1. Abre MySQL Command Line o PHPMyAdmin\n";
    echo "2. Ejecuta: CREATE DATABASE {$database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n";
}

