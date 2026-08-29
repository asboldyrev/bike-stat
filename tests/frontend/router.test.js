import assert from 'node:assert/strict';
import test from 'node:test';

import { routeDefinitions } from '../../resources/js/routes.js';

test('application routes remain available', () => {
    assert.deepEqual(
        routeDefinitions.map((route) => route.path),
        ['/', '/activities', '/activities/:id', '/import', '/settings', '/pair'],
    );
});

test('routes have stable names for navigation', () => {
    assert.deepEqual(
        routeDefinitions.map((route) => route.name),
        ['dashboard', 'activities', 'activity', 'import', 'settings', 'pair'],
    );
});
