# Current project status

Last updated: 2026-08-29

## Active roadmap stage

GPX domain — real-file calibration.

## Completed foundation

The project foundation is merged into `dev`:

- repository documentation/source-of-truth structure;
- Vue/Pinia/Router application shell;
- frontend smoke-test baseline;
- backend/frontend CI quality gate;
- initial architecture ADRs.

## Completed GPX-domain baseline

The initial GPX domain is merged into `dev`:

- immutable track point/segment/parsed-GPX domain objects;
- defensive GPX XML parsing;
- standard latitude/longitude/elevation/time parsing;
- common HR/cadence/power/temperature extension extraction;
- Haversine distance calculation;
- elapsed/moving time, average/max speed and raw elevation metrics;
- deterministic fixtures and unit/regression tests.

## Real SuperCycle calibration

A representative SuperCycle 3.4.4 GPX export has been inspected.

Observed characteristics:

- GPX 1.1 with Garmin TrackPointExtension v2 namespace;
- track type `Biking`;
- many track segments, including very short segments;
- approximately one-second point sampling while recording;
- SuperCycle writes cumulative `distance` directly under point `extensions`;
- TrackPointExtension contains `cad`, `speed` and `course`;
- the inspected ride did not contain heart-rate, power or temperature fields;
- source distance is monotonic across segment boundaries in the inspected file.

The parser now preserves SuperCycle source distance, source speed and course on each track point. These values are diagnostic/source measurements for now; they do not silently replace independently calculated statistics.

Raw consecutive elevation accumulation is not suitable for the inspected real file: GPS elevation noise produces an implausibly high accumulated gain/loss. Elevation filtering/calibration is therefore required before elevation gain is treated as production-quality.

## Immediate next work

1. Verify and merge the SuperCycle compatibility slice.
2. Define and test calibrated elevation gain/loss behavior against real ride data.
3. Add persistence, original-file storage and duplicate detection.
4. Implement anonymous device authentication before exposing protected user-data APIs.
5. Add the authenticated manual-import API/UI.

## Current blockers

None.
