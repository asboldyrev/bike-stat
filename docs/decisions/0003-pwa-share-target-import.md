# ADR 0003: PWA Share Target feeds the normal authenticated import flow

Status: accepted
Date: 2026-08-29

## Context

Android can send a GPX file to an installed PWA via Web Share Target. Persisting that system POST directly in Laravel would create a special write path with different authentication/CSRF characteristics.

## Decision

The Share Target POST is handled inside the PWA flow. A service worker extracts the shared File, stores it temporarily in browser storage (planned: IndexedDB), and redirects/opens the Vue import surface.

Vue then uploads the File through the same authenticated API used for manual imports.

The service worker does not need or consume the user's device bearer credential.

## Consequences

- one persistence/import API path;
- manual and Share Target flows share validation/UI behavior;
- browser temporary-file lifecycle must be handled carefully;
- PWA acceptance testing is required on supported Android browsers.
