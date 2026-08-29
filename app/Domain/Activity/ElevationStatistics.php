<?php

namespace App\Domain\Activity;

final readonly class ElevationStatistics
{
    public function __construct(
        public float $gainMeters,
        public float $lossMeters,
        public ?float $minimumMeters,
        public ?float $maximumMeters,
    ) {
    }
}
