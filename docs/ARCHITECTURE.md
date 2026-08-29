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

- an anonymous `User` represents the owner's data;
- each device receives its own high-entropy bearer credential;
- only a hash of a bearer token should be persisted server-side;
- adding another device uses a separate one-time short-lived pairing credential;
- redeeming pairing creates a new device credential for the same user;
- device credentials can later be revoked independently.

The frontend may keep its device credential in browser storage for the MVP. This makes XSS prevention, CSP and dependency hygiene part of the security boundary.

## GPX import boundary

Manual import and Share Target import converge on one frontend import workflow.

Future/target flow:

```text
Android Share
   -> Web Share Target POST
   -> Service Worker
   -> temporary IndexedDB entry
   -> Vue import page
   -> authenticated API upload
   -> Laravel validation/parser/import service
   -> persistence
```

Service workers do not depend on the device bearer token for GPX ingestion.

## GPX domain

GPX parsing is separated from persistence.

Current boundaries:

- `App\Infrastructure\Gpx\GpxParser` validates/parses XML into domain values;
- `TrackPoint`, `TrackSegment` and `ParsedGpx` are persistence-independent domain objects;
- common track-point extensions are read by XML local-name so namespace prefixes do not become application contracts;
- `DistanceCalculator` uses the Haversine model;
- `ActivityStatisticsCalculator` derives baseline distance/time/speed/elevation statistics from parsed segments;
- source-provided measurements may also be preserved on `TrackPoint` for comparison/calibration rather than silently overriding calculated values.

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

## Future/considered

Anonymous device authentication, protected HTTP import, explicit activity-deletion orchestration and offline synchronization will be documented when implemented.
