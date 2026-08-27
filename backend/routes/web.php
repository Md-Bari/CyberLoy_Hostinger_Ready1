<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'CyberLoy LMS Platform API',
        'version' => '1.0.0',
        'status' => 'online',
    ]);
});
