<?php

namespace App\Domain\Activity\Services;

use App\Domain\Activity\TrackPoint;

final class MaximumSpeedCalculator
{
    public function __construct(
        private readonly DistanceCalculator $distanceCalculator = new DistanceCalculator(),
        private readonly float $isolatedSpikeRatio = 3.0,
        private readonly float $isolatedSpikeDeltaMetersPerSecond = 5.0,
    ) {
    }

    /**
     * @param list<TrackPoint> $points
     */
    public function fromCoordinates(array $points): ?float
    {
        $speeds = [];

        for ($i = 1, $count = count($points); $i < $count; $i++) {
            $previous = $points[$i - 1];
            $current = $points[$i];

            if ($previous->recordedAt === null || $current->recordedAt === null) {
                $speeds[] = null;

                continue;
            }

            $seconds = $current->recordedAt->getTimestamp() - $previous->recordedAt->getTimestamp();

            if ($seconds <= 0) {
                $speeds[] = null;

                continue;
            }

            $speeds[] = $this->distanceCalculator->between($previous, $current) / $seconds;
        }

        $accepted = [];

        foreach ($speeds as $index => $speed) {
            if ($speed === null) {
                continue;
            }

            $previous = $index > 0 ? $speeds[$index - 1] : null;
            $next = $index + 1 < count($speeds) ? $speeds[$index + 1] : null;

            if ($this->isIsolatedSpike($speed, $previous, $next)) {
                continue;
            }

            $accepted[] = $speed;
        }

        return $accepted === [] ? null : max($accepted);
    }

    private function isIsolatedSpike(float $speed, ?float $previous, ?float $next): bool
    {
        if ($previous === null || $next === null) {
            return false;
        }

        $neighborPeak = max($previous, $next);

        if ($neighborPeak <= 0.0) {
            return $speed >= $this->isolatedSpikeDeltaMetersPerSecond;
        }

        return $speed >= $neighborPeak * $this->isolatedSpikeRatio
            && $speed - $neighborPeak >= $this->isolatedSpikeDeltaMetersPerSecond;
    }
}
