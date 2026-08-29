import { h, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { setDeviceToken } from '../auth.js';

function tokenFromHash(hash = window.location.hash) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return params.get('token');
}

export const PairPage = {
    setup() {
        const router = useRouter();
        const state = ref('loading');
        const message = ref('Подключаем устройство…');

        onMounted(async () => {
            const token = tokenFromHash();

            if (!token) {
                state.value = 'error';
                message.value = 'В ссылке отсутствует pairing token.';
                return;
            }

            try {
                const response = await fetch('/api/pairings/redeem', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        token,
                        device_name: navigator.userAgent.slice(0, 100),
                    }),
                });

                const payload = await response.json();

                if (!response.ok || !payload.token) {
                    throw new Error(payload.message ?? 'Не удалось подключить устройство.');
                }

                setDeviceToken(payload.token);
                history.replaceState(null, '', '/pair');

                state.value = 'success';
                message.value = 'Устройство подключено.';

                setTimeout(() => {
                    router.replace({ name: 'activities' });
                }, 600);
            } catch (error) {
                state.value = 'error';
                message.value = error.message ?? 'Не удалось подключить устройство.';
            }
        });

        return () => h('section', { class: 'mx-auto max-w-lg space-y-4' }, [
            h('div', {
                class: state.value === 'error'
                    ? 'rounded-xl border border-red-200 bg-red-50 p-5'
                    : 'rounded-xl border bg-white p-5',
            }, [
                h('h1', { class: 'text-xl font-semibold' },
                    state.value === 'success' ? 'Готово' : 'Подключение устройства'),
                h('p', {
                    class: state.value === 'error'
                        ? 'mt-2 text-sm text-red-700'
                        : 'mt-2 text-sm text-slate-600',
                }, message.value),
            ]),
            state.value === 'error'
                ? h(RouterLink, {
                    to: { name: 'settings' },
                    class: 'inline-flex min-h-11 items-center text-sm font-medium underline',
                }, () => 'Перейти в настройки')
                : null,
        ]);
    },
};

export { tokenFromHash };
