<?php

namespace App\Domain\Activity\Services;

use App\Domain\Activity\ElevationStatistics;
use App\Domain\Activity\ParsedGpx;
use App\Domain\Activity\TrackPoint;

final class ElevationCalculator
{
    public function __construct(
        private readonly DistanceCalculator $distanceCalculator = new DistanceCalculator(),
        private readonly int $medianWindowPoints = 5,
        private readonly float $maximumGrade = 0.40,
    ) {
    }

    public function calculate(ParsedGpx $gpx): ElevationStatistics
    {
        $gain = 0.0;
        $loss = 0.0;
        $filteredElevations = [];

        foreach ($gpx->segments as $segment) {
            $points = $segment->points;

            if ($points === []) {
                continue;
            }

            $elevations = array_map(
                static fn (TrackPoint $point): ?float => $point->elevation,
                $points,
            );

            $filtered = $this->medianFilter($elevations);

            foreach ($filtered as $elevation) {
                if ($elevation !== null) {
                    $filteredElevations[] = $elevation;
                }
            }

            for ($i = 1, $count = count($points); $i < $count; $i++) {
                $previousElevation = $filtered[$i - 1];
                $currentElevation = $filtered[$i];

                if ($previousElevation === null || $currentElevation === null) {
                    continue;
                }

                $horizontalDistance = $this->horizontalDistance($points[$i - 1], $points[$i]);

                if ($horizontalDistance <= 0.0) {
                    continue;
                }

                $deltaElevation = $currentElevation - $previousElevation;
                $grade = abs($deltaElevation) / $horizontalDistance;

                if ($grade > $this->maximumGrade) {
                    continue;
                }

                if ($deltaElevation > 0) {
                    $gain += $deltaElevation;
                } elseif ($deltaElevation < 0) {
                    $loss += abs($deltaElevation);
                }
            }
        }

        return new ElevationStatistics(
            gainMeters: $gain,
            lossMeters: $loss,
            minimumMeters: $filteredElevations === [] ? null : min($filteredElevations),
            maximumMeters: $filteredElevations === [] ? null : max($filteredElevations),
        );
    }

    /**
     * @param list<?float> $elevations
     * @return list<?float>
     */
    private function medianFilter(array $elevations): array
    {
        if ($this->medianWindowPoints <= 1) {
            return $elevations;
        }

        $radius = intdiv($this->medianWindowPoints, 2);
        $filtered = [];

        foreach ($elevations as $index => $elevation) {
            if ($elevation === null) {
                $filtered[] = null;

                continue;
            }

            $window = [];

            $start = max(0, $index - $radius);
            $end = min(count($elevations) - 1, $index + $radius);

            for ($i = $start; $i <= $end; $i++) {
                if ($elevations[$i] !== null) {
                    $window[] = $elevations[$i];
                }
            }

            sort($window, SORT_NUMERIC);

            $count = count($window);

            if ($count === 0) {
                $filtered[] = null;

                continue;
            }

            $middle = intdiv($count, 2);

            $filtered[] = $count % 2 === 1
                ? $window[$middle]
                : ($window[$middle - 1] + $window[$middle]) / 2;
        }

        return $filtered;
    }

    private function horizontalDistance(TrackPoint $from, TrackPoint $to): float
    {
        if (
            $from->sourceDistanceMeters !== null
            && $to->sourceDistanceMeters !== null
            && $to->sourceDistanceMeters >= $from->sourceDistanceMeters
        ) {
            return $to->sourceDistanceMeters - $from->sourceDistanceMeters;
        }

        return $this->distanceCalculator->between($from, $to);
    }
}
