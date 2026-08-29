import assert from 'node:assert/strict';
import test from 'node:test';

import {
    activityPageFromQuery,
    activityRoute,
    activitiesReturnRoute,
    activitiesRoute,
} from '../../resources/js/activityPagination.js';

test('activity page query parses positive page numbers and falls back to page one', () => {
    assert.equal(activityPageFromQuery('6'), 6);
    assert.equal(activityPageFromQuery(['3']), 3);
    assert.equal(activityPageFromQuery(undefined), 1);
    assert.equal(activityPageFromQuery('0'), 1);
    assert.equal(activityPageFromQuery('invalid'), 1);
});

test('activity list pagination is represented in the URL query', () => {
    assert.deepEqual(activitiesRoute(6), {
        name: 'activities',
        query: { page: '6' },
    });
});

test('activity detail remembers which list page opened it', () => {
    assert.deepEqual(activityRoute(42, 6), {
        name: 'activity',
        params: { id: 42 },
        query: { fromPage: '6' },
    });

    assert.deepEqual(activitiesReturnRoute('6'), {
        name: 'activities',
        query: { page: '6' },
    });
});
