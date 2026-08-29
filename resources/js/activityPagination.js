export function activityPageFromQuery(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    const page = Number.parseInt(String(raw ?? '1'), 10);

    return Number.isInteger(page) && page > 0 ? page : 1;
}

export function activitiesRoute(page) {
    return {
        name: 'activities',
        query: {
            page: String(Math.max(1, page)),
        },
    };
}

export function activityRoute(activityId, fromPage = 1) {
    return {
        name: 'activity',
        params: {
            id: activityId,
        },
        query: {
            fromPage: String(Math.max(1, fromPage)),
        },
    };
}

export function activitiesReturnRoute(fromPage) {
    return activitiesRoute(activityPageFromQuery(fromPage));
}
