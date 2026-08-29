<?php

namespace Tests\Feature\Activities;

use App\Models\Activity;
use App\Models\ActivityTrackPoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class ImportActivityApiTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function import_requires_device_authentication(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->createWithContent(
            'ride.gpx',
            file_get_contents(base_path('tests/Fixtures/gpx/simple.gpx')),
        );

        $this->post('/api/activities/import', ['file' => $file], [
            'Accept' => 'application/json',
        ])->assertUnauthorized();
    }

    #[Test]
    public function authenticated_device_can_import_a_gpx_file(): void
    {
        Storage::fake('local');

        $token = $this->bootstrapToken();
        $xml = file_get_contents(base_path('tests/Fixtures/gpx/supercycle.gpx'));

        $response = $this->withToken($token)->post('/api/activities/import', [
            'file' => UploadedFile::fake()->createWithContent('ride.gpx', $xml),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('activity.name', 'SuperCycle sample')
            ->assertJsonStructure([
                'activity' => [
                    'id',
                    'name',
                    'started_at',
                    'distance_meters',
                    'elapsed_time_seconds',
                    'moving_time_seconds',
                    'average_speed_mps',
                    'max_speed_mps',
                    'elevation_gain_meters',
                    'elevation_loss_meters',
                ],
            ]);

        self::assertSame(1, Activity::query()->count());
        self::assertSame(4, ActivityTrackPoint::query()->count());

        $activity = Activity::query()->with('file')->sole();

        Storage::disk('local')->assertExists($activity->file->path);
        self::assertSame($xml, Storage::disk('local')->get($activity->file->path));
    }

    #[Test]
    public function duplicate_import_returns_existing_activity_id(): void
    {
        Storage::fake('local');

        $token = $this->bootstrapToken();
        $xml = file_get_contents(base_path('tests/Fixtures/gpx/simple.gpx'));

        $first = $this->withToken($token)->post('/api/activities/import', [
            'file' => UploadedFile::fake()->createWithContent('ride.gpx', $xml),
        ], [
            'Accept' => 'application/json',
        ])->assertCreated();

        $this->withToken($token)->post('/api/activities/import', [
            'file' => UploadedFile::fake()->createWithContent('ride-copy.gpx', $xml),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertStatus(409)
            ->assertJsonPath('activity_id', $first->json('activity.id'));
    }

    #[Test]
    public function malformed_gpx_returns_validation_style_error(): void
    {
        Storage::fake('local');

        $token = $this->bootstrapToken();

        $this->withToken($token)->post('/api/activities/import', [
            'file' => UploadedFile::fake()->createWithContent(
                'broken.gpx',
                '<gpx><trk><trkseg><trkpt></gpx>',
            ),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertUnprocessable()
            ->assertJsonStructure(['message']);

        self::assertSame(0, Activity::query()->count());
    }

    #[Test]
    public function non_gpx_extension_is_rejected(): void
    {
        Storage::fake('local');

        $token = $this->bootstrapToken();

        $this->withToken($token)->post('/api/activities/import', [
            'file' => UploadedFile::fake()->createWithContent(
                'ride.xml',
                file_get_contents(base_path('tests/Fixtures/gpx/simple.gpx')),
            ),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The file must have a .gpx extension.');
    }

    private function bootstrapToken(): string
    {
        return $this->postJson('/api/bootstrap')
            ->assertCreated()
            ->json('token');
    }
}
