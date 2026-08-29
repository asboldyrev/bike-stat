<?php

namespace App\Application\Activities;

use App\Domain\Activity\Services\ActivityStatisticsCalculator;
use App\Infrastructure\Gpx\GpxParser;
use App\Models\Activity;
use App\Models\ActivityFile;
use App\Models\ActivityTrackPoint;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

final class ImportGpxActivity
{
    public function __construct(
        private readonly GpxParser $parser = new GpxParser(),
        private readonly ActivityStatisticsCalculator $statisticsCalculator = new ActivityStatisticsCalculator(),
    ) {
    }

    public function import(
        User $user,
        string $xml,
        string $originalName,
        ?string $mimeType = 'application/gpx+xml',
    ): Activity {
        $sha256 = hash('sha256', $xml);

        $existing = ActivityFile::query()
            ->where('user_id', $user->getKey())
            ->where('sha256', $sha256)
            ->first();

        if ($existing !== null) {
            throw new DuplicateActivityException($existing->activity_id);
        }

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

        $disk = 'local';
        $path = sprintf(
            'activities/%s/%s.gpx',
            $user->getKey(),
            Str::uuid()->toString(),
        );

        Storage::disk($disk)->put($path, $xml);

        try {
            return DB::transaction(function () use (
                $user,
                $gpx,
                $statistics,
                $startedAt,
                $finishedAt,
                $originalName,
                $mimeType,
                $xml,
                $sha256,
                $disk,
                $path,
            ): Activity {
                $activity = Activity::query()->create([
                    'user_id' => $user->getKey(),
                    'name' => $gpx->name,
                    'source' => 'gpx',
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
                ]);

                ActivityFile::query()->create([
                    'activity_id' => $activity->getKey(),
                    'user_id' => $user->getKey(),
                    'original_name' => $originalName,
                    'disk' => $disk,
                    'path' => $path,
                    'mime_type' => $mimeType,
                    'size_bytes' => strlen($xml),
                    'sha256' => $sha256,
                ]);

                $rows = [];

                foreach ($gpx->segments as $segmentIndex => $segment) {
                    foreach ($segment->points as $sequence => $point) {
                        $rows[] = [
                            'activity_id' => $activity->getKey(),
                            'segment_index' => $segmentIndex,
                            'sequence' => $sequence,
                            'recorded_at' => $point->recordedAt?->format('Y-m-d H:i:s.u'),
                            'latitude' => $point->latitude,
                            'longitude' => $point->longitude,
                            'elevation_meters' => $point->elevation,
                            'heart_rate' => $point->heartRate,
                            'cadence' => $point->cadence,
                            'power_watts' => $point->power,
                            'temperature_celsius' => $point->temperature,
                            'source_distance_meters' => $point->sourceDistanceMeters,
                            'source_speed_mps' => $point->sourceSpeedMetersPerSecond,
                            'course_degrees' => $point->courseDegrees,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }

                foreach (array_chunk($rows, 1000) as $chunk) {
                    ActivityTrackPoint::query()->insert($chunk);
                }

                return $activity->fresh(['file']);
            });
        } catch (QueryException $exception) {
            Storage::disk($disk)->delete($path);

            $existing = ActivityFile::query()
                ->where('user_id', $user->getKey())
                ->where('sha256', $sha256)
                ->first();

            if ($existing !== null) {
                throw new DuplicateActivityException($existing->activity_id);
            }

            throw $exception;
        } catch (Throwable $exception) {
            Storage::disk($disk)->delete($path);

            throw $exception;
        }
    }
}
