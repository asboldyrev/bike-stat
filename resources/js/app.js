import { createApp, h, ref } from 'vue';
import { createPinia } from 'pinia';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import '../css/app.css';
import { ensureDeviceToken } from './auth.js';
import {
    primaryNavigation,
    shouldSkipAutomaticBootstrap,
} from './navigation.js';
import {
    activateWaitingServiceWorker,
    registerPwa,
} from './pwa.js';
import { router } from './router.js';

const startupError = ref('');
const updateRegistration = ref(null);
let reloadAfterControllerChange = false;

function navLink(item, route, mobile = false) {
    const active = route.name === item.name
        || (item.name === 'activities' && route.name === 'activity');

    return h(RouterLink, {
        to: item.path,
        class: mobile
            ? [
                'flex min-h-14 flex-1 items-center justify-center px-2 py-2 text-xs font-medium',
                active ? 'text-slate-950' : 'text-slate-500',
            ]
            : [
                'inline-flex min-h-11 items-center px-1 text-sm',
                active ? 'font-semibold text-slate-950' : 'text-slate-600 hover:text-slate-950',
            ],
    }, () => item.label);
}

function requestApplicationUpdate() {
    const registration = updateRegistration.value;

    if (!registration?.waiting) {
        updateRegistration.value = null;
        return;
    }

    // Hide the prompt immediately. controllerchange may fire more than once in
    // some browser/service-worker lifecycles, so reload permission is consumed
    // by the first matching event only.
    updateRegistration.value = null;
    reloadAfterControllerChange = activateWaitingServiceWorker(registration);
}

const App = {
    setup() {
        const route = useRoute();

        return () => {
            const isPairing = route.name === 'pair';

            return h('div', { class: 'min-h-screen bg-background text-foreground' }, [
                updateRegistration.value
                    ? h('div', {
                        class: 'fixed inset-x-3 top-3 z-[70] mx-auto max-w-md rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96',
                    }, [
                        h('div', { class: 'flex items-center gap-3' }, [
                            h('div', { class: 'min-w-0 flex-1' }, [
                                h('div', { class: 'text-sm font-semibold' }, 'Доступна новая версия'),
                                h('div', { class: 'mt-0.5 text-xs text-slate-600' },
                                    'Обновление будет применено только после нажатия кнопки.'),
                            ]),
                            h('button', {
                                type: 'button',
                                class: 'min-h-11 shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white',
                                onClick: requestApplicationUpdate,
                            }, 'Обновить'),
                        ]),
                    ])
                    : null,
                !isPairing
                    ? h('header', { class: 'hidden border-b bg-white/90 backdrop-blur sm:block' }, [
                        h('div', { class: 'mx-auto flex max-w-5xl items-center justify-between px-4 py-3' }, [
                            h(RouterLink, { to: '/', class: 'text-lg font-semibold tracking-tight' }, () => 'Bike Stat'),
                            h('nav', { class: 'flex items-center gap-5' },
                                primaryNavigation.map((item) => navLink(item, route))),
                        ]),
                    ])
                    : null,
                startupError.value
                    ? h('main', { class: 'mx-auto max-w-5xl px-4 py-8' }, [
                        h('div', { class: 'rounded-xl border border-red-200 bg-red-50 p-5 text-red-800' }, [
                            h('h1', { class: 'font-semibold' }, 'Не удалось запустить Bike Stat'),
                            h('p', { class: 'mt-2 text-sm' }, startupError.value),
                        ]),
                    ])
                    : h('main', {
                        class: isPairing
                            ? 'mx-auto max-w-5xl px-4 py-8'
                            : 'mx-auto max-w-5xl px-4 pb-24 pt-5 sm:py-8',
                    }, [h(RouterView)]),
                !isPairing
                    ? h('nav', {
                        class: 'fixed inset-x-0 bottom-0 z-50 flex border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden',
                        'aria-label': 'Основная навигация',
                    }, primaryNavigation.map((item) => navLink(item, route, true)))
                    : null,
            ]);
        };
    },
};

async function boot() {
    try {
        if (!shouldSkipAutomaticBootstrap(window.location.pathname, window.location.hash)) {
            await ensureDeviceToken();
        }
    } catch (error) {
        startupError.value = error.message ?? 'Не удалось инициализировать приложение.';
    }

    createApp(App).use(createPinia()).use(router).mount('#app');

    if (import.meta.env.PROD) {
        registerPwa({
            onUpdateAvailable(registration) {
                updateRegistration.value = registration;
            },
            onControllerChange() {
                if (!reloadAfterControllerChange) {
                    return;
                }

                reloadAfterControllerChange = false;
                window.location.reload();
            },
        }).catch(() => {
            // PWA registration failure must not make the online application unusable.
        });
    }
}

boot();
