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
        $fallbackDistance = 0.0;
        $fallbackMovingTime = 0;
        $fallbackMaxSpeed = null;
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
                $fallbackDistance += $segmentDistance;

                $seconds = $this->secondsBetween($previous, $current);

                if ($seconds === null || $seconds <= 0) {
                    continue;
                }

                $speed = $segmentDistance / $seconds;
                $fallbackMaxSpeed = $fallbackMaxSpeed === null
                    ? $speed
                    : max($fallbackMaxSpeed, $speed);

                if ($speed >= $this->movingThresholdMetersPerSecond) {
                    $fallbackMovingTime += $seconds;
                }
            }
        }

        $elapsedTime = $firstTime !== null && $lastTime !== null
            ? max(0, $lastTime->getTimestamp() - $firstTime->getTimestamp())
            : null;

        $sourceMetrics = $this->completeSourceMetrics($gpx);

        $distance = $sourceMetrics['distance'] ?? $fallbackDistance;
        $movingTime = $sourceMetrics['moving_time'] ?? $fallbackMovingTime;
        $maxSpeed = $sourceMetrics['max_speed'] ?? $fallbackMaxSpeed;
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

    /**
     * Complete cumulative distance + point speed data is treated as source-device
     * telemetry. When present for the whole track, it is more reliable than
     * one-second GPS coordinate deltas for cycling distance and peak speed.
     *
     * @return array{distance: float, moving_time: int, max_speed: float}|null
     */
    private function completeSourceMetrics(ParsedGpx $gpx): ?array
    {
        $points = $gpx->points();

        if ($points === []) {
            return null;
        }

        $previousDistance = null;
        $lastDistance = null;
        $maxSpeed = null;

        foreach ($points as $point) {
            if (
                $point->sourceDistanceMeters === null
                || $point->sourceSpeedMetersPerSecond === null
            ) {
                return null;
            }

            if (
                $previousDistance !== null
                && $point->sourceDistanceMeters < $previousDistance
            ) {
                return null;
            }

            $previousDistance = $point->sourceDistanceMeters;
            $lastDistance = $point->sourceDistanceMeters;
            $maxSpeed = $maxSpeed === null
                ? $point->sourceSpeedMetersPerSecond
                : max($maxSpeed, $point->sourceSpeedMetersPerSecond);
        }

        if ($lastDistance === null || $maxSpeed === null) {
            return null;
        }

        $movingTime = 0;

        foreach ($gpx->segments as $segment) {
            $first = $segment->points[0] ?? null;
            $last = $segment->points[count($segment->points) - 1] ?? null;

            if ($first === null || $last === null) {
                continue;
            }

            $seconds = $this->secondsBetween($first, $last);

            if ($seconds !== null && $seconds > 0) {
                $movingTime += $seconds;
            }
        }

        return [
            'distance' => $lastDistance,
            'moving_time' => $movingTime,
            'max_speed' => $maxSpeed,
        ];
    }

    private function secondsBetween(TrackPoint $from, TrackPoint $to): ?int
    {
        if ($from->recordedAt === null || $to->recordedAt === null) {
            return null;
        }

        return $to->recordedAt->getTimestamp() - $from->recordedAt->getTimestamp();
    }
}
