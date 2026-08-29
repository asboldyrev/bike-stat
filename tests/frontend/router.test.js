import assert from 'node:assert/strict';
import test from 'node:test';

import { routes } from '../../resources/js/router.js';

test('foundation routes remain available', () => {
    assert.deepEqual(
        routes.map((route) => route.path),
        ['/', '/activities', '/import'],
    );
});

test('routes have stable names for navigation', () => {
    assert.deepEqual(
        routes.map((route) => route.name),
        ['dashboard', 'activities', 'import'],
    );
});
