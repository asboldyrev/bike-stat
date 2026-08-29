<?php

namespace Tests\Unit\Gpx;

use App\Infrastructure\Gpx\GpxParser;
use App\Infrastructure\Gpx\InvalidGpxException;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class GpxParserTest extends TestCase
{
    #[Test]
    public function it_parses_track_points_and_name(): void
    {
        $gpx = (new GpxParser())->parse($this->fixture('simple.gpx'));

        self::assertSame('Simple ride', $gpx->name);
        self::assertCount(1, $gpx->segments);
        self::assertCount(3, $gpx->points());
        self::assertSame(52.0, $gpx->points()[0]->latitude);
        self::assertSame(10.0, $gpx->points()[0]->elevation);
        self::assertSame('2026-08-29T10:00:00+00:00', $gpx->points()[0]->recordedAt?->format(DATE_ATOM));
    }

    #[Test]
    public function it_parses_common_track_point_extensions_by_local_name(): void
    {
        $point = (new GpxParser())->parse($this->fixture('extensions.gpx'))->points()[0];

        self::assertSame(142, $point->heartRate);
        self::assertSame(84, $point->cadence);
        self::assertSame(215.0, $point->power);
        self::assertSame(21.5, $point->temperature);
    }

    #[Test]
    public function it_parses_supercycle_source_metrics(): void
    {
        $gpx = (new GpxParser())->parse($this->fixture('supercycle.gpx'));
        $point = $gpx->points()[0];

        self::assertSame('SuperCycle sample', $gpx->name);
        self::assertSame(4.1, $point->sourceDistanceMeters);
        self::assertSame(2.0, $point->sourceSpeedMetersPerSecond);
        self::assertSame(10.0, $point->courseDegrees);
        self::assertSame(66, $point->cadence);
    }

    #[Test]
    public function it_rejects_malformed_xml(): void
    {
        $this->expectException(InvalidGpxException::class);

        (new GpxParser())->parse($this->fixture('malformed.gpx'));
    }

    #[Test]
    public function it_rejects_doctype_and_entities(): void
    {
        $this->expectException(InvalidGpxException::class);

        (new GpxParser())->parse('<!DOCTYPE gpx [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><gpx>&xxe;</gpx>');
    }

    private function fixture(string $name): string
    {
        return file_get_contents(__DIR__.'/../../Fixtures/gpx/'.$name);
    }
}
