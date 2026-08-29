<?php

namespace App\Http\Middleware;

use App\Models\DeviceToken;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateDeviceToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();

        if ($plainTextToken === null || $plainTextToken === '') {
            return new JsonResponse(['message' => 'Unauthenticated.'], 401);
        }

        $deviceToken = DeviceToken::query()
            ->with('user')
            ->where('token_hash', hash('sha256', $plainTextToken))
            ->whereNull('revoked_at')
            ->first();

        if ($deviceToken === null) {
            return new JsonResponse(['message' => 'Unauthenticated.'], 401);
        }

        $request->setUserResolver(static fn () => $deviceToken->user);
        $request->attributes->set('device_token', $deviceToken);

        if (
            $deviceToken->last_used_at === null
            || $deviceToken->last_used_at->lt(now()->subMinutes(5))
        ) {
            $deviceToken->forceFill(['last_used_at' => now()])->save();
        }

        return $next($request);
    }
}
