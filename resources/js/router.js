import { h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { ImportPage } from './pages/ImportPage.js';
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

const components = {
    dashboard: page('Bike Stat', 'Персональная статистика велопоездок.'),
    activities: page('Поездки', 'Здесь появится история импортированных поездок.'),
    import: ImportPage,
};

export const routes = routeDefinitions.map((route) => ({
    ...route,
    component: components[route.name],
}));

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
