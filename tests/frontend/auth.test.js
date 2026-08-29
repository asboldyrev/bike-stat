import assert from 'node:assert/strict';
import test from 'node:test';

import { DEVICE_TOKEN_KEY, ensureDeviceToken } from '../../resources/js/auth.js';

function storage() {
    const values = new Map();

    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, value);
        },
    };
}

test('existing device token is reused without bootstrap', async () => {
    const localStorage = storage();
    localStorage.setItem(DEVICE_TOKEN_KEY, 'existing-token');

    let called = false;

    const token = await ensureDeviceToken({
        storage: localStorage,
        deviceName: 'Test',
        fetchImpl: async () => {
            called = true;
            throw new Error('should not bootstrap');
        },
    });

    assert.equal(token, 'existing-token');
    assert.equal(called, false);
});

test('missing device token is bootstrapped and stored', async () => {
    const localStorage = storage();

    const token = await ensureDeviceToken({
        storage: localStorage,
        deviceName: 'Test device',
        fetchImpl: async (path, options) => {
            assert.equal(path, '/api/bootstrap');
            assert.equal(options.method, 'POST');

            return {
                ok: true,
                async json() {
                    return { token: 'new-token' };
                },
            };
        },
    });

    assert.equal(token, 'new-token');
    assert.equal(localStorage.getItem(DEVICE_TOKEN_KEY), 'new-token');
});
