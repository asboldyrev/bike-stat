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

test('existing waiting worker is reported as an available update', async () => {
    const events = new Map();
    const registration = {
        waiting: { postMessage() {} },
        addEventListener(name, callback) {
            events.set(name, callback);
        },
    };
    let updateRegistration = null;

    await registerPwa({
        navigatorLike: {
            serviceWorker: {
                controller: {},
                async register(path, options) {
                    assert.equal(path, '/sw.js');
                    assert.equal(options.scope, '/');
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
