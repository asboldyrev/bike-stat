# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Activity UI — statistic calibration from real SuperCycle telemetry.

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

### Activity list/detail

Merged into `dev`:

- owner-scoped activity list/detail API;
- ride history and detail pages;
- basic metrics and source-file metadata.

## Real SuperCycle statistics calibration

A representative real SuperCycle ride was compared against persisted Bike Stat values.

Observed:

- Bike Stat Haversine distance: about 20.761 km;
- SuperCycle cumulative source distance: 20.910 km;
- GPX first-to-last point elapsed time: about 1:38:08;
- sum of GPX segment spans: about 1:22:59;
- Bike Stat GPS-delta peak speed: about 72.5 km/h caused by a single coordinate jump;
- SuperCycle recorded peak speed: about 51.85 km/h;
- elevation min/max range: about 187 m.

The active branch changes statistic precedence when a track contains complete, monotonic cumulative source distance plus source speed for every point:

1. distance uses the final cumulative source distance;
2. moving time uses the sum of per-`trkseg` time spans;
3. max speed uses the maximum source-device speed;
4. average speed is derived from source distance / segment moving time;
5. elapsed time remains first-to-last GPX point duration because no longer duration is encoded in the file.

Generic GPX files without complete source telemetry continue to use Haversine/movement-threshold fallback. Fallback maximum speed now rejects isolated coordinate-speed spikes that are at least 3× both-neighbor scale and at least 5 m/s above the faster neighbor.

A legacy SuperCycle 2.0.42 export was inspected: it samples every 6 seconds and writes `speed=0` for every point. One early GPS position correction jumps about 86 m in a single 6-second interval, which previously appeared as ~51.8 km/h despite adjacent intervals being only a few km/h. That pattern is now treated as an isolated GPS correction, not a ride maximum.

Elevation gain/loss remains approximate and is not changed by this slice. The detail UI now shows min/max elevation and elevation range separately from accumulated gain/loss.

Existing stored activities can be recalculated from preserved source GPX with:

```bash
php artisan activities:recalculate
php artisan activities:recalculate <activity-id>
```

## MVP requirements added

Two requirements are now explicitly part of MVP rather than post-MVP polish:

- bulk GPX import: the import surface must allow selecting multiple files and importing an existing history in one action, with per-file status and partial success;
- mobile-first UX: Bike Stat is primarily used on phones, so all user-facing MVP screens must be designed and verified for narrow touch layouts first.

## Immediate next work

1. Recalculate existing imported rides where needed after statistic changes.
2. Add route map and elevation/speed visualization with mobile-first layout constraints.
3. Add bulk GPX import before declaring the import stage complete.
4. Add pairing/settings frontend flow with mobile-first UX.
5. Add PWA manifest/service worker baseline and Share Target integration.

## Current blockers

None.
