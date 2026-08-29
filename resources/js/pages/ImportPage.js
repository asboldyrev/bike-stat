import { h, ref } from 'vue';
import { importGpx } from '../api.js';

function formatDistance(meters) {
    return `${(Number(meters) / 1000).toFixed(2)} км`;
}

export const ImportPage = {
    setup() {
        const selectedFile = ref(null);
        const state = ref('idle');
        const message = ref('');
        const activity = ref(null);

        async function submit() {
            if (!selectedFile.value || state.value === 'loading') {
                return;
            }

            state.value = 'loading';
            message.value = '';
            activity.value = null;

            try {
                const result = await importGpx(selectedFile.value);

                activity.value = result.activity;
                state.value = 'success';
                message.value = 'Поездка успешно импортирована.';
            } catch (error) {
                state.value = 'error';

                if (error.status === 409 && error.payload?.activity_id) {
                    message.value = `Эта поездка уже импортирована (ID ${error.payload.activity_id}).`;
                } else if (error.status === 401) {
                    message.value = 'Не удалось подтвердить это устройство. Проверьте доступ в настройках.';
                } else {
                    message.value = error.message ?? 'Не удалось импортировать GPX.';
                }
            }
        }

        return () => h('section', { class: 'space-y-6' }, [
            h('div', { class: 'space-y-2' }, [
                h('h1', { class: 'text-3xl font-semibold tracking-tight' }, 'Импорт GPX'),
                h('p', { class: 'max-w-2xl text-slate-600' },
                    'Выберите GPX-файл. Позже этот же поток будет использоваться при «Поделиться → Bike Stat».'),
            ]),
            h('div', { class: 'max-w-xl space-y-4 rounded-xl border bg-white p-5 shadow-sm' }, [
                h('input', {
                    type: 'file',
                    accept: '.gpx,application/gpx+xml,application/xml,text/xml',
                    disabled: state.value === 'loading',
                    onChange: (event) => {
                        const file = event.target.files?.[0] ?? null;

                        if (file && file.size > 10 * 1024 * 1024) {
                            selectedFile.value = null;
                            state.value = 'error';
                            message.value = 'GPX-файл не должен быть больше 10 МиБ.';
                            activity.value = null;
                            event.target.value = '';
                            return;
                        }

                        selectedFile.value = file;
                        state.value = 'idle';
                        message.value = '';
                        activity.value = null;
                    },
                }),
                selectedFile.value
                    ? h('p', { class: 'text-sm text-slate-600' },
                        `${selectedFile.value.name} · ${Math.ceil(selectedFile.value.size / 1024)} КБ`)
                    : null,
                h('button', {
                    type: 'button',
                    class: 'rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50',
                    disabled: !selectedFile.value || state.value === 'loading',
                    onClick: submit,
                }, state.value === 'loading' ? 'Импортируем…' : 'Импортировать'),
                message.value
                    ? h('p', {
                        class: state.value === 'error'
                            ? 'text-sm text-red-700'
                            : 'text-sm text-emerald-700',
                    }, message.value)
                    : null,
                activity.value
                    ? h('div', { class: 'grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm' }, [
                        h('div', [
                            h('div', { class: 'text-slate-500' }, 'Название'),
                            h('div', { class: 'font-medium' }, activity.value.name ?? 'Без названия'),
                        ]),
                        h('div', [
                            h('div', { class: 'text-slate-500' }, 'Дистанция'),
                            h('div', { class: 'font-medium' }, formatDistance(activity.value.distance_meters)),
                        ]),
                    ])
                    : null,
            ]),
        ]);
    },
};
