# ADR 0002: Preserve original GPX as source data

Status: accepted
Date: 2026-08-29

## Context

Distance, moving time, elevation gain and extension parsing may improve over time. Storing only current computed values would make recalculation impossible.

## Decision

Preserve the original GPX file unchanged and treat normalized track/activity data plus statistics as derived data.

Use a content hash scoped to the user for duplicate detection.

## Consequences

- calculations can be recomputed later;
- parser improvements do not require re-exporting source rides;
- storage use increases modestly.
