<?php

use App\Http\Controllers\Api\Auth\BootstrapController;
use App\Http\Controllers\Api\Auth\PairingController;
use Illuminate\Support\Facades\Route;

Route::post('/bootstrap', BootstrapController::class);

Route::post('/pairings/redeem', [PairingController::class, 'redeem']);

Route::middleware('device.auth')->group(function (): void {
    Route::post('/pairings', [PairingController::class, 'store']);
});
