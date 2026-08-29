import { h } from 'vue';
import { chartPolyline } from '../../activityVisualization.js';

function pointsAttribute(points) {
    return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

function formatNumber(value, digits = 0) {
    return Number(value).toFixed(digits);
}

export const MetricChart = {
    props: {
        title: { type: String, required: true },
        series: { type: Object, default: null },
        unit: { type: String, required: true },
        digits: { type: Number, default: 0 },
        unavailableMessage: { type: String, default: 'Нет данных для графика.' },
    },

    setup(props) {
        return () => {
            if (!props.series) {
                return h('section', { class: 'rounded-xl border bg-white p-4 sm:p-5' }, [
                    h('h2', { class: 'font-semibold' }, props.title),
                    h('p', { class: 'mt-3 text-sm text-slate-500' }, props.unavailableMessage),
                ]);
            }

            const geometry = chartPolyline(props.series);

            return h('section', { class: 'rounded-xl border bg-white p-4 sm:p-5' }, [
                h('div', { class: 'flex flex-wrap items-baseline justify-between gap-2' }, [
                    h('h2', { class: 'font-semibold' }, props.title),
                    h('div', { class: 'text-xs text-slate-500' },
                        `${formatNumber(props.series.minimum, props.digits)}–${formatNumber(props.series.maximum, props.digits)} ${props.unit}`),
                ]),
                h('div', { class: 'mt-3 overflow-hidden' }, [
                    h('svg', {
                        viewBox: `0 0 ${geometry.width} ${geometry.height}`,
                        class: 'block h-auto w-full',
                        role: 'img',
                        'aria-label': props.title,
                    }, [
                        ...[0, 0.5, 1].map((ratio) => {
                            const y = geometry.plot.top + ratio * (geometry.plot.bottom - geometry.plot.top);

                            return h('line', {
                                x1: geometry.plot.left,
                                x2: geometry.plot.right,
                                y1: y,
                                y2: y,
                                stroke: '#e2e8f0',
                                'stroke-width': 1,
                            });
                        }),
                        h('polyline', {
                            points: pointsAttribute(geometry.points),
                            fill: 'none',
                            stroke: '#0f172a',
                            'stroke-width': 3,
                            'stroke-linecap': 'round',
                            'stroke-linejoin': 'round',
                            'vector-effect': 'non-scaling-stroke',
                        }),
                        h('text', {
                            x: geometry.plot.left,
                            y: geometry.height - 8,
                            'font-size': 22,
                            fill: '#64748b',
                        }, props.series.xMode === 'distance' ? 'старт' : 'начало'),
                        h('text', {
                            x: geometry.plot.right,
                            y: geometry.height - 8,
                            'text-anchor': 'end',
                            'font-size': 22,
                            fill: '#64748b',
                        }, props.series.xMode === 'distance' ? 'финиш' : 'конец'),
                    ]),
                ]),
            ]);
        };
    },
};
