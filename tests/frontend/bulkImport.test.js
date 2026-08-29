import assert from 'node:assert/strict';
import test from 'node:test';

import {
    importGpxBatch,
    MAX_GPX_SIZE_BYTES,
    prepareImportEntries,
    summarizeImportEntries,
} from '../../resources/js/bulkImport.js';

test('prepareImportEntries accepts multiple valid GPX files independently', () => {
    const entries = prepareImportEntries([
        new File(['a'], 'one.gpx'),
        new File(['b'], 'two.GPX'),
    ]);

    assert.equal(entries.length, 2);
    assert.deepEqual(entries.map((entry) => entry.status), ['pending', 'pending']);
});

test('prepareImportEntries marks invalid files without rejecting the batch', () => {
    const entries = prepareImportEntries([
        new File(['a'], 'good.gpx'),
        new File(['x'], 'wrong.xml'),
        new File([new Uint8Array(MAX_GPX_SIZE_BYTES + 1)], 'large.gpx'),
    ]);

    assert.deepEqual(entries.map((entry) => entry.status), [
        'pending',
        'invalid',
        'invalid',
    ]);
});

test('bulk import keeps partial success and duplicate results', async () => {
    const entries = prepareImportEntries([
        new File(['a'], 'one.gpx'),
        new File(['b'], 'two.gpx'),
        new File(['c'], 'three.gpx'),
    ]);

    await importGpxBatch(entries, async (file) => {
        if (file.name === 'one.gpx') {
            return { activity: { id: 1, name: 'One' } };
        }

        if (file.name === 'two.gpx') {
            const error = new Error('Duplicate');
            error.status = 409;
            error.payload = { activity_id: 22 };
            throw error;
        }

        const error = new Error('Broken GPX');
        error.status = 422;
        throw error;
    });

    assert.deepEqual(entries.map((entry) => entry.status), [
        'success',
        'duplicate',
        'error',
    ]);

    assert.deepEqual(summarizeImportEntries(entries), {
        total: 3,
        success: 1,
        duplicate: 1,
        error: 1,
        invalid: 0,
    });
});
