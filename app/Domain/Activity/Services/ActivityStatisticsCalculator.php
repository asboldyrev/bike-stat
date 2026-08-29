<?php

namespace App\Domain\Activity\Services;

use App\Domain\Activity\ActivityStatistics;
use App\Domain\Activity\ParsedGpx;
use App\Domain\Activity\TrackPoint;

final class ActivityStatisticsCalculator
{
    public function __construct(
        private readonly DistanceCalculator $distanceCalculator = new DistanceCalculator(),
        private readonly ElevationCalculator $elevationCalculator = new ElevationCalculator(),
        private readonly float $movingThresholdMetersPerSecond = 1.0,
    ) {
    }

    public function calculate(ParsedGpx $gpx): ActivityStatistics
    {
        $distance = 0.0;
        $movingTime = 0;
        $maxSpeed = null;
        $firstTime = null;
        $lastTime = null;

        foreach ($gpx->segments as $segment) {
            $points = $segment->points;

            foreach ($points as $point) {
                if ($point->recordedAt !== null) {
                    $firstTime ??= $point->recordedAt;
                    $lastTime = $point->recordedAt;
                }
            }

            for ($i = 1, $count = count($points); $i < $count; $i++) {
                $previous = $points[$i - 1];
                $current = $points[$i];

                $segmentDistance = $this->distanceCalculator->between($previous, $current);
                $distance += $segmentDistance;

                $seconds = $this->secondsBetween($previous, $current);

                if ($seconds === null || $seconds <= 0) {
                    continue;
                }

                $speed = $segmentDistance / $seconds;
                $maxSpeed = $maxSpeed === null ? $speed : max($maxSpeed, $speed);

                if ($speed >= $this->movingThresholdMetersPerSecond) {
                    $movingTime += $seconds;
                }
            }
        }

        $elapsedTime = $firstTime !== null && $lastTime !== null
            ? max(0, $lastTime->getTimestamp() - $firstTime->getTimestamp())
            : null;

        $averageSpeed = $movingTime > 0 ? $distance / $movingTime : null;
        $elevation = $this->elevationCalculator->calculate($gpx);

        return new ActivityStatistics(
            distanceMeters: $distance,
            elapsedTimeSeconds: $elapsedTime,
            movingTimeSeconds: $movingTime > 0 ? $movingTime : ($elapsedTime === 0 ? 0 : null),
            averageSpeedMetersPerSecond: $averageSpeed,
            maxSpeedMetersPerSecond: $maxSpeed,
            elevationGainMeters: $elevation->gainMeters,
            elevationLossMeters: $elevation->lossMeters,
            minimumElevationMeters: $elevation->minimumMeters,
            maximumElevationMeters: $elevation->maximumMeters,
        );
    }

    private function secondsBetween(TrackPoint $from, TrackPoint $to): ?int
    {
        if ($from->recordedAt === null || $to->recordedAt === null) {
            return null;
        }

        return $to->recordedAt->getTimestamp() - $from->recordedAt->getTimestamp();
    }
}
