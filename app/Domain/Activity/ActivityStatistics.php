<?php

namespace App\Domain\Activity;

final readonly class ActivityStatistics
{
    public function __construct(
        public float $distanceMeters,
        public ?int $elapsedTimeSeconds,
        public ?int $movingTimeSeconds,
        public ?float $averageSpeedMetersPerSecond,
        public ?float $maxSpeedMetersPerSecond,
        public float $elevationGainMeters,
        public float $elevationLossMeters,
        public ?float $minimumElevationMeters,
        public ?float $maximumElevationMeters,
    ) {
    }
}
