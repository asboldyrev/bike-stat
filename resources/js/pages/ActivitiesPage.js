import { h, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { apiRequest } from '../api.js';

function formatDistance(meters) {
    return `${(Number(meters) / 1000).toFixed(2)} км`;
}

function formatSpeed(mps) {
    return mps == null ? '—' : `${(Number(mps) * 3.6).toFixed(1)} км/ч`;
}

function formatDuration(seconds) {
    if (seconds == null) {
        return '—';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
}

function formatDate(value) {
    if (!value) {
        return 'Дата неизвестна';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export const ActivitiesPage = {
    setup() {
        const state = ref('loading');
        const activities = ref([]);
        const message = ref('');

        async function load() {
            state.value = 'loading';
            message.value = '';

            try {
                const result = await apiRequest('/api/activities');
                activities.value = result.data;
                state.value = 'ready';
            } catch (error) {
                state.value = 'error';
                message.value = error.status === 401
                    ? 'Не удалось подтвердить это устройство.'
                    : (error.message ?? 'Не удалось загрузить поездки.');
            }
        }

        onMounted(load);

        return () => h('section', { class: 'space-y-6' }, [
            h('div', { class: 'flex items-center justify-between gap-4' }, [
                h('div', [
                    h('h1', { class: 'text-3xl font-semibold tracking-tight' }, 'Поездки'),
                    h('p', { class: 'mt-2 text-slate-600' }, 'История импортированных GPX-поездок.'),
                ]),
                h(RouterLink, {
                    to: '/import',
                    class: 'rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white',
                }, () => 'Импортировать'),
            ]),
            state.value === 'loading'
                ? h('p', { class: 'text-slate-600' }, 'Загружаем поездки…')
                : null,
            state.value === 'error'
                ? h('div', { class: 'rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800' }, message.value)
                : null,
            state.value === 'ready' && activities.value.length === 0
                ? h('div', { class: 'rounded-xl border bg-white p-6 text-slate-600' }, 'Пока нет импортированных поездок.')
                : null,
            state.value === 'ready' && activities.value.length > 0
                ? h('div', { class: 'space-y-3' }, activities.value.map((activity) =>
                    h(RouterLink, {
                        to: `/activities/${activity.id}`,
                        class: 'block rounded-xl border bg-white p-5 shadow-sm transition hover:border-slate-400',
                    }, () => [
                        h('div', { class: 'flex flex-wrap items-start justify-between gap-3' }, [
                            h('div', [
                                h('div', { class: 'font-semibold' }, activity.name ?? 'Без названия'),
                                h('div', { class: 'mt-1 text-sm text-slate-500' }, formatDate(activity.started_at)),
                            ]),
                            h('div', { class: 'text-lg font-semibold' }, formatDistance(activity.distance_meters)),
                        ]),
                        h('div', { class: 'mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4' }, [
                            h('div', [h('div', { class: 'text-slate-500' }, 'В движении'), h('div', { class: 'font-medium' }, formatDuration(activity.moving_time_seconds))]),
                            h('div', [h('div', { class: 'text-slate-500' }, 'Средняя'), h('div', { class: 'font-medium' }, formatSpeed(activity.average_speed_mps))]),
                            h('div', [h('div', { class: 'text-slate-500' }, 'Максимум'), h('div', { class: 'font-medium' }, formatSpeed(activity.max_speed_mps))]),
                            h('div', [h('div', { class: 'text-slate-500' }, 'Набор'), h('div', { class: 'font-medium' }, `${Math.round(activity.elevation_gain_meters)} м`)]),
                        ]),
                    ])
                ))
                : null,
        ]);
    },
};
