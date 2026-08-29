import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const page = (title, description) => ({
    setup() {
        return () =>
            h('section', { class: 'space-y-3' }, [
                h('h1', { class: 'text-3xl font-semibold tracking-tight' }, title),
                h('p', { class: 'max-w-2xl text-slate-600' }, description),
            ]);
    },
});

export const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: page('Bike Stat', 'Персональная статистика велопоездок.'),
    },
    {
        path: '/activities',
        name: 'activities',
        component: page('Поездки', 'Здесь появится история импортированных поездок.'),
    },
    {
        path: '/import',
        name: 'import',
        component: page('Импорт GPX', 'Ручной импорт и Share Target будут использовать один поток.'),
    },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
