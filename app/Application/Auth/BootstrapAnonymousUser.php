<?php

namespace App\Application\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class BootstrapAnonymousUser
{
    public function __construct(private readonly DeviceTokenIssuer $tokens = new DeviceTokenIssuer())
    {
    }

    public function create(?string $deviceName = null): IssuedDeviceToken
    {
        return DB::transaction(function () use ($deviceName): IssuedDeviceToken {
            $identifier = Str::uuid()->toString();

            $user = User::query()->create([
                'name' => 'Anonymous',
                'email' => $identifier.'@anonymous.invalid',
                'password' => Str::random(64),
            ]);

            return $this->tokens->issue($user, $deviceName);
        });
    }
}
