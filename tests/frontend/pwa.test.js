import assert from 'node:assert/strict';
import test from 'node:test';

import {
    activateWaitingServiceWorker,
    canUseServiceWorker,
    registerPwa,
    serviceWorkerUrl,
} from '../../resources/js/pwa.js';

test('service worker support detection is defensive', () => {
    assert.equal(canUseServiceWorker({ serviceWorker: {} }), true);
    assert.equal(canUseServiceWorker({}), false);
});

test('service worker URL is versioned by the application build', () => {
    assert.equal(
        serviceWorkerUrl('/build/assets/app-abc123.js'),
        '/sw.js?v=%2Fbuild%2Fassets%2Fapp-abc123.js',
    );
});

test('existing waiting worker is reported as an available update', async () => {
    const registration = {
        waiting: { postMessage() {} },
        addEventListener() {},
    };
    let updateRegistration = null;

    await registerPwa({
        navigatorLike: {
            serviceWorker: {
                controller: {},
                async register(path, options) {
                    assert.equal(
                        path,
                        '/sw.js?v=%2Fbuild%2Fassets%2Fapp-test.js',
                    );
                    assert.equal(options.scope, '/');
                    return registration;
                },
                addEventListener() {},
            },
        },
        buildVersion: '/build/assets/app-test.js',
        onUpdateAvailable(value) {
            updateRegistration = value;
        },
    });

    assert.equal(updateRegistration, registration);
});

test('waiting service worker can be activated explicitly', () => {
    let message = null;

    activateWaitingServiceWorker({
        waiting: {
            postMessage(value) {
                message = value;
            },
        },
    });

    assert.deepEqual(message, { type: 'SKIP_WAITING' });
});
