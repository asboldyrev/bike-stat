<?php

namespace Tests\Unit\Activity;

use App\Domain\Activity\ParsedGpx;
use App\Domain\Activity\Services\ElevationCalculator;
use App\Domain\Activity\TrackPoint;
use App\Domain\Activity\TrackSegment;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ElevationCalculatorTest extends TestCase
{
    #[Test]
    public function it_ignores_elevation_change_while_source_distance_does_not_change(): void
    {
        $gpx = new ParsedGpx('Stationary noise', [
            new TrackSegment([
                $this->point(100.0, 0.0),
                $this->point(110.0, 0.0),
                $this->point(90.0, 0.0),
                $this->point(100.0, 0.0),
                $this->point(101.0, 0.0),
            ]),
        ]);

        $statistics = (new ElevationCalculator())->calculate($gpx);

        self::assertSame(0.0, $statistics->gainMeters);
        self::assertSame(0.0, $statistics->lossMeters);
    }

    #[Test]
    public function it_rejects_physically_implausible_grade_spikes(): void
    {
        $gpx = new ParsedGpx('Spike', [
            new TrackSegment([
                $this->point(100.0, 0.0),
                $this->point(100.2, 5.0),
                $this->point(120.0, 10.0),
                $this->point(100.4, 15.0),
                $this->point(100.6, 20.0),
            ]),
        ]);

        $statistics = (new ElevationCalculator(
            medianWindowPoints: 1,
            maximumGrade: 0.40,
        ))->calculate($gpx);

        self::assertEqualsWithDelta(0.6, $statistics->gainMeters, 0.001);
        self::assertSame(0.0, $statistics->lossMeters);
    }

    #[Test]
    public function it_uses_haversine_distance_when_source_distance_is_missing(): void
    {
        $gpx = new ParsedGpx('Generic GPX', [
            new TrackSegment([
                new TrackPoint(52.0, 5.0, 100.0, new DateTimeImmutable('2026-08-29T10:00:00Z')),
                new TrackPoint(52.0, 5.001, 102.0, new DateTimeImmutable('2026-08-29T10:00:10Z')),
            ]),
        ]);

        $statistics = (new ElevationCalculator(
            medianWindowPoints: 1,
            maximumGrade: 0.40,
        ))->calculate($gpx);

        self::assertSame(2.0, $statistics->gainMeters);
        self::assertSame(0.0, $statistics->lossMeters);
    }

    private function point(float $elevation, float $sourceDistance): TrackPoint
    {
        return new TrackPoint(
            latitude: 52.0,
            longitude: 5.0,
            elevation: $elevation,
            recordedAt: new DateTimeImmutable('2026-08-29T10:00:00Z'),
            sourceDistanceMeters: $sourceDistance,
        );
    }
}
