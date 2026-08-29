import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import { RouterLink, RouterView } from 'vue-router';
import '../css/app.css';
import { router } from './router.js';

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
                h('main', { class: 'mx-auto max-w-5xl px-4 py-8' }, [h(RouterView)]),
            ]);
    },
};

createApp(App).use(createPinia()).use(router).mount('#app');
