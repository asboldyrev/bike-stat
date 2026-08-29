# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Map and charts — mobile-first activity visualization.

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

### Persistence and single-file manual import

Merged into `dev`:

- activities, original GPX metadata/storage and normalized track points;
- transactional `ImportGpxActivity`;
- per-user SHA-256 duplicate detection;
- anonymous per-device authentication;
- authenticated single-file GPX import API/UI.

Bulk import remains an MVP requirement and keeps this roadmap area active.

### Activity list/detail

Merged into `dev`:

- owner-scoped activity list/detail API;
- ride history and detail pages;
- basic metrics and source-file metadata.

## Current visualization slice

The active branch adds dependency-free route and metric visualization to the existing activity detail payload.

Route map:

- uses stored latitude/longitude track points;
- projects coordinates with Web Mercator;
- renders OpenStreetMap raster tiles in a responsive SVG viewport;
- preserves GPX `trkseg` boundaries rather than drawing false lines across pauses/gaps;
- marks start and finish;
- downsamples only the rendered route geometry for very long tracks while leaving persisted data untouched;
- includes OpenStreetMap attribution.

Charts:

- responsive SVG with no new runtime chart dependency;
- elevation profile uses normalized GPX elevation;
- speed chart uses recorded source speed when at least one positive value exists;
- zero-only legacy SuperCycle speed data is treated as unavailable rather than drawing a misleading flat/derived GPS chart;
- cumulative source distance is used as the horizontal axis when complete/monotonic enough for the series; otherwise point progress is used;
- long series are min/max bucket-downsampled for rendering while preserving visual extrema.

Mobile-first detail changes:

- compact two-column metric grid on narrow screens;
- smaller mobile typography/spacing;
- touch-sized back navigation;
- full-width map;
- charts stack vertically on mobile and become columns only at wide desktop breakpoints;
- long source filenames wrap instead of overflowing.

No new npm dependencies are introduced.

## MVP requirements still pending

- bulk GPX selection/import with per-file progress and partial success;
- broader mobile-first refinement of global navigation/activity-list/import/settings surfaces;
- pairing/settings frontend;
- PWA baseline and Android Share Target.

## Immediate next work

1. Verify and merge route map/elevation-speed visualization.
2. Implement bulk GPX import before declaring persistence/import complete.
3. Refine global navigation/import/activity-list for narrow touch screens.
4. Add pairing/settings frontend flow.
5. Add PWA manifest/service worker baseline and Share Target integration.

## Current blockers

None.
