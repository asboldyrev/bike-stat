# Current project status

Last updated: 2026-08-29

## Active roadmap stage

GPX domain — elevation calibration.

## Completed GPX domain

Merged into `dev`:

- defensive GPX parsing and domain values;
- Haversine distance/time/speed baseline;
- SuperCycle 3.4.4 compatibility;
- preservation of SuperCycle source distance, speed, cadence and course for comparison/calibration.

## Current elevation slice

The raw consecutive-elevation algorithm was rejected after calibration against a representative real SuperCycle ride because stationary/low-speed altitude noise accumulated into implausible gain/loss.

The current branch introduces a dedicated `ElevationCalculator`:

1. median-filter elevations within each GPX segment using a 5-point window;
2. determine horizontal movement from source cumulative distance when available, otherwise Haversine;
3. ignore elevation changes where horizontal movement is zero;
4. ignore adjacent changes that imply absolute grade above 40%;
5. accumulate gain/loss from the remaining filtered profile;
6. report min/max from the filtered elevation profile.

Both median window and maximum grade are constructor parameters so later calibration does not require rewriting the algorithm.

On the representative real SuperCycle ride this materially reduces raw accumulated elevation noise, but no claim is made that the resulting number matches Strava or a DEM-corrected service. More representative rides should be compared before these defaults are considered final.

## Immediate next work

1. Verify and merge the elevation-filter slice.
2. Move to persistence: activities, original GPX file metadata/storage, normalized track points and per-user SHA-256 duplicate detection.
3. Implement anonymous device authentication before protected user-data APIs are exposed.
4. Add authenticated manual GPX import API/UI.

## Current blockers

None.
