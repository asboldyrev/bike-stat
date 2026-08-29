import { getDeviceToken } from './auth.js';

export class ApiError extends Error {
    constructor(message, status, payload = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

export async function apiRequest(path, options = {}, {
    storage = window.localStorage,
    fetchImpl = window.fetch.bind(window),
} = {}) {
    const token = getDeviceToken(storage);

    if (!token) {
        throw new ApiError('Device token is missing.', 401);
    }

    const headers = new Headers(options.headers ?? {});
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetchImpl(path, {
        ...options,
        headers,
    });

    let payload = null;

    if (response.status !== 204) {
        const contentType = response.headers.get('content-type') ?? '';

        payload = contentType.includes('application/json')
            ? await response.json()
            : null;
    }

    if (!response.ok) {
        throw new ApiError(
            payload?.message ?? 'API request failed.',
            response.status,
            payload,
        );
    }

    return payload;
}

export async function importGpx(file, dependencies = {}) {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest('/api/activities/import', {
        method: 'POST',
        body: formData,
    }, dependencies);
}
