import { h, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { apiRequest } from '../api.js';

function km(meters) {
    return `${(Number(meters) / 1000).toFixed(2)} км`;
}

function speed(mps) {
    return mps == null ? '—' : `${(Number(mps) * 3.6).toFixed(1)} км/ч`;
}

function duration(seconds) {
    if (seconds == null) return '—';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return h > 0
        ? `${h} ч ${String(m).padStart(2, '0')} мин`
        : `${m} мин ${String(s).padStart(2, '0')} с`;
}

function dateTime(value) {
    if (!value) return '—';

    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value));
}

function metric(label, value) {
    return h('div', { class: 'rounded-xl border bg-white p-4' }, [
        h('div', { class: 'text-sm text-slate-500' }, label),
        h('div', { class: 'mt-1 text-xl font-semibold' }, value),
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
                    h(RouterLink, { to: '/activities', class: 'text-sm font-medium underline' }, () => 'Вернуться к поездкам'),
                ]);
            }

            const item = activity.value;

            return h('section', { class: 'space-y-6' }, [
                h('div', [
                    h(RouterLink, { to: '/activities', class: 'text-sm text-slate-500 hover:text-slate-950' }, () => '← Все поездки'),
                    h('h1', { class: 'mt-3 text-3xl font-semibold tracking-tight' }, item.name ?? 'Без названия'),
                    h('p', { class: 'mt-2 text-slate-600' }, dateTime(item.started_at)),
                ]),
                h('div', { class: 'grid grid-cols-2 gap-3 lg:grid-cols-4' }, [
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
                h('div', { class: 'rounded-xl border bg-white p-5' }, [
                    h('h2', { class: 'font-semibold' }, 'Исходный файл'),
                    h('div', { class: 'mt-3 grid gap-2 text-sm sm:grid-cols-2' }, [
                        h('div', [h('span', { class: 'text-slate-500' }, 'Файл: '), item.file?.original_name ?? '—']),
                        h('div', [h('span', { class: 'text-slate-500' }, 'Размер: '), item.file ? `${Math.ceil(item.file.size_bytes / 1024)} КБ` : '—']),
                    ]),
                ]),
            ]);
        };
    },
};
