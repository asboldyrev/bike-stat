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

Status: planned.

- activities;
- original activity files with SHA-256;
- normalized track points;
- duplicate detection per user;
- transactional import service;
- authenticated import API;
- manual import UI.

## 3. Activity UI

Status: planned.

- activities list;
- activity details;
- basic metrics;
- robust loading/error/duplicate states.

## 4. Map and charts

Status: planned.

- route map;
- elevation and speed charts;
- cadence/heart-rate/power/temperature when present.

## 5. PWA baseline

Status: planned.

- manifest/icons;
- service worker;
- installability;
- app-shell offline start;
- controlled update flow.

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
