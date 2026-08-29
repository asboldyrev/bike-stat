import assert from 'node:assert/strict';
import test from 'node:test';

import { routeDefinitions } from '../../resources/js/routes.js';

test('foundation routes remain available', () => {
    assert.deepEqual(
        routeDefinitions.map((route) => route.path),
        ['/', '/activities', '/import'],
    );
});

test('routes have stable names for navigation', () => {
    assert.deepEqual(
        routeDefinitions.map((route) => route.name),
        ['dashboard', 'activities', 'import'],
    );
});
