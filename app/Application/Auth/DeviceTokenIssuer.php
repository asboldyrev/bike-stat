<?php

namespace App\Application\Auth;

use App\Models\DeviceToken;
use App\Models\User;

final class DeviceTokenIssuer
{
    public function issue(User $user, ?string $name = null): IssuedDeviceToken
    {
        $plainTextToken = $this->randomToken();

        $deviceToken = DeviceToken::query()->create([
            'user_id' => $user->getKey(),
            'token_hash' => hash('sha256', $plainTextToken),
            'name' => $name,
        ]);

        return new IssuedDeviceToken($deviceToken, $plainTextToken);
    }

    private function randomToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
}
