<?php

use App\Http\Controllers\Api\Activities\ActivityController;
use App\Http\Controllers\Api\Activities\ImportActivityController;
use App\Http\Controllers\Api\Auth\BootstrapController;
use App\Http\Controllers\Api\Auth\PairingController;
use Illuminate\Support\Facades\Route;

Route::post('/bootstrap', BootstrapController::class)
    ->middleware('throttle:10,1');

Route::post('/pairings/redeem', [PairingController::class, 'redeem'])
    ->middleware('throttle:20,1');

Route::middleware(['device.auth', 'throttle:60,1'])->group(function (): void {
    Route::post('/pairings', [PairingController::class, 'store']);

    Route::get('/activities', [ActivityController::class, 'index']);
    Route::get('/activities/{activity}', [ActivityController::class, 'show'])
        ->whereNumber('activity');

    Route::post('/activities/import', ImportActivityController::class);
});
