# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Activity UI — mobile-first navigation and device pairing/settings.

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

## Current mobile navigation/settings slice

The active branch adds a phone-first application shell and frontend pairing flow.

Navigation:

- mobile devices use a fixed bottom navigation bar;
- primary sections are Overview, Activities, Import and Settings;
- activity detail keeps Activities highlighted as the active primary section;
- safe-area padding is applied for phones with bottom insets;
- desktop keeps a compact header navigation as progressive enhancement;
- content receives bottom padding so fixed mobile navigation does not cover page content.

Settings/pairing:

- `/settings` can issue the existing two-minute one-time pairing link;
- the link can be copied from the phone, including an HTTP-compatible copy fallback;
- `/pair#token=...` redeems the pairing credential on the new device;
- the redeemed device receives its own independent device token and stores it in localStorage;
- successful pairing routes to Activities;
- pairing token remains in the URL fragment and is removed from browser history immediately after successful redemption;
- every `/pair` route skips normal first-run anonymous bootstrap, preventing creation of an orphan anonymous account before pairing or when a pairing link is malformed.

Current settings UI intentionally does not yet list/revoke named devices; backend revocation support exists at the credential level and a device-management API/UI can be added as a follow-up.

## Immediate next work

1. Verify and merge mobile navigation/settings/pairing.
2. Continue map/chart interaction improvements and optional telemetry charts.
3. Add PWA manifest/service-worker/installability baseline.
4. Connect Android Share Target to the existing authenticated import flow.
5. Build dashboard/aggregate statistics.

## Current blockers

None.
