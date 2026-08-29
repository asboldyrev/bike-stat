import { h, ref } from 'vue';
import { apiRequest } from '../api.js';

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}

export const SettingsPage = {
    setup() {
        const state = ref('idle');
        const pairing = ref(null);
        const message = ref('');

        async function createPairing() {
            if (state.value === 'loading') {
                return;
            }

            state.value = 'loading';
            message.value = '';

            try {
                pairing.value = await apiRequest('/api/pairings', {
                    method: 'POST',
                });
                state.value = 'ready';
            } catch (error) {
                state.value = 'error';
                message.value = error.status === 401
                    ? 'Не удалось подтвердить это устройство.'
                    : (error.message ?? 'Не удалось создать ссылку подключения.');
            }
        }

        async function copyPairing() {
            if (!pairing.value?.url) {
                return;
            }

            try {
                await copyText(pairing.value.url);
                message.value = 'Ссылка скопирована.';
            } catch {
                message.value = 'Не удалось скопировать ссылку.';
            }
        }

        return () => h('section', { class: 'space-y-5 sm:space-y-6' }, [
            h('div', [
                h('h1', { class: 'text-2xl font-semibold tracking-tight sm:text-3xl' }, 'Настройки'),
                h('p', { class: 'mt-2 max-w-2xl text-sm text-slate-600 sm:text-base' },
                    'Подключение устройств и настройки локального доступа к вашим поездкам.'),
            ]),
            h('section', { class: 'rounded-xl border bg-white p-4 sm:p-5' }, [
                h('h2', { class: 'font-semibold' }, 'Подключить другое устройство'),
                h('p', { class: 'mt-2 text-sm text-slate-600' },
                    'Создайте одноразовую ссылку и откройте её на другом телефоне или компьютере. Ссылка действует 2 минуты.'),
                h('button', {
                    type: 'button',
                    disabled: state.value === 'loading',
                    class: 'mt-4 min-h-12 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 sm:w-auto',
                    onClick: createPairing,
                }, state.value === 'loading' ? 'Создаём ссылку…' : 'Создать ссылку'),
                pairing.value
                    ? h('div', { class: 'mt-4 space-y-3 rounded-lg bg-slate-50 p-3' }, [
                        h('div', { class: 'break-all text-xs text-slate-700' }, pairing.value.url),
                        h('button', {
                            type: 'button',
                            class: 'min-h-11 rounded-lg border bg-white px-4 py-2 text-sm font-medium',
                            onClick: copyPairing,
                        }, 'Скопировать ссылку'),
                        h('p', { class: 'text-xs text-slate-500' },
                            `Истекает: ${new Intl.DateTimeFormat('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }).format(new Date(pairing.value.expires_at))}`),
                    ])
                    : null,
                message.value
                    ? h('p', {
                        class: state.value === 'error'
                            ? 'mt-3 text-sm text-red-700'
                            : 'mt-3 text-sm text-slate-600',
                    }, message.value)
                    : null,
            ]),
            h('section', { class: 'rounded-xl border bg-white p-4 sm:p-5' }, [
                h('h2', { class: 'font-semibold' }, 'Как это работает'),
                h('ol', { class: 'mt-3 space-y-2 pl-5 text-sm text-slate-600 list-decimal' }, [
                    h('li', 'Создайте ссылку на уже авторизованном устройстве.'),
                    h('li', 'Откройте её на новом устройстве в течение 2 минут.'),
                    h('li', 'Новое устройство получит собственный независимый токен того же аккаунта.'),
                ]),
            ]),
        ]);
    },
};
