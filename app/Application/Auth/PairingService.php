<?php

namespace App\Application\Auth;

use App\Models\PairingToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class PairingService
{
    public function __construct(private readonly DeviceTokenIssuer $deviceTokens = new DeviceTokenIssuer())
    {
    }

    public function issue(User $user): IssuedPairingToken
    {
        $plainTextToken = $this->randomToken();
        $expiresAt = now()->addMinutes(2);

        $pairingToken = PairingToken::query()->create([
            'user_id' => $user->getKey(),
            'token_hash' => hash('sha256', $plainTextToken),
            'expires_at' => $expiresAt,
        ]);

        return new IssuedPairingToken($pairingToken, $plainTextToken, $expiresAt);
    }

    public function redeem(string $plainTextToken, ?string $deviceName = null): IssuedDeviceToken
    {
        return DB::transaction(function () use ($plainTextToken, $deviceName): IssuedDeviceToken {
            $pairingToken = PairingToken::query()
                ->where('token_hash', hash('sha256', $plainTextToken))
                ->lockForUpdate()
                ->first();

            if (
                $pairingToken === null
                || $pairingToken->used_at !== null
                || $pairingToken->expires_at->isPast()
            ) {
                throw new RuntimeException('Pairing token is invalid, expired, or already used.');
            }

            $pairingToken->forceFill(['used_at' => now()])->save();

            return $this->deviceTokens->issue($pairingToken->user, $deviceName);
        });
    }

    private function randomToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
}
