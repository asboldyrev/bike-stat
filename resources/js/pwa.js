export function canUseServiceWorker(navigatorLike = navigator) {
    return 'serviceWorker' in navigatorLike;
}

export async function registerPwa({
    navigatorLike = navigator,
    onUpdateAvailable = () => {},
    onControllerChange = () => {},
} = {}) {
    if (!canUseServiceWorker(navigatorLike)) {
        return null;
    }

    const registration = await navigatorLike.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
    });

    if (navigatorLike.serviceWorker.controller && registration.waiting) {
        onUpdateAvailable(registration);
    }

    registration.addEventListener('updatefound', () => {
        const worker = registration.installing;

        if (!worker) {
            return;
        }

        worker.addEventListener('statechange', () => {
            if (
                worker.state === 'installed'
                && navigatorLike.serviceWorker.controller
                && registration.waiting
            ) {
                onUpdateAvailable(registration);
            }
        });
    });

    navigatorLike.serviceWorker.addEventListener('controllerchange', () => {
        onControllerChange();
    });

    return registration;
}

export function activateWaitingServiceWorker(registration) {
    const worker = registration?.waiting;

    if (!worker) {
        return false;
    }

    worker.postMessage({
        type: 'SKIP_WAITING',
    });

    return true;
}
