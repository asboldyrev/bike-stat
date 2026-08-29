import assert from 'node:assert/strict';
import test from 'node:test';

import { apiRequest, ApiError, importGpx } from '../../resources/js/api.js';
import { DEVICE_TOKEN_KEY } from '../../resources/js/auth.js';

function storageWithToken(token = 'device-token') {
    return {
        getItem(key) {
            return key === DEVICE_TOKEN_KEY ? token : null;
        },
    };
}

test('apiRequest adds bearer token', async () => {
    const payload = await apiRequest('/api/example', { method: 'POST' }, {
        storage: storageWithToken(),
        fetchImpl: async (path, options) => {
            assert.equal(path, '/api/example');
            assert.equal(options.headers.get('Authorization'), 'Bearer device-token');

            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        },
    });

    assert.deepEqual(payload, { ok: true });
});

test('apiRequest preserves JSON error details', async () => {
    await assert.rejects(
        apiRequest('/api/example', {}, {
            storage: storageWithToken(),
            fetchImpl: async () => new Response(JSON.stringify({
                message: 'Duplicate',
                activity_id: 42,
            }), {
                status: 409,
                headers: { 'content-type': 'application/json' },
            }),
        }),
        (error) => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.status, 409);
            assert.equal(error.payload.activity_id, 42);
            return true;
        },
    );
});

test('importGpx posts multipart data to activity import endpoint', async () => {
    const file = new File(['<gpx/>'], 'ride.gpx', { type: 'application/gpx+xml' });

    const payload = await importGpx(file, {
        storage: storageWithToken(),
        fetchImpl: async (path, options) => {
            assert.equal(path, '/api/activities/import');
            assert.equal(options.method, 'POST');
            assert.ok(options.body instanceof FormData);
            assert.equal(options.body.get('file').name, 'ride.gpx');

            return new Response(JSON.stringify({ activity: { id: 1 } }), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        },
    });

    assert.equal(payload.activity.id, 1);
});
