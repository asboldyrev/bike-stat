import { h, ref } from 'vue';
import { importGpx } from '../api.js';
import {
    importGpxBatch,
    prepareImportEntries,
    summarizeImportEntries,
} from '../bulkImport.js';

function formatDistance(meters) {
    return `${(Number(meters) / 1000).toFixed(2)} км`;
}

function formatSize(bytes) {
    if (bytes < 1024 * 1024) {
        return `${Math.ceil(bytes / 1024)} КБ`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} МиБ`;
}

function statusLabel(status) {
    return {
        pending: 'Ожидает',
        importing: 'Импортируем…',
        success: 'Готово',
        duplicate: 'Уже есть',
        invalid: 'Пропущен',
        error: 'Ошибка',
    }[status] ?? status;
}

function statusClass(status) {
    if (status === 'success') return 'bg-emerald-50 text-emerald-700';
    if (status === 'duplicate') return 'bg-amber-50 text-amber-700';
    if (status === 'invalid' || status === 'error') return 'bg-red-50 text-red-700';
    if (status === 'importing') return 'bg-blue-50 text-blue-700';

    return 'bg-slate-100 text-slate-600';
}

export const ImportPage = {
    setup() {
        const entries = ref([]);
        const state = ref('idle');
        const revision = ref(0);

        function chooseFiles(fileList) {
            entries.value = prepareImportEntries(fileList);
            state.value = entries.value.length > 0 ? 'ready' : 'idle';
            revision.value++;
        }

        function clear() {
            entries.value = [];
            state.value = 'idle';
            revision.value++;
        }

        async function submit() {
            if (state.value === 'loading') {
                return;
            }

            const pending = entries.value.filter((entry) => entry.status === 'pending');

            if (pending.length === 0) {
                return;
            }

            state.value = 'loading';

            await importGpxBatch(entries.value, importGpx, () => {
                revision.value++;
            });

            state.value = 'done';
            revision.value++;
        }

        return () => {
            // Accessed intentionally so status mutations performed inside the batch
            // trigger a re-render even though entry objects themselves stay stable.
            void revision.value;

            const summary = summarizeImportEntries(entries.value);
            const validCount = entries.value.filter((entry) => entry.status === 'pending').length;
            const processedCount = summary.success + summary.duplicate + summary.error + summary.invalid;

            return h('section', {
                class: entries.value.length > 0
                    ? 'space-y-5 pb-44 sm:space-y-6 sm:pb-24'
                    : 'space-y-5 sm:space-y-6',
            }, [
                h('div', { class: 'space-y-2' }, [
                    h('h1', { class: 'text-2xl font-semibold tracking-tight sm:text-3xl' }, 'Импорт GPX'),
                    h('p', { class: 'max-w-2xl text-sm text-slate-600 sm:text-base' },
                        'Выберите один или несколько GPX-файлов. Каждый файл импортируется независимо, поэтому дубликат или ошибка не остановят остальные.'),
                ]),
                h('div', { class: 'space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:max-w-2xl sm:p-5' }, [
                    h('label', {
                        class: 'flex min-h-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-400 px-4 py-3 text-center text-sm font-medium hover:bg-slate-50',
                    }, [
                        state.value === 'loading' ? 'Импорт выполняется…' : 'Выбрать GPX-файлы',
                        h('input', {
                            type: 'file',
                            multiple: true,
                            accept: '.gpx,application/gpx+xml,application/xml,text/xml',
                            disabled: state.value === 'loading',
                            class: 'sr-only',
                            onChange: (event) => {
                                chooseFiles(event.target.files ?? []);
                                event.target.value = '';
                            },
                        }),
                    ]),
                    entries.value.length > 0
                        ? h('div', { class: 'flex flex-wrap items-center justify-between gap-3 text-sm' }, [
                            h('div', { class: 'text-slate-600' }, [
                                `Выбрано: ${entries.value.length}`,
                                state.value === 'loading' || state.value === 'done'
                                    ? ` · обработано: ${processedCount}/${entries.value.length}`
                                    : '',
                            ]),
                            h('button', {
                                type: 'button',
                                disabled: state.value === 'loading',
                                class: 'min-h-11 px-2 text-sm font-medium text-slate-600 underline disabled:opacity-50',
                                onClick: clear,
                            }, 'Очистить'),
                        ])
                        : null,
                    entries.value.length > 0
                        ? h('div', { class: 'space-y-2' }, entries.value.map((entry) =>
                            h('div', {
                                key: entry.id,
                                class: 'rounded-lg border p-3',
                            }, [
                                h('div', { class: 'flex min-w-0 items-start justify-between gap-3' }, [
                                    h('div', { class: 'min-w-0' }, [
                                        h('div', { class: 'break-all text-sm font-medium sm:break-normal' }, entry.file.name),
                                        h('div', { class: 'mt-1 text-xs text-slate-500' }, formatSize(entry.file.size)),
                                    ]),
                                    h('span', {
                                        class: `shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusClass(entry.status)}`,
                                    }, statusLabel(entry.status)),
                                ]),
                                entry.message
                                    ? h('p', {
                                        class: 'mt-2 text-xs text-slate-600',
                                    }, entry.message)
                                    : null,
                                entry.activity?.id
                                    ? h('a', {
                                        href: `/activities/${entry.activity.id}`,
                                        class: 'mt-2 inline-flex min-h-11 items-center text-sm font-medium underline',
                                    }, entry.status === 'duplicate' ? 'Открыть существующую' : 'Открыть поездку')
                                    : null,
                                entry.activity?.distance_meters != null
                                    ? h('div', { class: 'text-xs text-slate-500' },
                                        formatDistance(entry.activity.distance_meters))
                                    : null,
                            ])
                        ))
                        : h('p', { class: 'text-sm text-slate-500' },
                            'Можно выбрать сразу всю историю поездок. Максимальный размер каждого файла — 10 МиБ.'),
                    state.value === 'done'
                        ? h('div', { class: 'rounded-lg bg-slate-50 p-3 text-sm' }, [
                            h('div', { class: 'font-medium' }, 'Импорт завершён'),
                            h('div', { class: 'mt-1 text-slate-600' },
                                `Новых: ${summary.success} · дубликатов: ${summary.duplicate} · ошибок/пропущено: ${summary.error + summary.invalid}`),
                        ])
                        : null,
                ]),
                entries.value.length > 0
                    ? h('div', {
                        class: 'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t bg-white/95 px-3 pb-3 pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-0 sm:px-4',
                    }, [
                        h('div', {
                            class: 'mx-auto flex max-w-5xl items-center gap-3',
                        }, [
                            h('div', { class: 'min-w-0 flex-1' }, [
                                h('div', { class: 'truncate text-sm font-medium text-slate-900' },
                                    state.value === 'loading'
                                        ? `Обработано ${processedCount} из ${entries.value.length}`
                                        : validCount > 0
                                            ? `К импорту: ${validCount}`
                                            : 'Все выбранные файлы обработаны'),
                                h('div', { class: 'mt-0.5 truncate text-xs text-slate-500' },
                                    state.value === 'done'
                                        ? `Новых: ${summary.success} · дубликатов: ${summary.duplicate} · ошибок: ${summary.error + summary.invalid}`
                                        : `Выбрано файлов: ${entries.value.length}`),
                            ]),
                            h('button', {
                                type: 'button',
                                class: 'min-h-12 shrink-0 rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-5',
                                disabled: state.value === 'loading' || validCount === 0,
                                onClick: submit,
                            }, state.value === 'loading'
                                ? 'Импортируем…'
                                : validCount > 1
                                    ? `Импортировать ${validCount}`
                                    : validCount === 1
                                        ? 'Импортировать'
                                        : 'Готово'),
                        ]),
                    ])
                    : null,
            ]);
        };
    },
};
