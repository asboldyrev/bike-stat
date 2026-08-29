# Bike Stat architecture

This document describes current architecture. Future architecture must be explicitly marked as future/considered.

## Current shape

Bike Stat is a modular monolith in one repository and one Laravel deployable.

```text
                 Laravel application
                        |
                 HTTP/API boundary
                        |
                 application/domain
                        |
                     Eloquent
                        |
                  application DB

                    Vue SPA
              Router / Pinia / UI
```

## Frontend/backend boundary

Laravel serves the application and API. Vue owns interactive application UI and calls authenticated API endpoints.

The PWA Share Target is intentionally not the final persistence endpoint. Shared files are delivered into the PWA/browser context first, then the regular Vue application uploads through the same authenticated API used by manual import.

## Identity and authentication

The MVP identity is anonymous but server-backed.

`device_tokens` contains one independent credential record per device. The client receives a 256-bit random bearer token once; only its SHA-256 hash is stored. Active protected API calls are authenticated by `AuthenticateDeviceToken`, which resolves the owning `User`, rejects revoked tokens and records coarse `last_used_at` activity.

First-use bootstrap is intentionally public and narrow: `POST /api/bootstrap` creates an internal anonymous user plus its first device token. Public credential endpoints are rate limited.

`pairing_tokens` is a separate credential class. An authenticated device can issue a token that expires after two minutes. Pairing URLs use `/pair#token=...` so the secret fragment is not included in the HTTP request URL. Redeeming the pairing token is transactionally locked, marks it used and creates a new independent device token for the same user.

Device and pairing credentials are never interchangeable. Only hashes are persisted.

The current framework-default user schema still requires name/email/password. Bootstrap populates non-user-facing technical values solely for schema compatibility; those fields are not product authentication credentials.

The frontend keeps its device credential in browser storage for the MVP. This makes XSS prevention, CSP and dependency hygiene part of the security boundary.

The pairing frontend uses a dedicated `/pair` route. That route is excluded from normal first-run anonymous bootstrap so a newly opened pairing link cannot create an unrelated anonymous identity before redeeming the one-time token. On successful redemption, the new device token replaces local device identity state and the secret fragment is removed from browser history.

The primary mobile application shell uses fixed bottom navigation for Overview, Activities, Import and Settings. Desktop progressively enhances the same route model with header navigation rather than introducing a different information architecture.

## GPX import boundary

Manual import is now implemented through the regular authenticated application boundary:

```text
Vue /import
   -> File
   -> FormData
   -> POST /api/activities/import
   -> device.auth
   -> ImportGpxActivity
   -> parser/statistics/storage/database
```

The browser application bootstraps an anonymous device only when no token exists in local storage. The shared API client adds the device Bearer token to protected calls. A 401 for an existing token does not silently bootstrap a replacement identity.

The import endpoint validates upload size and `.gpx` filename, then delegates all parsing, duplicate detection and persistence to `ImportGpxActivity`. MIME is recorded but not used as the sole acceptance criterion because GPX exporters/share targets may use XML or generic MIME types.

Manual import, bulk import and the future Share Target import converge after obtaining browser `File` objects.

Bulk import is client-orchestrated: the frontend validates the selected set and sequentially calls the existing authenticated single-file `POST /api/activities/import` endpoint. There is intentionally no separate batch persistence endpoint. This keeps each GPX transaction independent, preserves per-file duplicate detection/partial success, and avoids coupling total history size to one multipart request/body-size limit.

Future Share Target flow:

```text
Android Share
   -> Web Share Target POST
   -> Service Worker
   -> temporary IndexedDB entry
   -> Vue import page
   -> existing authenticated POST /api/activities/import
```

Service workers do not depend on the device bearer token for GPX ingestion.

## GPX domain

GPX parsing is separated from persistence.

Current boundaries:

- `App\Infrastructure\Gpx\GpxParser` validates/parses XML into domain values;
- `TrackPoint`, `TrackSegment` and `ParsedGpx` are persistence-independent domain objects;
- common track-point extensions are read by XML local-name so namespace prefixes do not become application contracts;
- `DistanceCalculator` uses the Haversine model;
- `ActivityStatisticsCalculator` derives statistics from parsed segments;
- source-provided measurements are preserved on `TrackPoint` and may take precedence when a track provides a complete, internally consistent source telemetry set.

When every track point provides monotonic cumulative source distance and source speed, Bike Stat treats those values as device telemetry:

- total distance = final cumulative source distance;
- moving time = sum of per-`trkseg` time spans;
- max speed = maximum source speed;
- average speed = source distance / source moving time.

This avoids one-second GPS-coordinate spikes producing implausible cycling peak speeds. If complete/monotonic source telemetry is unavailable, Bike Stat falls back to Haversine distance and movement-threshold calculations.

Fallback maximum speed is delegated to `MaximumSpeedCalculator`. It rejects a single coordinate-derived interval when it is an isolated spike relative to both neighboring intervals (at least 3× neighbor scale and at least 5 m/s above the faster neighbor). Sustained high-speed sections remain valid because adjacent intervals corroborate the peak. This specifically handles legacy GPX exports where source speed is absent or unusable without imposing an arbitrary bicycle speed ceiling.

A representative SuperCycle export uses GPX 1.1 plus Garmin TrackPointExtension v2. In addition to cadence it provides cumulative `distance`, point `speed` and `course`. These are currently preserved as `sourceDistanceMeters`, `sourceSpeedMetersPerSecond` and `courseDegrees`.

DTD/entity declarations are rejected and XML loading uses `LIBXML_NONET`.

The current moving-speed threshold is 1.0 m/s.

Elevation statistics are delegated to `ElevationCalculator`. Its current calibration applies a 5-point median filter per GPX segment, ignores elevation changes with no horizontal movement, and rejects adjacent changes implying absolute grade above 40%. SuperCycle cumulative source distance is preferred for this plausibility check when present; generic GPX falls back to Haversine distance. Filter parameters are explicit constructor values and remain subject to calibration against additional representative rides.

## GPX data ownership and persistence

The original GPX file is source data and is preserved on the private `local` filesystem disk.

Persistence is split into:

- `activities`: owner, source, timestamps and computed aggregate statistics;
- `activity_files`: one original source file per activity, including original name, disk/path, MIME type, byte size and SHA-256;
- `activity_track_points`: normalized point data with GPX segment index and point sequence.

`activity_files` repeats `user_id` intentionally so the database can enforce unique `(user_id, sha256)` duplicate detection without relying on cross-table logic.

`ImportGpxActivity` is the application boundary that joins parser/statistics/storage/database concerns. The HTTP layer will call this use case later rather than reimplementing import logic.

Original-file storage is written before the database transaction and explicitly removed if database persistence fails. Database child rows use foreign-key cascade deletion. Physical file deletion on activity removal remains an explicit application concern rather than an Eloquent model event.

## Activity read boundary

Authenticated activity reads are owner-scoped at query time.

- `GET /api/activities` provides a paginated summary list;
- `GET /api/activities/{id}` returns detail data only when the activity belongs to the authenticated anonymous user;
- foreign activity IDs resolve as 404;
- the current detail representation includes original-file metadata plus normalized track points for the upcoming map/chart layer.

The Vue routes `/activities` and `/activities/:id` consume this boundary. Activity persistence remains server-authoritative; the frontend does not reconstruct statistics from raw GPX.

Because original GPX files are preserved, `RecalculateActivityStatistics` and the `activities:recalculate` Artisan command can refresh persisted aggregate metrics when statistic algorithms improve without reimporting or duplicating the ride.

## Activity visualization

Activity detail visualization consumes the existing normalized `track_points` representation; it does not re-read GPX in the browser.

The route map is implemented without an additional mapping runtime dependency:

- Web Mercator projection is calculated in the frontend;
- OpenStreetMap raster tiles are rendered inside a responsive SVG viewport;
- route polylines preserve `segment_index` boundaries;
- rendering may downsample very dense route geometry, without mutating server data;
- OpenStreetMap attribution is displayed with the map.

Metric charts are responsive SVG components. Elevation uses normalized point elevation. Speed uses source point speed only when the source contains meaningful positive values. Legacy zero-only source speed is shown as unavailable rather than falling back to a potentially noisy coordinate-derived chart.

Visualization-series downsampling is presentation-only and keeps bucket minima/maxima so peaks/valleys are less likely to disappear.

The current detail API still returns all normalized points. This is acceptable for current personal-use ride sizes; a dedicated visualization/downsampled API may replace it if payload size becomes a measured problem.

## PWA baseline

Bike Stat uses a small first-party service worker rather than an additional PWA build dependency.

The web app manifest is static under `public/manifest.webmanifest` and includes raster 192/512 install icons plus a maskable 512 icon.

The production application registers a stable `/sw.js` URL with `updateViaCache: none`. The service-worker lifecycle therefore changes only when the worker script itself changes, instead of treating every Vite bundle hash as a distinct worker. Normal frontend deployments are picked up through network-first HTML plus hashed Vite assets; cache misses fetch/cache the new asset URLs as they are requested.

During install the service worker caches:

- root SPA HTML;
- web manifest and application icons;
- the current production Vite assets discovered from `/build/manifest.json`.

Caching policy:

- SPA navigation: network-first, cached root app-shell fallback;
- same-origin build assets/icons: cache-first;
- API requests: network only;
- third-party OpenStreetMap tiles/fonts: outside the current offline cache.

Updates are controlled. A genuinely changed worker remains waiting until the Vue shell explicitly sends `SKIP_WAITING` after user confirmation. The prompt is cleared immediately on confirmation and controller-change reload permission is one-shot, preventing repeated prompt/reload loops. This avoids forcing reloads during imports or other active interaction.

This baseline provides offline application-shell startup, not offline activity data. Full offline activity caching/import/synchronization remains post-MVP.

## Future/considered

Additional cadence/heart-rate/power/temperature charts, server-side visualization payload shaping, explicit activity-deletion orchestration and offline synchronization will be documented when implemented.
