const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

function clampLatitude(latitude) {
    return Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, Number(latitude)));
}

function project(latitude, longitude, zoom) {
    const lat = clampLatitude(latitude);
    const lon = Number(longitude);
    const scale = TILE_SIZE * (2 ** zoom);
    const sin = Math.sin(lat * Math.PI / 180);

    return {
        x: ((lon + 180) / 360) * scale,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
    };
}

function validTrackPoints(points) {
    return points.filter((point) =>
        Number.isFinite(Number(point.latitude))
        && Number.isFinite(Number(point.longitude))
    );
}

export function buildRouteMap(points, {
    width = 1000,
    height = 620,
    padding = 42,
    minZoom = 2,
    maxZoom = 18,
} = {}) {
    const valid = validTrackPoints(points);

    if (valid.length === 0) {
        return null;
    }

    let zoom = minZoom;
    let projected = [];

    for (let candidate = maxZoom; candidate >= minZoom; candidate--) {
        const candidatePoints = valid.map((point) => ({
            ...project(point.latitude, point.longitude, candidate),
            segmentIndex: Number(point.segment_index ?? 0),
        }));

        const xs = candidatePoints.map((point) => point.x);
        const ys = candidatePoints.map((point) => point.y);
        const spanX = Math.max(...xs) - Math.min(...xs);
        const spanY = Math.max(...ys) - Math.min(...ys);

        if (spanX <= width - padding * 2 && spanY <= height - padding * 2) {
            zoom = candidate;
            projected = candidatePoints;
            break;
        }
    }

    if (projected.length === 0) {
        projected = valid.map((point) => ({
            ...project(point.latitude, point.longitude, zoom),
            segmentIndex: Number(point.segment_index ?? 0),
        }));
    }

    const xs = projected.map((point) => point.x);
    const ys = projected.map((point) => point.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const originX = centerX - width / 2;
    const originY = centerY - height / 2;

    const firstTileX = Math.floor(originX / TILE_SIZE);
    const lastTileX = Math.floor((originX + width) / TILE_SIZE);
    const firstTileY = Math.floor(originY / TILE_SIZE);
    const lastTileY = Math.floor((originY + height) / TILE_SIZE);
    const tileCount = 2 ** zoom;
    const tiles = [];

    for (let tileY = firstTileY; tileY <= lastTileY; tileY++) {
        if (tileY < 0 || tileY >= tileCount) {
            continue;
        }

        for (let tileX = firstTileX; tileX <= lastTileX; tileX++) {
            const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;

            tiles.push({
                href: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
                x: tileX * TILE_SIZE - originX,
                y: tileY * TILE_SIZE - originY,
                width: TILE_SIZE,
                height: TILE_SIZE,
            });
        }
    }

    const groups = new Map();

    projected.forEach((point) => {
        if (!groups.has(point.segmentIndex)) {
            groups.set(point.segmentIndex, []);
        }

        groups.get(point.segmentIndex).push({
            x: point.x - originX,
            y: point.y - originY,
        });
    });

    const segments = [...groups.values()]
        .filter((segment) => segment.length > 0)
        .map((segment) => downsampleRoute(segment, 1400));

    return {
        width,
        height,
        zoom,
        tiles,
        segments,
        start: segments[0]?.[0] ?? null,
        end: segments.at(-1)?.at(-1) ?? null,
    };
}

function downsampleRoute(points, maxPoints) {
    if (points.length <= maxPoints) {
        return points;
    }

    const step = Math.ceil(points.length / maxPoints);
    const result = [];

    for (let index = 0; index < points.length; index += step) {
        result.push(points[index]);
    }

    if (result.at(-1) !== points.at(-1)) {
        result.push(points.at(-1));
    }

    return result;
}

export function buildMetricSeries(points, field, {
    multiplier = 1,
    maxPoints = 600,
    requirePositive = false,
} = {}) {
    const raw = points
        .map((point, index) => {
            const value = Number(point[field]);

            if (!Number.isFinite(value)) {
                return null;
            }

            return {
                x: Number.isFinite(Number(point.source_distance_meters))
                    ? Number(point.source_distance_meters)
                    : index,
                y: value * multiplier,
                index,
            };
        })
        .filter(Boolean);

    if (raw.length < 2) {
        return null;
    }

    if (requirePositive && !raw.some((point) => point.y > 0)) {
        return null;
    }

    const usesDistance = raw.every((point, index) =>
        index === 0 || point.x >= raw[index - 1].x
    ) && raw.some((point) => point.x > raw[0].x);

    if (!usesDistance) {
        raw.forEach((point, index) => {
            point.x = index;
        });
    }

    const sampled = downsampleMinMax(raw, maxPoints);

    return {
        points: sampled,
        xMode: usesDistance ? 'distance' : 'progress',
        minimum: Math.min(...raw.map((point) => point.y)),
        maximum: Math.max(...raw.map((point) => point.y)),
    };
}

function downsampleMinMax(points, maxPoints) {
    if (points.length <= maxPoints) {
        return points;
    }

    const bucketSize = Math.ceil(points.length / Math.max(1, Math.floor(maxPoints / 2)));
    const result = [points[0]];

    for (let start = 1; start < points.length - 1; start += bucketSize) {
        const bucket = points.slice(start, Math.min(points.length - 1, start + bucketSize));

        if (bucket.length === 0) {
            continue;
        }

        let minimum = bucket[0];
        let maximum = bucket[0];

        for (const point of bucket) {
            if (point.y < minimum.y) minimum = point;
            if (point.y > maximum.y) maximum = point;
        }

        if (minimum.index < maximum.index) {
            result.push(minimum, maximum);
        } else if (maximum.index < minimum.index) {
            result.push(maximum, minimum);
        } else {
            result.push(minimum);
        }
    }

    result.push(points.at(-1));

    return result;
}

export function chartPolyline(series, {
    width = 1000,
    height = 260,
    paddingLeft = 58,
    paddingRight = 18,
    paddingTop = 18,
    paddingBottom = 38,
} = {}) {
    if (!series?.points?.length) {
        return null;
    }

    const minX = Math.min(...series.points.map((point) => point.x));
    const maxX = Math.max(...series.points.map((point) => point.x));
    const minY = series.minimum;
    const maxY = series.maximum;
    const xRange = Math.max(1, maxX - minX);
    const yRange = Math.max(1, maxY - minY);
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const points = series.points.map((point) => ({
        x: paddingLeft + ((point.x - minX) / xRange) * plotWidth,
        y: paddingTop + (1 - ((point.y - minY) / yRange)) * plotHeight,
    }));

    return {
        width,
        height,
        points,
        plot: {
            left: paddingLeft,
            right: width - paddingRight,
            top: paddingTop,
            bottom: height - paddingBottom,
        },
    };
}
