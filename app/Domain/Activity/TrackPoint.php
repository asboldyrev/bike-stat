<?php

namespace App\Domain\Activity;

use DateTimeImmutable;

final readonly class TrackPoint
{
    public function __construct(
        public float $latitude,
        public float $longitude,
        public ?float $elevation,
        public ?DateTimeImmutable $recordedAt,
        public ?int $heartRate = null,
        public ?int $cadence = null,
        public ?float $power = null,
        public ?float $temperature = null,
        public ?float $sourceDistanceMeters = null,
        public ?float $sourceSpeedMetersPerSecond = null,
        public ?float $courseDegrees = null,
    ) {
    }
}
