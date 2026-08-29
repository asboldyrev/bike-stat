const DEVICE_TOKEN_KEY = 'bike-stat.device-token';

export function getDeviceToken(storage = window.localStorage) {
    return storage.getItem(DEVICE_TOKEN_KEY);
}

export function setDeviceToken(token, storage = window.localStorage) {
    storage.setItem(DEVICE_TOKEN_KEY, token);
}

export async function ensureDeviceToken({
    storage = window.localStorage,
    fetchImpl = window.fetch.bind(window),
    deviceName = navigator.userAgent,
} = {}) {
    const existing = getDeviceToken(storage);

    if (existing) {
        return existing;
    }

    const response = await fetchImpl('/api/bootstrap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            device_name: deviceName.slice(0, 100),
        }),
    });

    if (!response.ok) {
        throw new Error('Не удалось создать локальную учётную запись.');
    }

    const payload = await response.json();

    if (!payload.token) {
        throw new Error('Сервер не вернул device token.');
    }

    setDeviceToken(payload.token, storage);

    return payload.token;
}

export { DEVICE_TOKEN_KEY };
