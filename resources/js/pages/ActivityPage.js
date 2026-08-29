import { h, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { apiRequest } from '../api.js';
import { buildMetricSeries } from '../activityVisualization.js';
import { MetricChart } from '../components/activity/MetricChart.js';
import { RouteMap } from '../components/activity/RouteMap.js';

function km(meters) {
    return `${(Number(meters) / 1000).toFixed(2)} км`;
}

function speed(mps) {
    return mps == null ? '—' : `${(Number(mps) * 3.6).toFixed(1)} км/ч`;
}

function duration(seconds) {
    if (seconds == null) return '—';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;

    return hours > 0
        ? `${hours} ч ${String(minutes).padStart(2, '0')} мин`
        : `${minutes} мин ${String(rest).padStart(2, '0')} с`;
}

function dateTime(value) {
    if (!value) return '—';

    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value));
}

function metric(label, value) {
    return h('div', { class: 'min-w-0 rounded-xl border bg-white p-3 sm:p-4' }, [
        h('div', { class: 'text-xs text-slate-500 sm:text-sm' }, label),
        h('div', { class: 'mt-1 break-words text-lg font-semibold sm:text-xl' }, value),
    ]);
}

export const ActivityPage = {
    setup() {
        const route = useRoute();
        const state = ref('loading');
        const activity = ref(null);
        const message = ref('');

        async function load() {
            try {
                const result = await apiRequest(`/api/activities/${route.params.id}`);
                activity.value = result.activity;
                state.value = 'ready';
            } catch (error) {
                state.value = 'error';
                message.value = error.status === 404
                    ? 'Поездка не найдена.'
                    : (error.message ?? 'Не удалось загрузить поездку.');
            }
        }

        onMounted(load);

        return () => {
            if (state.value === 'loading') {
                return h('p', { class: 'text-slate-600' }, 'Загружаем поездку…');
            }

            if (state.value === 'error') {
                return h('div', { class: 'space-y-4' }, [
                    h('div', { class: 'rounded-xl border border-red-200 bg-red-50 p-4 text-red-800' }, message.value),
                    h(RouterLink, { to: '/activities', class: 'inline-flex min-h-11 items-center text-sm font-medium underline' }, () => 'Вернуться к поездкам'),
                ]);
            }

            const item = activity.value;
            const elevationSeries = buildMetricSeries(
                item.track_points,
                'elevation_meters',
            );
            const speedSeries = buildMetricSeries(
                item.track_points,
                'source_speed_mps',
                {
                    multiplier: 3.6,
                    requirePositive: true,
                },
            );

            return h('section', { class: 'space-y-5 sm:space-y-6' }, [
                h('div', [
                    h(RouterLink, {
                        to: '/activities',
                        class: 'inline-flex min-h-11 items-center text-sm text-slate-500 hover:text-slate-950',
                    }, () => '← Все поездки'),
                    h('h1', { class: 'mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl' }, item.name ?? 'Без названия'),
                    h('p', { class: 'mt-2 text-sm text-slate-600 sm:text-base' }, dateTime(item.started_at)),
                ]),
                h('div', { class: 'grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4' }, [
                    metric('Дистанция', km(item.distance_meters)),
                    metric('Время', duration(item.elapsed_time_seconds)),
                    metric('В движении', duration(item.moving_time_seconds)),
                    metric('Средняя скорость', speed(item.average_speed_mps)),
                    metric('Максимальная скорость', speed(item.max_speed_mps)),
                    metric('Набор высоты', `${Math.round(item.elevation_gain_meters)} м`),
                    metric('Сброс высоты', `${Math.round(item.elevation_loss_meters)} м`),
                    metric(
                        'Высоты min–max',
                        item.minimum_elevation_meters == null || item.maximum_elevation_meters == null
                            ? '—'
                            : `${Math.round(item.minimum_elevation_meters)}–${Math.round(item.maximum_elevation_meters)} м`,
                    ),
                    metric(
                        'Перепад высот',
                        item.minimum_elevation_meters == null || item.maximum_elevation_meters == null
                            ? '—'
                            : `${Math.round(item.maximum_elevation_meters - item.minimum_elevation_meters)} м`,
                    ),
                    metric('Точек трека', String(item.track_points.length)),
                ]),
                h(RouteMap, { points: item.track_points }),
                h('div', { class: 'grid gap-4 xl:grid-cols-2' }, [
                    h(MetricChart, {
                        title: 'Профиль высоты',
                        series: elevationSeries,
                        unit: 'м',
                        digits: 0,
                        unavailableMessage: 'В GPX нет данных высоты.',
                    }),
                    h(MetricChart, {
                        title: 'Скорость',
                        series: speedSeries,
                        unit: 'км/ч',
                        digits: 1,
                        unavailableMessage: 'Надёжная скорость по точкам в этом GPX не записана.',
                    }),
                ]),
                h('div', { class: 'rounded-xl border bg-white p-4 sm:p-5' }, [
                    h('h2', { class: 'font-semibold' }, 'Исходный файл'),
                    h('div', { class: 'mt-3 grid gap-2 text-sm sm:grid-cols-2' }, [
                        h('div', { class: 'min-w-0 break-all sm:break-normal' }, [
                            h('span', { class: 'text-slate-500' }, 'Файл: '),
                            item.file?.original_name ?? '—',
                        ]),
                        h('div', [
                            h('span', { class: 'text-slate-500' }, 'Размер: '),
                            item.file ? `${Math.ceil(item.file.size_bytes / 1024)} КБ` : '—',
                        ]),
                    ]),
                ]),
            ]);
        };
    },
};
