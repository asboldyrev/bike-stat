# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Persistence and manual import — persistence backend.

## Completed stages

### Project foundation

Merged into `dev`:

- repository documentation/source-of-truth structure;
- Vue/Pinia/Router shell;
- frontend smoke tests;
- backend/frontend CI.

### GPX domain

Merged into `dev`:

- defensive GPX parser;
- SuperCycle 3.4.4 source metrics;
- distance/time/speed statistics;
- calibrated elevation filtering boundary;
- deterministic unit/regression coverage.

## Current persistence slice

The active branch introduces persistence without exposing an HTTP API yet.

Schema:

- `activities`: activity identity and computed aggregate statistics;
- `activity_files`: immutable original GPX metadata, private-storage path and SHA-256;
- `activity_track_points`: normalized points preserving segment/order and supported source metrics.

Import flow:

1. calculate SHA-256 and reject an existing `(user_id, sha256)`;
2. parse GPX and calculate statistics;
3. write the original GPX to the private `local` disk;
4. transactionally create the activity, file metadata and normalized track points;
5. batch-insert track points;
6. delete a newly written file when database persistence fails.

The database also enforces a unique `(user_id, sha256)` constraint to protect against concurrent duplicate imports.

The same GPX may belong to different users.

Deleting an Activity cascades database rows through foreign keys. Physical source-file deletion is intentionally not hidden in Eloquent model events; it will be handled by an explicit application use case when activity deletion is implemented.

## Immediate next work

1. Verify and merge the persistence backend.
2. Implement anonymous users and per-device bearer authentication/pairing.
3. Expose protected manual GPX import API using `ImportGpxActivity`.
4. Add manual import UI.
5. Add activity list/details API and UI.

## Current blockers

None.
