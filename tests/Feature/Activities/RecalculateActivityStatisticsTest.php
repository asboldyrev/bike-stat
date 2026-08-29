<?php

namespace Tests\Feature\Activities;

use App\Application\Activities\ImportGpxActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class RecalculateActivityStatisticsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function command_recalculates_existing_activity_from_original_gpx(): void
    {
        Storage::fake('local');

        $activity = (new ImportGpxActivity())->import(
            User::factory()->create(),
            file_get_contents(base_path('tests/Fixtures/gpx/supercycle.gpx')),
            'supercycle.gpx',
        );

        $activity->forceFill([
            'distance_meters' => 1,
            'moving_time_seconds' => 1,
            'max_speed_mps' => 99,
        ])->save();

        $this->artisan('activities:recalculate', [
            'activity' => (string) $activity->id,
        ])->assertExitCode(0);

        $activity->refresh();

        self::assertSame(16.0, $activity->distance_meters);
        self::assertSame(2, $activity->moving_time_seconds);
        self::assertSame(5.0, $activity->max_speed_mps);
    }
}
