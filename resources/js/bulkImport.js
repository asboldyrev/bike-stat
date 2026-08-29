export const MAX_GPX_SIZE_BYTES = 10 * 1024 * 1024;

export function prepareImportEntries(files) {
    return Array.from(files).map((file, index) => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension !== 'gpx') {
            return {
                id: index,
                file,
                status: 'invalid',
                message: 'Файл должен иметь расширение .gpx.',
                activity: null,
            };
        }

        if (file.size > MAX_GPX_SIZE_BYTES) {
            return {
                id: index,
                file,
                status: 'invalid',
                message: 'GPX-файл не должен быть больше 10 МиБ.',
                activity: null,
            };
        }

        return {
            id: index,
            file,
            status: 'pending',
            message: '',
            activity: null,
        };
    });
}

export async function importGpxBatch(entries, importOne, onUpdate = () => {}) {
    for (const entry of entries) {
        if (entry.status !== 'pending') {
            onUpdate(entry);
            continue;
        }

        entry.status = 'importing';
        entry.message = '';
        onUpdate(entry);

        try {
            const result = await importOne(entry.file);

            entry.status = 'success';
            entry.activity = result.activity;
            entry.message = 'Импортировано.';
        } catch (error) {
            if (error.status === 409 && error.payload?.activity_id) {
                entry.status = 'duplicate';
                entry.activity = { id: error.payload.activity_id };
                entry.message = 'Уже импортировано.';
            } else if (error.status === 401) {
                entry.status = 'error';
                entry.message = 'Не удалось подтвердить это устройство.';
            } else {
                entry.status = 'error';
                entry.message = error.message ?? 'Не удалось импортировать GPX.';
            }
        }

        onUpdate(entry);
    }

    return entries;
}

export function summarizeImportEntries(entries) {
    return entries.reduce((summary, entry) => {
        summary.total++;

        if (entry.status === 'success') summary.success++;
        if (entry.status === 'duplicate') summary.duplicate++;
        if (entry.status === 'error') summary.error++;
        if (entry.status === 'invalid') summary.invalid++;

        return summary;
    }, {
        total: 0,
        success: 0,
        duplicate: 0,
        error: 0,
        invalid: 0,
    });
}
