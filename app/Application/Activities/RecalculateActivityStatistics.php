<?php

namespace App\Application\Activities;

use App\Domain\Activity\Services\ActivityStatisticsCalculator;
use App\Infrastructure\Gpx\GpxParser;
use App\Models\Activity;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class RecalculateActivityStatistics
{
    public function __construct(
        private readonly GpxParser $parser = new GpxParser(),
        private readonly ActivityStatisticsCalculator $statisticsCalculator = new ActivityStatisticsCalculator(),
    ) {
    }

    public function recalculate(Activity $activity): Activity
    {
        $activity->loadMissing('file');

        if ($activity->file === null) {
            throw new RuntimeException('Activity has no source GPX file.');
        }

        $xml = Storage::disk($activity->file->disk)->get($activity->file->path);
        $gpx = $this->parser->parse($xml);
        $statistics = $this->statisticsCalculator->calculate($gpx);

        $points = $gpx->points();
        $startedAt = null;
        $finishedAt = null;

        foreach ($points as $point) {
            if ($point->recordedAt === null) {
                continue;
            }

            $startedAt ??= $point->recordedAt;
            $finishedAt = $point->recordedAt;
        }

        $activity->forceFill([
            'name' => $gpx->name,
            'started_at' => $startedAt,
            'finished_at' => $finishedAt,
            'distance_meters' => $statistics->distanceMeters,
            'elapsed_time_seconds' => $statistics->elapsedTimeSeconds,
            'moving_time_seconds' => $statistics->movingTimeSeconds,
            'average_speed_mps' => $statistics->averageSpeedMetersPerSecond,
            'max_speed_mps' => $statistics->maxSpeedMetersPerSecond,
            'elevation_gain_meters' => $statistics->elevationGainMeters,
            'elevation_loss_meters' => $statistics->elevationLossMeters,
            'minimum_elevation_meters' => $statistics->minimumElevationMeters,
            'maximum_elevation_meters' => $statistics->maximumElevationMeters,
        ])->save();

        return $activity->refresh();
    }
}
