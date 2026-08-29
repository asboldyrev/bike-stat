# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Persistence and manual import — mobile-first bulk GPX history import.

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
- SuperCycle compatibility across modern and legacy exports;
- calibrated distance/time/speed/elevation statistics;
- isolated GPS max-speed spike rejection;
- deterministic unit/regression coverage.

### Persistence and single-file import

Merged into `dev`:

- activities, original GPX metadata/storage and normalized track points;
- transactional `ImportGpxActivity`;
- per-user SHA-256 duplicate detection;
- anonymous per-device authentication;
- authenticated GPX import API;
- single-file manual import UI.

### Activity browsing and visualization

Merged into `dev`:

- owner-scoped activity list/detail API;
- ride history and detail pages;
- route map;
- elevation and reliable source-speed charts;
- first mobile-first refinement of the detail screen.

## Current bulk-import slice

The active branch extends the existing single-file authenticated import path rather than adding a second server-side batch API.

Frontend behavior:

- one file picker may select multiple GPX files;
- each selected file is validated independently for `.gpx` extension and 10 MiB maximum size;
- valid files are uploaded sequentially through the existing `POST /api/activities/import`;
- each file has its own pending/importing/success/duplicate/error/invalid status;
- duplicate and invalid files do not stop later files;
- successful and duplicate rows link to the resulting/existing activity;
- a final summary reports new imports, duplicates and errors/skips;
- the import screen is designed mobile-first with a full-width primary action and touch-sized controls.

Sequential single-file requests are intentional:

- existing transactional/duplicate behavior is reused without a parallel implementation;
- a very large history is not bundled into one huge multipart request;
- PHP/reverse-proxy request-size limits continue to apply per file rather than to the whole history batch;
- partial success is naturally preserved.

The previous additional 10 requests/minute import throttle was removed. The authenticated API group still applies its existing 60 requests/minute throttle, which makes practical sequential history imports possible while retaining an authenticated request-rate boundary.

## Immediate next work

1. Verify and merge bulk GPX import.
2. Refine global navigation/activity list for narrow touch screens.
3. Add pairing/settings frontend flow.
4. Continue map/chart interaction improvements and optional telemetry charts.
5. Add PWA manifest/service worker baseline and Share Target integration.

## Current blockers

None.
