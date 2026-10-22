<?php

use Illuminate\Support\Str;

// Suppress PHP 8.5 PDO deprecation notices
error_reporting(E_ALL & ~E_DEPRECATED);

$dbConnection = env('DB_CONNECTION');
if (empty($dbConnection) && file_exists(database_path('database.sqlite'))) {
    $dbConnection = 'sqlite';
}
if (empty($dbConnection)) {
    $dbConnection = 'mysql';
}

$dbDatabase = env('DB_DATABASE');
if (!empty($dbDatabase)) {
    $isAbsolutePath = Str::startsWith($dbDatabase, DIRECTORY_SEPARATOR)
        || preg_match('#^[A-Za-z]:[\\/]#', $dbDatabase) === 1;
    if (!$isAbsolutePath) {
        $dbDatabase = database_path($dbDatabase);
    }
} else {
    $dbDatabase = database_path('database.sqlite');
}

return [

    'default' => $dbConnection,

    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => $dbDatabase,
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],

        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'cyberloy_lms'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                defined('Pdo\\Mysql::ATTR_SSL_CA')
                    ? \Pdo\Mysql::ATTR_SSL_CA
                    : (defined('PDO::MYSQL_ATTR_SSL_CA') ? \PDO::MYSQL_ATTR_SSL_CA : null) => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

];
