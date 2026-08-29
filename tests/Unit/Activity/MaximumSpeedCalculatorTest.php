<?php

namespace Tests\Unit\Activity;

use App\Domain\Activity\Services\MaximumSpeedCalculator;
use App\Domain\Activity\TrackPoint;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MaximumSpeedCalculatorTest extends TestCase
{
    #[Test]
    public function it_rejects_one_isolated_gps_jump_between_normal_intervals(): void
    {
        $points = [
            $this->point(51.193600, 82.243218, 0),
            $this->point(51.193552, 82.243170, 6),
            $this->point(51.193636, 82.241939, 12),
            $this->point(51.193675, 82.241811, 18),
        ];

        $speed = (new MaximumSpeedCalculator())->fromCoordinates($points);

        // The middle coordinate correction is ~51.8 km/h, while the adjacent
        // intervals are only a few km/h. It must not become the ride maximum.
        self::assertNotNull($speed);
        self::assertLessThan(10 / 3.6, $speed);
    }

    #[Test]
    public function it_keeps_a_sustained_high_speed_section(): void
    {
        $points = [
            $this->point(52.00000, 5.00000, 0),
            $this->point(52.00000, 5.00015, 1),
            $this->point(52.00000, 5.00035, 2),
            $this->point(52.00000, 5.00055, 3),
            $this->point(52.00000, 5.00070, 4),
        ];

        $speed = (new MaximumSpeedCalculator())->fromCoordinates($points);

        self::assertNotNull($speed);
        self::assertGreaterThan(40 / 3.6, $speed);
    }

    private function point(float $latitude, float $longitude, int $seconds): TrackPoint
    {
        return new TrackPoint(
            latitude: $latitude,
            longitude: $longitude,
            elevation: null,
            recordedAt: new DateTimeImmutable(sprintf('2026-08-29T10:00:%02dZ', $seconds)),
        );
    }
}
