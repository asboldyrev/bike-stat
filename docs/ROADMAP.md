# Bike Stat roadmap

This file tracks major stages. Immediate work belongs in `PROJECT_STATUS.md`; deferred fine-grained work belongs in `BACKLOG.md`.

## 0. Project foundation

Status: completed.

- [x] documentation/source-of-truth structure;
- [x] Vue SPA bootstrap;
- [x] frontend regression test baseline;
- [x] CI backend/frontend quality gate;
- [x] initial architecture ADRs.

## 1. GPX domain

Status: completed.

- validate GPX safely;
- parse tracks/segments/points;
- support standard time/location/elevation fields;
- introduce extension parsing boundary;
- calculate distance, elapsed time, moving time, speed and elevation metrics;
- fixture-based unit/regression tests;
- optional CLI importer for development verification.

## 2. Persistence and manual import

Status: completed.

- [x] activities;
- [x] original activity files with SHA-256;
- [x] normalized track points;
- [x] duplicate detection per user;
- [x] transactional import service;
- [x] authenticated import API;
- [x] single-file manual import UI;
- [x] bulk GPX selection/import for initial history loading;
- [x] per-file progress/result reporting for bulk import;
- [x] bulk import preserves per-user duplicate detection and allows partial success.

## 3. Activity UI

Status: active.

MVP UI is mobile-first. Every screen in this stage and later user-facing MVP stages must be usable on narrow touch screens before desktop enhancement is considered complete.

- [x] activities list;
- [x] activity details;
- [x] basic metrics;
- [x] robust loading/error/empty states;
- [x] mobile-first primary navigation and touch-safe application shell;
- [ ] continued mobile-first refinement of cards, spacing and dense metric layouts;
- [x] settings/pairing flow for connecting another device.

## 4. Map and charts

Status: active.

- [x] route map;
- [x] elevation profile;
- [x] source-speed chart when reliable point speed is available;
- [ ] cadence chart when present;
- [ ] heart-rate chart when present;
- [ ] power chart when present;
- [ ] temperature chart when present.

## 5. PWA baseline

Status: active.

- [x] manifest and install icons;
- [x] service worker;
- [ ] installability verified on secure-origin Android/Chromium;
- [x] app-shell offline start;
- [x] controlled update flow.

## 6. Android Share Target

Status: planned.

- register GPX share target;
- service worker receives shared file;
- temporary browser storage bridges into Vue;
- regular authenticated API performs import;
- Android/manual acceptance coverage.

## 7. Dashboard and aggregate statistics

Status: planned.

- week/month/year/all-time totals;
- recent rides;
- useful trends.

## 8. Advanced statistics

Status: planned.

- records;
- period comparisons;
- seasons;
- bicycle statistics;
- richer visualizations.

## 9. Post-MVP PWA/offline

Status: planned.

- offline activity cache;
- offline import;
- deferred synchronization;
- conflict strategy;
- map/offline strategy as needed.
