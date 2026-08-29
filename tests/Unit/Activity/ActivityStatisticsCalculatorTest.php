<?php

namespace Tests\Unit\Activity;

use App\Domain\Activity\Services\ActivityStatisticsCalculator;
use App\Infrastructure\Gpx\GpxParser;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ActivityStatisticsCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_basic_statistics_for_a_track(): void
    {
        $gpx = (new GpxParser())->parse(
            file_get_contents(__DIR__.'/../../Fixtures/gpx/simple.gpx'),
        );

        $statistics = (new ActivityStatisticsCalculator())->calculate($gpx);

        self::assertEqualsWithDelta(136.9, $statistics->distanceMeters, 1.0);
        self::assertSame(20, $statistics->elapsedTimeSeconds);
        self::assertSame(20, $statistics->movingTimeSeconds);
        self::assertEqualsWithDelta(6.84, $statistics->averageSpeedMetersPerSecond, 0.1);
        self::assertEqualsWithDelta(6.84, $statistics->maxSpeedMetersPerSecond, 0.1);
        self::assertSame(2.0, $statistics->elevationGainMeters);
        self::assertSame(3.0, $statistics->elevationLossMeters);
        self::assertSame(9.0, $statistics->minimumElevationMeters);
        self::assertSame(12.0, $statistics->maximumElevationMeters);
    }
}
