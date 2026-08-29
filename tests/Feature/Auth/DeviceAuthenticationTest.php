<?php

namespace Tests\Feature\Auth;

use App\Models\DeviceToken;
use App\Models\PairingToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class DeviceAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function bootstrap_creates_an_anonymous_user_and_returns_a_device_token_once(): void
    {
        $response = $this->postJson('/api/bootstrap', [
            'device_name' => 'Android phone',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['token', 'user_id', 'device_id']);

        $plainTextToken = $response->json('token');

        self::assertIsString($plainTextToken);
        self::assertGreaterThanOrEqual(40, strlen($plainTextToken));
        self::assertSame(1, User::query()->count());
        self::assertSame(1, DeviceToken::query()->count());

        $deviceToken = DeviceToken::query()->sole();

        self::assertSame(hash('sha256', $plainTextToken), $deviceToken->token_hash);
        self::assertNotSame($plainTextToken, $deviceToken->token_hash);
        self::assertSame('Android phone', $deviceToken->name);
        self::assertStringEndsWith('@anonymous.invalid', $deviceToken->user->email);
    }

    #[Test]
    public function protected_pairing_creation_requires_a_valid_device_bearer_token(): void
    {
        $this->postJson('/api/pairings')->assertUnauthorized();

        $bootstrap = $this->postJson('/api/bootstrap')->assertCreated();
        $token = $bootstrap->json('token');

        $this->withToken('not-the-token')
            ->postJson('/api/pairings')
            ->assertUnauthorized();

        $this->withToken($token)
            ->postJson('/api/pairings')
            ->assertCreated()
            ->assertJsonStructure(['token', 'expires_at', 'url']);
    }

    #[Test]
    public function pairing_creates_a_new_independent_device_token_for_the_same_user(): void
    {
        Carbon::setTestNow('2026-08-29 12:00:00');

        $bootstrap = $this->postJson('/api/bootstrap', [
            'device_name' => 'First device',
        ])->assertCreated();

        $firstToken = $bootstrap->json('token');
        $userId = $bootstrap->json('user_id');

        $pairing = $this->withToken($firstToken)
            ->postJson('/api/pairings')
            ->assertCreated();

        $pairingToken = $pairing->json('token');

        self::assertStringContainsString('#token='.$pairingToken, $pairing->json('url'));
        self::assertSame(
            hash('sha256', $pairingToken),
            PairingToken::query()->sole()->token_hash,
        );

        $redeemed = $this->postJson('/api/pairings/redeem', [
            'token' => $pairingToken,
            'device_name' => 'Second device',
        ])->assertCreated();

        $secondToken = $redeemed->json('token');

        self::assertSame($userId, $redeemed->json('user_id'));
        self::assertNotSame($firstToken, $secondToken);
        self::assertSame(2, DeviceToken::query()->where('user_id', $userId)->count());
        self::assertSame('Second device', DeviceToken::query()->latest('id')->firstOrFail()->name);
        self::assertNotNull(PairingToken::query()->sole()->used_at);

        Carbon::setTestNow();
    }

    #[Test]
    public function pairing_token_is_single_use(): void
    {
        $bootstrap = $this->postJson('/api/bootstrap')->assertCreated();

        $pairingToken = $this->withToken($bootstrap->json('token'))
            ->postJson('/api/pairings')
            ->assertCreated()
            ->json('token');

        $this->postJson('/api/pairings/redeem', [
            'token' => $pairingToken,
        ])->assertCreated();

        $this->postJson('/api/pairings/redeem', [
            'token' => $pairingToken,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Pairing token is invalid, expired, or already used.');
    }

    #[Test]
    public function pairing_token_expires_after_two_minutes(): void
    {
        Carbon::setTestNow('2026-08-29 12:00:00');

        $bootstrap = $this->postJson('/api/bootstrap')->assertCreated();

        $pairingToken = $this->withToken($bootstrap->json('token'))
            ->postJson('/api/pairings')
            ->assertCreated()
            ->json('token');

        Carbon::setTestNow('2026-08-29 12:02:01');

        $this->postJson('/api/pairings/redeem', [
            'token' => $pairingToken,
        ])->assertUnprocessable();

        self::assertSame(1, DeviceToken::query()->count());

        Carbon::setTestNow();
    }

    #[Test]
    public function revoked_device_token_is_rejected(): void
    {
        $bootstrap = $this->postJson('/api/bootstrap')->assertCreated();

        DeviceToken::query()->sole()->forceFill([
            'revoked_at' => now(),
        ])->save();

        $this->withToken($bootstrap->json('token'))
            ->postJson('/api/pairings')
            ->assertUnauthorized();
    }
}
