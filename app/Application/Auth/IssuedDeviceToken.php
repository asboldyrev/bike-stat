<?php

namespace App\Application\Auth;

use App\Models\DeviceToken;

final readonly class IssuedDeviceToken
{
    public function __construct(
        public DeviceToken $deviceToken,
        public string $plainTextToken,
    ) {
    }
}
