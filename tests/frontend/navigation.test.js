import assert from 'node:assert/strict';
import test from 'node:test';

import {
    primaryNavigation,
    shouldSkipAutomaticBootstrap,
} from '../../resources/js/navigation.js';
import { tokenFromHash } from '../../resources/js/pages/PairPage.js';

test('mobile navigation exposes the four primary MVP sections', () => {
    assert.deepEqual(
        primaryNavigation.map((item) => item.name),
        ['dashboard', 'activities', 'import', 'settings'],
    );
});

test('automatic anonymous bootstrap is skipped for a pairing link', () => {
    assert.equal(shouldSkipAutomaticBootstrap('/pair', '#token=secret'), true);
    assert.equal(shouldSkipAutomaticBootstrap('/pair', ''), false);
    assert.equal(shouldSkipAutomaticBootstrap('/activities', '#token=secret'), false);
});

test('pairing token is read from URL fragment', () => {
    assert.equal(tokenFromHash('#token=abc123'), 'abc123');
    assert.equal(tokenFromHash('#other=value'), null);
});
