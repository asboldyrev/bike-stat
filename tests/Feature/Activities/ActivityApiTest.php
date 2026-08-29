<?php

namespace Tests\Feature\Activities;

use App\Application\Activities\ImportGpxActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class ActivityApiTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function authenticated_user_can_list_only_their_activities(): void
    {
        Storage::fake('local');

        [$user, $token] = $this->bootstrapIdentity();
        [$otherUser] = $this->bootstrapIdentity();

        $importer = new ImportGpxActivity();
        $importer->import($user, $this->fixture('simple.gpx'), 'mine.gpx');
        $importer->import($otherUser, $this->fixture('supercycle.gpx'), 'other.gpx');

        $this->withToken($token)
            ->getJson('/api/activities')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Simple ride')
            ->assertJsonPath('meta.total', 1);
    }

    #[Test]
    public function authenticated_user_can_open_their_activity_with_track_points(): void
    {
        Storage::fake('local');

        [$user, $token] = $this->bootstrapIdentity();

        $activity = (new ImportGpxActivity())->import(
            $user,
            $this->fixture('supercycle.gpx'),
            'ride.gpx',
        );

        $this->withToken($token)
            ->getJson('/api/activities/'.$activity->id)
            ->assertOk()
            ->assertJsonPath('activity.id', $activity->id)
            ->assertJsonPath('activity.name', 'SuperCycle sample')
            ->assertJsonPath('activity.file.original_name', 'ride.gpx')
            ->assertJsonCount(4, 'activity.track_points')
            ->assertJsonPath('activity.track_points.0.cadence', 66);
    }

    #[Test]
    public function another_users_activity_is_hidden_as_not_found(): void
    {
        Storage::fake('local');

        [, $token] = $this->bootstrapIdentity();
        [$otherUser] = $this->bootstrapIdentity();

        $activity = (new ImportGpxActivity())->import(
            $otherUser,
            $this->fixture('simple.gpx'),
            'private.gpx',
        );

        $this->withToken($token)
            ->getJson('/api/activities/'.$activity->id)
            ->assertNotFound();
    }

    #[Test]
    public function activity_endpoints_require_device_authentication(): void
    {
        $this->getJson('/api/activities')->assertUnauthorized();
        $this->getJson('/api/activities/1')->assertUnauthorized();
    }

    /**
     * @return array{User, string}
     */
    private function bootstrapIdentity(): array
    {
        $response = $this->postJson('/api/bootstrap')->assertCreated();

        return [
            User::query()->findOrFail($response->json('user_id')),
            $response->json('token'),
        ];
    }

    private function fixture(string $name): string
    {
        return file_get_contents(base_path('tests/Fixtures/gpx/'.$name));
    }
}
