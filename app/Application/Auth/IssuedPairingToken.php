<?php

namespace App\Application\Auth;

use App\Models\PairingToken;
use DateTimeInterface;

final readonly class IssuedPairingToken
{
    public function __construct(
        public PairingToken $pairingToken,
        public string $plainTextToken,
        public DateTimeInterface $expiresAt,
    ) {
    }
}
