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

## GPX data ownership

The original GPX file is source data and is preserved. Activity rows, normalized track points and computed metrics are derived data.

Duplicate detection is based on a content hash scoped to the owning user.

## Future/considered

Detailed GPX table schema, extension adapters, statistic algorithms and offline synchronization will be documented when implemented.
