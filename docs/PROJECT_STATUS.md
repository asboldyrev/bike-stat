# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Persistence and manual import — authenticated manual GPX import.

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

### Persistence backend

Merged into `dev`:

- activities, original GPX metadata/storage and normalized track points;
- transactional `ImportGpxActivity`;
- per-user SHA-256 duplicate detection.

### Anonymous device authentication

Merged into `dev`:

- anonymous first-device bootstrap;
- per-device Bearer credentials stored as hashes;
- revocation/last-used tracking;
- 2-minute single-use pairing credentials.

## Current manual-import slice

Backend:

- protected `POST /api/activities/import` requires `device.auth`;
- accepts multipart field `file`;
- upload limit is 10 MiB;
- filename must end in `.gpx` while MIME type is preserved rather than trusted for compatibility with mobile share/export implementations;
- calls the existing `ImportGpxActivity` use case;
- returns activity summary on success;
- returns `409` with existing `activity_id` for duplicate content;
- returns `422` for malformed/non-GPX uploads.

Frontend:

- on first application start, absence of a device token triggers `POST /api/bootstrap`;
- the returned token is stored in `localStorage` under `bike-stat.device-token`;
- an existing token is reused and is not silently replaced when later requests return 401;
- the shared API client adds `Authorization: Bearer ...`;
- `/import` now contains a functional GPX file picker and multipart upload flow;
- success and duplicate/auth/parser errors are shown in the import surface.

This manual import path is intentionally the same authenticated frontend/API boundary that the future Web Share Target flow will call after it obtains a File object.

## Immediate next work

1. Verify and merge authenticated manual GPX import.
2. Add activity list/details API and UI so successful imports can be browsed.
3. Add pairing/settings frontend flow for moving the anonymous identity to another device.
4. Add PWA manifest/service worker baseline.
5. Connect Web Share Target to the existing import flow.

## Current blockers

None.
