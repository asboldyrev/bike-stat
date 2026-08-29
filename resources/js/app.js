import { createApp, h, ref } from 'vue';
import { createPinia } from 'pinia';
import { RouterLink, RouterView } from 'vue-router';
import '../css/app.css';
import { ensureDeviceToken } from './auth.js';
import { router } from './router.js';

const startupError = ref('');

const App = {
    setup() {
        return () =>
            h('div', { class: 'min-h-screen bg-background text-foreground' }, [
                h('header', { class: 'border-b bg-white/90 backdrop-blur' }, [
                    h('div', { class: 'mx-auto flex max-w-5xl items-center justify-between px-4 py-4' }, [
                        h(RouterLink, { to: '/', class: 'text-lg font-semibold tracking-tight' }, () => 'Bike Stat'),
                        h('nav', { class: 'flex items-center gap-4 text-sm text-slate-600' }, [
                            h(RouterLink, { to: '/', class: 'hover:text-slate-950' }, () => 'Обзор'),
                            h(RouterLink, { to: '/activities', class: 'hover:text-slate-950' }, () => 'Поездки'),
                            h(RouterLink, { to: '/import', class: 'hover:text-slate-950' }, () => 'Импорт'),
                        ]),
                    ]),
                ]),
                startupError.value
                    ? h('main', { class: 'mx-auto max-w-5xl px-4 py-8' }, [
                        h('div', { class: 'rounded-xl border border-red-200 bg-red-50 p-5 text-red-800' }, [
                            h('h1', { class: 'font-semibold' }, 'Не удалось запустить Bike Stat'),
                            h('p', { class: 'mt-2 text-sm' }, startupError.value),
                        ]),
                    ])
                    : h('main', { class: 'mx-auto max-w-5xl px-4 py-8' }, [h(RouterView)]),
            ]);
    },
};

async function boot() {
    try {
        await ensureDeviceToken();
    } catch (error) {
        startupError.value = error.message ?? 'Не удалось инициализировать приложение.';
    }

    createApp(App).use(createPinia()).use(router).mount('#app');
}

boot();
