<?php

namespace App\Domain\Activity\Services;

use App\Domain\Activity\TrackPoint;

final class DistanceCalculator
{
    private const EARTH_RADIUS_METERS = 6371008.8;

    public function between(TrackPoint $from, TrackPoint $to): float
    {
        $lat1 = deg2rad($from->latitude);
        $lat2 = deg2rad($to->latitude);
        $deltaLat = deg2rad($to->latitude - $from->latitude);
        $deltaLon = deg2rad($to->longitude - $from->longitude);

        $a = sin($deltaLat / 2) ** 2
            + cos($lat1) * cos($lat2) * sin($deltaLon / 2) ** 2;

        return 2 * self::EARTH_RADIUS_METERS * asin(min(1.0, sqrt($a)));
    }
}
