<?php

namespace App\Domain\Activity;

final readonly class ParsedGpx
{
    /**
     * @param list<TrackSegment> $segments
     */
    public function __construct(
        public ?string $name,
        public array $segments,
    ) {
    }

    /**
     * @return list<TrackPoint>
     */
    public function points(): array
    {
        return array_values(array_merge(...array_map(
            static fn (TrackSegment $segment): array => $segment->points,
            $this->segments,
        )));
    }
}
