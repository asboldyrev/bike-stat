<?php

namespace App\Http\Controllers\Api\Auth;

use App\Application\Auth\PairingService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PairingController extends Controller
{
    public function store(Request $request, PairingService $pairings): JsonResponse
    {
        $issued = $pairings->issue($request->user());

        $baseUrl = rtrim(config('app.url'), '/');
        $pairUrl = $baseUrl.'/pair#token='.$issued->plainTextToken;

        return response()->json([
            'token' => $issued->plainTextToken,
            'expires_at' => $issued->expiresAt->format(DATE_ATOM),
            'url' => $pairUrl,
        ], 201);
    }

    public function redeem(Request $request, PairingService $pairings): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $issued = $pairings->redeem(
                $validated['token'],
                $validated['device_name'] ?? null,
            );
        } catch (\RuntimeException) {
            return response()->json([
                'message' => 'Pairing token is invalid, expired, or already used.',
            ], 422);
        }

        return response()->json([
            'token' => $issued->plainTextToken,
            'user_id' => $issued->deviceToken->user_id,
            'device_id' => $issued->deviceToken->getKey(),
        ], 201);
    }
}
