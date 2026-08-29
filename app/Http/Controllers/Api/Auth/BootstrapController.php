<?php

namespace App\Http\Controllers\Api\Auth;

use App\Application\Auth\BootstrapAnonymousUser;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BootstrapController extends Controller
{
    public function __invoke(Request $request, BootstrapAnonymousUser $bootstrap): JsonResponse
    {
        $validated = $request->validate([
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $issued = $bootstrap->create($validated['device_name'] ?? null);

        return response()->json([
            'token' => $issued->plainTextToken,
            'user_id' => $issued->deviceToken->user_id,
            'device_id' => $issued->deviceToken->getKey(),
        ], 201);
    }
}
