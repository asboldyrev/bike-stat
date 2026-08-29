import assert from 'node:assert/strict';
import test from 'node:test';

import {
    activateWaitingServiceWorker,
    canUseServiceWorker,
    registerPwa,
} from '../../resources/js/pwa.js';

test('service worker support detection is defensive', () => {
    assert.equal(canUseServiceWorker({ serviceWorker: {} }), true);
    assert.equal(canUseServiceWorker({}), false);
});

test('service worker uses a stable URL and bypasses HTTP cache for update checks', async () => {
    const registration = {
        waiting: null,
        addEventListener() {},
    };

    await registerPwa({
        navigatorLike: {
            serviceWorker: {
                controller: {},
                async register(path, options) {
                    assert.equal(path, '/sw.js');
                    assert.equal(options.scope, '/');
                    assert.equal(options.updateViaCache, 'none');

                    return registration;
                },
                addEventListener() {},
            },
        },
    });
});

test('waiting worker is reported only when the page already has a controller', async () => {
    const registration = {
        waiting: { postMessage() {} },
        addEventListener() {},
    };
    let updateRegistration = null;

    await registerPwa({
        navigatorLike: {
            serviceWorker: {
                controller: {},
                async register() {
                    return registration;
                },
                addEventListener() {},
            },
        },
        onUpdateAvailable(value) {
            updateRegistration = value;
        },
    });

    assert.equal(updateRegistration, registration);
});

test('waiting worker is not reported during uncontrolled first install', async () => {
    const registration = {
        waiting: { postMessage() {} },
        addEventListener() {},
    };
    let updateReported = false;

    await registerPwa({
        navigatorLike: {
            serviceWorker: {
                controller: null,
                async register() {
                    return registration;
                },
                addEventListener() {},
            },
        },
        onUpdateAvailable() {
            updateReported = true;
        },
    });

    assert.equal(updateReported, false);
});

test('waiting service worker can be activated explicitly once', () => {
    let message = null;

    const activated = activateWaitingServiceWorker({
        waiting: {
            postMessage(value) {
                message = value;
            },
        },
    });

    assert.equal(activated, true);
    assert.deepEqual(message, { type: 'SKIP_WAITING' });
    assert.equal(activateWaitingServiceWorker({ waiting: null }), false);
});
