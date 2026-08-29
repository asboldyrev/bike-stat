# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Project foundation.

## Current checkpoint

The repository is a fresh Laravel application with Vue-related dependencies present but without an initialized Vue SPA, frontend regression test setup, project documentation policy or CI quality gate.

Accepted foundation decisions are being introduced for:

- modular-monolith topology;
- original GPX preservation and derived statistics;
- Web Share Target delivery through service worker/temporary browser storage into the regular Vue import flow;
- anonymous users with per-device bearer tokens and one-time pairing.

## Immediate next work

1. Complete and verify project foundation.
2. Implement GPX domain parsing/calculation using fixtures and tests.
3. Add persistence and manual import before PWA Share Target integration.

## Current blockers

None.
