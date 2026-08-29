<?php

namespace Tests\Unit\Activity;

use App\Domain\Activity\Services\ActivityStatisticsCalculator;
use App\Domain\Activity\Services\ElevationCalculator;
use App\Infrastructure\Gpx\GpxParser;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ActivityStatisticsCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_basic_statistics_for_a_generic_track(): void
    {
        $gpx = (new GpxParser())->parse(
            file_get_contents(__DIR__.'/../../Fixtures/gpx/simple.gpx'),
        );

        $statistics = (new ActivityStatisticsCalculator(
            elevationCalculator: new ElevationCalculator(medianWindowPoints: 1),
        ))->calculate($gpx);

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

    #[Test]
    public function it_filters_an_isolated_gps_spike_when_source_speed_is_not_usable(): void
    {
        $gpx = (new GpxParser())->parse(
            file_get_contents(__DIR__.'/../../Fixtures/gpx/supercycle-legacy-zero-speed.gpx'),
        );

        $statistics = (new ActivityStatisticsCalculator())->calculate($gpx);

        self::assertNotNull($statistics->maxSpeedMetersPerSecond);
        self::assertLessThan(10 / 3.6, $statistics->maxSpeedMetersPerSecond);
    }

    #[Test]
    public function it_prefers_complete_source_telemetry_over_one_second_gps_deltas(): void
    {
        $gpx = (new GpxParser())->parse(
            file_get_contents(__DIR__.'/../../Fixtures/gpx/supercycle.gpx'),
        );

        $statistics = (new ActivityStatisticsCalculator(
            elevationCalculator: new ElevationCalculator(medianWindowPoints: 1),
        ))->calculate($gpx);

        // Source cumulative distance is authoritative when complete and monotonic.
        self::assertSame(16.0, $statistics->distanceMeters);

        // Two one-second recording segments with a nine-second pause between them.
        self::assertSame(11, $statistics->elapsedTimeSeconds);
        self::assertSame(2, $statistics->movingTimeSeconds);

        // 16 m / 2 s = 8 m/s.
        self::assertSame(8.0, $statistics->averageSpeedMetersPerSecond);

        // GPS contains an intentionally large one-second coordinate jump, but the
        // recorded device speed remains the peak source value.
        self::assertSame(5.0, $statistics->maxSpeedMetersPerSecond);
    }
}
