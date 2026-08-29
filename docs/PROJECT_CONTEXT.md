# Bike Stat project context

## Product

Bike Stat is a personal cycling activity application centered on importing GPX rides from a phone/bike-computer workflow and producing activity/statistics views similar in spirit to fitness trackers, without social-network scope.

The primary mobile flow is:

1. the user taps Share for a GPX file in another app;
2. Android offers the installed Bike Stat PWA as a share target;
3. the PWA receives the file locally;
4. the regular authenticated Vue application uploads it through the normal API;
5. the imported activity is parsed, stored and presented with statistics, map and charts.

Manual GPX import is the fallback and uses the same application import flow after a File object is available.

MVP must also support selecting/importing multiple GPX files in one action so an existing ride history can be loaded efficiently. Bulk import should process files independently, preserve duplicate detection, and report per-file success/failure rather than failing the whole batch because one file is invalid or already imported.

## Mobile-first product constraint

Bike Stat is primarily a phone application. All MVP UI work must be designed and verified mobile-first rather than treating mobile as a later responsive pass.

Desktop layouts may progressively enhance the same screens, but core navigation, import, activity browsing, metrics, maps, charts, pairing and PWA flows must remain comfortable on narrow touch screens.

## Repository and stack

Bike Stat is a single Laravel application containing backend/API and Vue frontend.

Current baseline:

- Laravel 13;
- PHP 8.3+;
- Vue 3;
- Vue Router;
- Pinia;
- Tailwind CSS 4;
- shadcn-vue;
- Vite;
- PHPUnit for backend tests;
- Node's built-in test runner for the initial dependency-free frontend smoke baseline.

A richer component/regression layer such as Vitest + Vue Test Utils may be introduced when frontend behavior becomes substantial enough to justify the additional dependencies.

The project is a modular monolith unless an accepted ADR changes this.

## Identity model

MVP does not require email/password registration.

On first use the application creates an anonymous user and a device-specific bearer token. Each device has its own token. Additional devices are connected through short-lived, one-time pairing links/tokens that mint a new device token for the same user.

A permanent device token must never double as a share/pairing token.

## GPX source model

The original GPX file is preserved as source data. Normalized activity data and computed statistics are derived from it so calculations can be improved and recomputed later.

## Product direction

The release priority is:

1. reliable project foundation;
2. reliable GPX parsing/calculation;
3. persistence and manual/bulk import;
4. mobile-first activity UI;
5. PWA installability;
6. Android Share Target flow;
7. dashboard and aggregate statistics;
8. advanced statistics/offline enhancements.

The current execution checkpoint is in `docs/PROJECT_STATUS.md`.
