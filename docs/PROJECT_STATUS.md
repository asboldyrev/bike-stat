# Current project status

Last updated: 2026-08-29

## Active roadmap stage

GPX domain.

## Completed foundation

The project foundation is merged into `dev`:

- repository documentation/source-of-truth structure;
- Vue/Pinia/Router application shell;
- frontend smoke-test baseline;
- backend/frontend CI quality gate;
- initial architecture ADRs.

## Current GPX-domain slice

The active branch introduces:

- immutable track point/segment/parsed-GPX domain objects;
- defensive GPX XML parsing with external-network access disabled and DTD/entity declarations rejected;
- standard latitude/longitude/elevation/time parsing;
- common track-point extension extraction for heart rate, cadence, power and temperature;
- Haversine distance calculation;
- elapsed/moving time, average/max speed and raw elevation gain/loss/min/max calculations;
- deterministic GPX fixtures and unit/regression coverage.

The initial moving threshold is 1.0 m/s. Elevation gain/loss is currently calculated from raw consecutive GPX elevations without smoothing; refinement belongs to a later statistics-calibration slice and must be regression-tested against representative real files.

## Immediate next work

1. Verify and merge the GPX-domain baseline.
2. Test the parser against representative GPX files from the actual bike-computer application and add vendor-specific extension handling if required.
3. Add persistence, original-file storage, duplicate detection and manual import.
4. Implement anonymous device authentication before protected user-data APIs are exposed.

## Current blockers

None.
