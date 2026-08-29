export const primaryNavigation = [
    { name: 'dashboard', label: 'Обзор', path: '/' },
    { name: 'activities', label: 'Поездки', path: '/activities' },
    { name: 'import', label: 'Импорт', path: '/import' },
    { name: 'settings', label: 'Настройки', path: '/settings' },
];

export function shouldSkipAutomaticBootstrap(pathname) {
    return pathname === '/pair';
}
