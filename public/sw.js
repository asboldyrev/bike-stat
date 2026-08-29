const CACHE_VERSION = 'bike-stat-shell-v1';
const APP_SHELL_CACHE = CACHE_VERSION;
const APP_SHELL_URLS = [
    '/',
    '/manifest.webmanifest',
    '/icons/bike-stat.svg',
    '/icons/bike-stat-maskable.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(APP_SHELL_CACHE);

        await cache.addAll(APP_SHELL_URLS);

        try {
            const response = await fetch('/build/manifest.json', {
                cache: 'no-store',
            });

            if (!response.ok) {
                return;
            }

            const manifest = await response.json();
            const assets = new Set();

            for (const entry of Object.values(manifest)) {
                if (entry?.file) {
                    assets.add('/build/' + entry.file);
                }

                for (const css of entry?.css ?? []) {
                    assets.add('/build/' + css);
                }

                for (const asset of entry?.assets ?? []) {
                    assets.add('/build/' + asset);
                }
            }

            await cache.addAll([...assets]);
        } catch {
            // During local Vite development /build/manifest.json may not exist.
            // The service worker baseline is aimed at production builds.
        }
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();

        await Promise.all(
            keys
                .filter((key) => key.startsWith('bike-stat-shell-') && key !== APP_SHELL_CACHE)
                .map((key) => caches.delete(key)),
        );

        await self.clients.claim();
    })());
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                return await fetch(request);
            } catch {
                const cache = await caches.open(APP_SHELL_CACHE);

                return await cache.match('/') ?? Response.error();
            }
        })());

        return;
    }

    if (
        url.pathname.startsWith('/build/')
        || url.pathname === '/manifest.webmanifest'
        || url.pathname.startsWith('/icons/')
    ) {
        event.respondWith((async () => {
            const cached = await caches.match(request);

            if (cached) {
                return cached;
            }

            const response = await fetch(request);

            if (response.ok) {
                const cache = await caches.open(APP_SHELL_CACHE);
                cache.put(request, response.clone());
            }

            return response;
        })());
    }
});
