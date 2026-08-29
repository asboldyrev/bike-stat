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
        const meta = ref({
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 0,
        });

        async function load(page = 1, { scroll = false } = {}) {
            state.value = 'loading';
            message.value = '';

            try {
                const result = await apiRequest(`/api/activities?page=${page}`);

                activities.value = result.data;
                meta.value = result.meta;
                state.value = 'ready';

                if (scroll) {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                    });
                }
            } catch (error) {
                state.value = 'error';
                message.value = error.status === 401
                    ? 'Не удалось подтвердить это устройство.'
                    : (error.message ?? 'Не удалось загрузить поездки.');
            }
        }

        function goToPage(page) {
            if (
                state.value === 'loading'
                || page < 1
                || page > meta.value.last_page
                || page === meta.value.current_page
            ) {
                return;
            }

            load(page, { scroll: true });
        }

        onMounted(() => load());

        return () => h('section', { class: 'space-y-5 sm:space-y-6' }, [
            h('div', { class: 'flex items-start justify-between gap-3 sm:items-center sm:gap-4' }, [
                h('div', { class: 'min-w-0' }, [
                    h('h1', { class: 'text-2xl font-semibold tracking-tight sm:text-3xl' }, 'Поездки'),
                    h('p', { class: 'mt-1 text-sm text-slate-600 sm:mt-2 sm:text-base' },
                        meta.value.total > 0
                            ? `Всего поездок: ${meta.value.total}`
                            : 'История импортированных GPX-поездок.'),
                ]),
                h(RouterLink, {
                    to: '/import',
                    class: 'inline-flex min-h-11 shrink-0 items-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white sm:px-4',
                }, () => 'Импорт'),
            ]),
            state.value === 'loading'
                ? h('p', { class: 'text-slate-600' }, 'Загружаем поездки…')
                : null,
            state.value === 'error'
                ? h('div', { class: 'rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800' }, message.value)
                : null,
            state.value === 'ready' && activities.value.length === 0
                ? h('div', { class: 'rounded-xl border bg-white p-5 text-slate-600 sm:p-6' }, 'Пока нет импортированных поездок.')
                : null,
            state.value === 'ready' && activities.value.length > 0
                ? h('div', { class: 'space-y-3' }, activities.value.map((activity) =>
                    h(RouterLink, {
                        to: `/activities/${activity.id}`,
                        class: 'block rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-400 sm:p-5',
                    }, () => [
                        h('div', { class: 'flex flex-wrap items-start justify-between gap-3' }, [
                            h('div', { class: 'min-w-0' }, [
                                h('div', { class: 'break-words font-semibold' }, activity.name ?? 'Без названия'),
                                h('div', { class: 'mt-1 text-xs text-slate-500 sm:text-sm' }, formatDate(activity.started_at)),
                            ]),
                            h('div', { class: 'shrink-0 text-lg font-semibold' }, formatDistance(activity.distance_meters)),
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
            state.value === 'ready' && meta.value.last_page > 1
                ? h('nav', {
                    class: 'sticky bottom-0 z-30 -mx-4 border-t bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border sm:px-4',
                    'aria-label': 'Пагинация поездок',
                }, [
                    h('div', { class: 'mx-auto flex max-w-xl items-center justify-between gap-3' }, [
                        h('button', {
                            type: 'button',
                            class: 'min-h-11 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40',
                            disabled: meta.value.current_page <= 1 || state.value === 'loading',
                            onClick: () => goToPage(meta.value.current_page - 1),
                        }, '← Назад'),
                        h('div', { class: 'min-w-0 text-center' }, [
                            h('div', { class: 'text-sm font-medium' },
                                `Страница ${meta.value.current_page} из ${meta.value.last_page}`),
                            h('div', { class: 'mt-0.5 text-xs text-slate-500' },
                                `${meta.value.total} поездок`),
                        ]),
                        h('button', {
                            type: 'button',
                            class: 'min-h-11 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40',
                            disabled: meta.value.current_page >= meta.value.last_page || state.value === 'loading',
                            onClick: () => goToPage(meta.value.current_page + 1),
                        }, 'Вперёд →'),
                    ]),
                ])
                : null,
        ]);
    },
};
