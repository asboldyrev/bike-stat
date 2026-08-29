<?php

namespace App\Infrastructure\Gpx;

use App\Domain\Activity\ParsedGpx;
use App\Domain\Activity\TrackPoint;
use App\Domain\Activity\TrackSegment;
use DateTimeImmutable;
use DOMDocument;
use DOMElement;
use DOMXPath;
use Throwable;

final class GpxParser
{
    public function parse(string $xml): ParsedGpx
    {
        if (trim($xml) === '') {
            throw new InvalidGpxException('GPX document is empty.');
        }

        if (stripos($xml, '<!DOCTYPE') !== false || stripos($xml, '<!ENTITY') !== false) {
            throw new InvalidGpxException('DOCTYPE and ENTITY declarations are not allowed.');
        }

        $document = new DOMDocument();

        $previous = libxml_use_internal_errors(true);

        try {
            $loaded = $document->loadXML($xml, LIBXML_NONET | LIBXML_NOBLANKS);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        if (! $loaded || $document->documentElement?->localName !== 'gpx') {
            throw new InvalidGpxException('Document is not valid GPX XML.');
        }

        $xpath = new DOMXPath($document);
        $segments = [];

        foreach ($xpath->query('//*[local-name()="trkseg"]') ?: [] as $segmentNode) {
            $points = [];

            foreach ($xpath->query('./*[local-name()="trkpt"]', $segmentNode) ?: [] as $pointNode) {
                if (! $pointNode instanceof DOMElement) {
                    continue;
                }

                $points[] = $this->parsePoint($xpath, $pointNode);
            }

            if ($points !== []) {
                $segments[] = new TrackSegment($points);
            }
        }

        if ($segments === []) {
            throw new InvalidGpxException('GPX document does not contain track points.');
        }

        $name = $this->firstText($xpath, '//*[local-name()="trk"]/*[local-name()="name"][1]');

        return new ParsedGpx($name, $segments);
    }

    private function parsePoint(DOMXPath $xpath, DOMElement $node): TrackPoint
    {
        $latitude = filter_var($node->getAttribute('lat'), FILTER_VALIDATE_FLOAT);
        $longitude = filter_var($node->getAttribute('lon'), FILTER_VALIDATE_FLOAT);

        if ($latitude === false || $longitude === false) {
            throw new InvalidGpxException('Track point contains invalid coordinates.');
        }

        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            throw new InvalidGpxException('Track point coordinates are outside valid ranges.');
        }

        $time = $this->firstText($xpath, './*[local-name()="time"]', $node);

        try {
            $recordedAt = $time === null ? null : new DateTimeImmutable($time);
        } catch (Throwable) {
            throw new InvalidGpxException('Track point contains invalid timestamp.');
        }

        return new TrackPoint(
            latitude: (float) $latitude,
            longitude: (float) $longitude,
            elevation: $this->nullableFloat($this->firstText($xpath, './*[local-name()="ele"]', $node)),
            recordedAt: $recordedAt,
            heartRate: $this->nullableInt($this->firstText($xpath, './/*[local-name()="hr"]', $node)),
            cadence: $this->nullableInt($this->firstText($xpath, './/*[local-name()="cad"]', $node)),
            power: $this->nullableFloat($this->firstText($xpath, './/*[local-name()="power"]', $node)),
            temperature: $this->nullableFloat(
                $this->firstText($xpath, './/*[local-name()="atemp" or local-name()="temp"]', $node),
            ),
        );
    }

    private function firstText(DOMXPath $xpath, string $query, ?DOMElement $context = null): ?string
    {
        $nodes = $xpath->query($query, $context);

        if ($nodes === false || $nodes->length === 0) {
            return null;
        }

        $value = trim($nodes->item(0)?->textContent ?? '');

        return $value === '' ? null : $value;
    }

    private function nullableFloat(?string $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $validated = filter_var($value, FILTER_VALIDATE_FLOAT);

        return $validated === false ? null : (float) $validated;
    }

    private function nullableInt(?string $value): ?int
    {
        if ($value === null) {
            return null;
        }

        $validated = filter_var($value, FILTER_VALIDATE_INT);

        return $validated === false ? null : (int) $validated;
    }
}
