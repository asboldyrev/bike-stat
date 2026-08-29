import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routeDefinitions } from './routes.js';

const page = (title, description) => ({
    setup() {
        return () =>
            h('section', { class: 'space-y-3' }, [
                h('h1', { class: 'text-3xl font-semibold tracking-tight' }, title),
                h('p', { class: 'max-w-2xl text-slate-600' }, description),
            ]);
    },
});

const pageContent = {
    dashboard: ['Bike Stat', 'Персональная статистика велопоездок.'],
    activities: ['Поездки', 'Здесь появится история импортированных поездок.'],
    import: ['Импорт GPX', 'Ручной импорт и Share Target будут использовать один поток.'],
};

export const routes = routeDefinitions.map((route) => ({
    ...route,
    component: page(...pageContent[route.name]),
}));

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
