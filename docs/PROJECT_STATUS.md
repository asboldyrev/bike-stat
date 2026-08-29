# Current project status

Last updated: 2026-08-29

## Active roadmap stage

PWA baseline — installability, app-shell offline start and controlled updates.

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

### Persistence/import

Merged into `dev`:

- activities, original GPX metadata/storage and normalized track points;
- transactional import and duplicate detection;
- anonymous per-device authentication;
- single-file and bulk GPX import;
- mobile-first bulk import workflow.

### Activity browsing/visualization

Merged into `dev`:

- owner-scoped list/detail API;
- URL-backed pagination;
- route map;
- elevation/reliable source-speed charts;
- mobile-first activity detail baseline.

### Mobile navigation/pairing

Merged into `dev`:

- fixed bottom mobile navigation;
- touch-safe page shell;
- settings pairing-link flow;
- second-device pairing redemption without accidental bootstrap.

## Current PWA baseline slice

The active branch adds installable application metadata and a dependency-free service worker.

Manifest/installability:

- `/manifest.webmanifest` defines Bike Stat name, start URL, standalone display, colors and language;
- PNG install icons are provided at 192×192 and 512×512;
- a separate 512×512 maskable icon is provided;
- SVG icon remains available for scalable browser/favicon use;
- the application HTML links the manifest and PWA metadata.

Service worker:

- registered only in production builds;
- service worker is registered at a stable `/sw.js` URL with `updateViaCache: none`, so browser update checks compare the actual worker script rather than treating every Vite bundle hash as a new service worker;
- install caches the root app shell, manifest/icons and current production Vite assets from `/build/manifest.json`;
- same-origin Vite assets/icons are cache-first;
- SPA navigation is network-first with cached root shell fallback;
- API responses and OpenStreetMap tiles are intentionally not offline-cached in the MVP baseline.

Controlled update behavior:

- a newly installed service worker waits instead of forcing an immediate reload;
- the app displays a visible “new version available” action;
- only explicit user action sends `SKIP_WAITING`;
- the update prompt is hidden immediately after confirmation;
- reload permission is consumed on the first matching `controllerchange`, preventing reload loops;
- first service-worker installation does not force an application reload.

Offline scope:

- an already-initialized device can start the Vue application shell without network after the shell has been cached;
- current activity/API data still requires network and should show normal request errors when offline;
- first-ever anonymous bootstrap cannot complete offline;
- map tiles are not part of the current offline shell.

## Manual acceptance requirement

PWA/service-worker behavior must be tested on a secure origin. Production/deployed acceptance requires HTTPS (localhost/loopback are the local-development exception).

Before declaring this roadmap stage complete, manually verify on Android/Chromium:

1. manifest is recognized and Bike Stat is offered for installation;
2. installed app launches in standalone mode;
3. after one online launch, app shell opens with network disabled;
4. a deployment that changes `sw.js` produces the controlled update prompt;
5. pressing Update activates the waiting worker and causes exactly one reload;
6. after reload the same update prompt does not immediately reappear.

## Immediate next work

1. Verify/merge PWA baseline and complete secure-origin Android acceptance.
2. Connect Android Web Share Target to the existing authenticated GPX import flow.
3. Continue map/chart interaction improvements and optional telemetry charts.
4. Build dashboard/aggregate statistics.
5. Continue mobile-first refinement based on real phone use.

## Current blockers

Secure-origin manual acceptance is required for PWA installability/service-worker verification.

