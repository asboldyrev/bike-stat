<?php

namespace App\Domain\Activity;

final readonly class TrackSegment
{
    /**
     * @param list<TrackPoint> $points
     */
    public function __construct(public array $points)
    {
    }
}
