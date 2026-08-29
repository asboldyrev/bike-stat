# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Activity UI — list and detail browsing.

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
- SuperCycle 3.4.4 compatibility;
- distance/time/speed/elevation statistics;
- deterministic unit/regression coverage.

### Persistence and manual import

Merged into `dev`:

- activities, original GPX metadata/storage and normalized track points;
- transactional `ImportGpxActivity`;
- per-user SHA-256 duplicate detection;
- anonymous per-device authentication;
- authenticated manual GPX import API;
- browser bootstrap/token storage and manual import UI.

## Current activity UI slice

Backend:

- `GET /api/activities` returns the authenticated user's activities, newest first, paginated 20 per page;
- `GET /api/activities/{id}` returns one owned activity with original-file metadata and normalized track points;
- ownership is enforced in the query itself;
- another user's activity ID is returned as 404 rather than exposing its existence.

Frontend:

- `/activities` now lists imported rides with date, distance, moving time, average/max speed and elevation gain;
- `/activities/:id` shows the basic activity metrics, original source-file information and track-point count;
- successful manual import links directly to the resulting activity;
- empty/loading/error states are present.

The detail API currently returns all normalized track points. This is acceptable for the present personal-use baseline and enables the upcoming map/chart stage, but payload shaping/downsampling may be introduced when visualization behavior is implemented.

## Immediate next work

1. Verify and merge activity list/detail browsing.
2. Add route map and elevation/speed visualization.
3. Add pairing/settings frontend flow for moving the anonymous identity to another device.
4. Add PWA manifest/service worker baseline.
5. Connect Web Share Target to the existing import flow.

## Current blockers

None.
