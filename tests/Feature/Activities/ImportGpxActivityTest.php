<?php

namespace Tests\Feature\Activities;

use App\Application\Activities\DuplicateActivityException;
use App\Application\Activities\ImportGpxActivity;
use App\Models\Activity;
use App\Models\ActivityFile;
use App\Models\ActivityTrackPoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class ImportGpxActivityTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_persists_activity_original_file_and_normalized_track_points(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $xml = file_get_contents(base_path('tests/Fixtures/gpx/supercycle.gpx'));

        $activity = (new ImportGpxActivity())->import(
            user: $user,
            xml: $xml,
            originalName: 'ride.gpx',
            mimeType: 'application/gpx+xml',
        );

        self::assertSame($user->id, $activity->user_id);
        self::assertSame('SuperCycle sample', $activity->name);
        self::assertSame('gpx', $activity->source);
        self::assertNotNull($activity->started_at);
        self::assertNotNull($activity->finished_at);

        self::assertDatabaseCount('activities', 1);
        self::assertDatabaseCount('activity_files', 1);
        self::assertDatabaseCount('activity_track_points', 4);

        $file = ActivityFile::query()->sole();

        self::assertSame(hash('sha256', $xml), $file->sha256);
        self::assertSame(strlen($xml), $file->size_bytes);
        self::assertSame('ride.gpx', $file->original_name);
        Storage::disk('local')->assertExists($file->path);
        self::assertSame($xml, Storage::disk('local')->get($file->path));

        $firstPoint = ActivityTrackPoint::query()
            ->orderBy('segment_index')
            ->orderBy('sequence')
            ->firstOrFail();

        self::assertSame(0, $firstPoint->segment_index);
        self::assertSame(0, $firstPoint->sequence);
        self::assertSame(66, $firstPoint->cadence);
        self::assertSame(4.1, $firstPoint->source_distance_meters);
        self::assertSame(2.0, $firstPoint->source_speed_mps);
        self::assertSame(10.0, $firstPoint->course_degrees);
    }

    #[Test]
    public function it_rejects_the_same_file_for_the_same_user(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $xml = file_get_contents(base_path('tests/Fixtures/gpx/simple.gpx'));
        $importer = new ImportGpxActivity();

        $first = $importer->import($user, $xml, 'ride.gpx');

        try {
            $importer->import($user, $xml, 'copy.gpx');
            self::fail('Expected duplicate import to be rejected.');
        } catch (DuplicateActivityException $exception) {
            self::assertSame($first->id, $exception->activityId);
        }

        self::assertDatabaseCount('activities', 1);
        self::assertDatabaseCount('activity_files', 1);
    }

    #[Test]
    public function the_same_file_can_belong_to_different_users(): void
    {
        Storage::fake('local');

        $xml = file_get_contents(base_path('tests/Fixtures/gpx/simple.gpx'));
        $importer = new ImportGpxActivity();

        $first = $importer->import(User::factory()->create(), $xml, 'ride.gpx');
        $second = $importer->import(User::factory()->create(), $xml, 'ride.gpx');

        self::assertNotSame($first->id, $second->id);
        self::assertDatabaseCount('activities', 2);
        self::assertDatabaseCount('activity_files', 2);
    }

    #[Test]
    public function deleting_an_activity_cascades_derived_rows_but_not_storage_implicitly(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $xml = file_get_contents(base_path('tests/Fixtures/gpx/simple.gpx'));

        $activity = (new ImportGpxActivity())->import($user, $xml, 'ride.gpx');
        $path = $activity->file->path;

        $activity->delete();

        self::assertSame(0, Activity::query()->count());
        self::assertSame(0, ActivityFile::query()->count());
        self::assertSame(0, ActivityTrackPoint::query()->count());

        // Storage cleanup is deliberately an application concern, not a DB cascade.
        Storage::disk('local')->assertExists($path);
    }
}
