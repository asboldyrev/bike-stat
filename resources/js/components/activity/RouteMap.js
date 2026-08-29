import { h } from 'vue';
import { buildRouteMap } from '../../activityVisualization.js';

function polylinePoints(points) {
    return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

export const RouteMap = {
    props: {
        points: {
            type: Array,
            required: true,
        },
    },

    setup(props) {
        return () => {
            const map = buildRouteMap(props.points);

            if (!map) {
                return h('div', { class: 'rounded-xl border bg-white p-5 text-sm text-slate-500' },
                    'Для этой поездки нет координат маршрута.');
            }

            return h('section', { class: 'overflow-hidden rounded-xl border bg-white' }, [
                h('div', { class: 'flex items-center justify-between gap-3 px-4 py-3 sm:px-5' }, [
                    h('h2', { class: 'font-semibold' }, 'Маршрут'),
                    h('span', { class: 'text-xs text-slate-500' }, `OSM · z${map.zoom}`),
                ]),
                h('div', { class: 'relative w-full overflow-hidden bg-slate-100' }, [
                    h('svg', {
                        viewBox: `0 0 ${map.width} ${map.height}`,
                        class: 'block h-auto w-full max-h-[70vh]',
                        role: 'img',
                        'aria-label': 'Карта маршрута поездки',
                    }, [
                        h('rect', { x: 0, y: 0, width: map.width, height: map.height, fill: '#e2e8f0' }),
                        ...map.tiles.map((tile) => h('image', {
                            href: tile.href,
                            x: tile.x,
                            y: tile.y,
                            width: tile.width,
                            height: tile.height,
                            preserveAspectRatio: 'none',
                        })),
                        ...map.segments.map((segment) => h('polyline', {
                            points: polylinePoints(segment),
                            fill: 'none',
                            stroke: '#0f172a',
                            'stroke-width': 6,
                            'stroke-linecap': 'round',
                            'stroke-linejoin': 'round',
                            'vector-effect': 'non-scaling-stroke',
                        })),
                        map.start ? h('circle', {
                            cx: map.start.x,
                            cy: map.start.y,
                            r: 10,
                            fill: '#16a34a',
                            stroke: '#ffffff',
                            'stroke-width': 4,
                            'vector-effect': 'non-scaling-stroke',
                        }) : null,
                        map.end ? h('circle', {
                            cx: map.end.x,
                            cy: map.end.y,
                            r: 10,
                            fill: '#dc2626',
                            stroke: '#ffffff',
                            'stroke-width': 4,
                            'vector-effect': 'non-scaling-stroke',
                        }) : null,
                    ]),
                ]),
                h('div', { class: 'px-4 py-2 text-[11px] text-slate-500 sm:px-5' }, [
                    '© ',
                    h('a', {
                        href: 'https://www.openstreetmap.org/copyright',
                        target: '_blank',
                        rel: 'noreferrer',
                        class: 'underline',
                    }, 'OpenStreetMap contributors'),
                ]),
            ]);
        };
    },
};
