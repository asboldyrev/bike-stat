import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildMetricSeries,
    buildRouteMap,
    chartPolyline,
} from '../../resources/js/activityVisualization.js';

test('route map preserves GPX segment gaps', () => {
    const map = buildRouteMap([
        { latitude: 52, longitude: 5, segment_index: 0 },
        { latitude: 52.001, longitude: 5.001, segment_index: 0 },
        { latitude: 52.01, longitude: 5.01, segment_index: 1 },
        { latitude: 52.011, longitude: 5.011, segment_index: 1 },
    ]);

    assert.ok(map);
    assert.equal(map.segments.length, 2);
    assert.equal(map.start.x, map.segments[0][0].x);
    assert.equal(map.end.x, map.segments[1].at(-1).x);
    assert.ok(map.tiles.length > 0);
});

test('metric series uses cumulative source distance when monotonic', () => {
    const series = buildMetricSeries([
        { source_distance_meters: 0, elevation_meters: 100 },
        { source_distance_meters: 50, elevation_meters: 110 },
        { source_distance_meters: 100, elevation_meters: 105 },
    ], 'elevation_meters');

    assert.equal(series.xMode, 'distance');
    assert.equal(series.minimum, 100);
    assert.equal(series.maximum, 110);
});

test('zero-only source speed is unavailable for the speed chart', () => {
    const series = buildMetricSeries([
        { source_distance_meters: 0, source_speed_mps: 0 },
        { source_distance_meters: 10, source_speed_mps: 0 },
    ], 'source_speed_mps', {
        multiplier: 3.6,
        requirePositive: true,
    });

    assert.equal(series, null);
});

test('chart geometry stays inside the view box', () => {
    const series = buildMetricSeries([
        { source_distance_meters: 0, elevation_meters: 100 },
        { source_distance_meters: 100, elevation_meters: 120 },
    ], 'elevation_meters');

    const geometry = chartPolyline(series);

    assert.ok(geometry.points.every((point) =>
        point.x >= geometry.plot.left
        && point.x <= geometry.plot.right
        && point.y >= geometry.plot.top
        && point.y <= geometry.plot.bottom
    ));
});
