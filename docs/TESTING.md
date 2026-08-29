# Testing strategy

## Backend

Laravel tests live under `tests/Feature` and `tests/Unit`.

Use feature tests for API/auth/persistence/security boundaries and unit tests for pure GPX/statistics behavior.

Run:

```bash
php artisan test
```

## Frontend

The foundation uses Node's built-in test runner for dependency-free frontend smoke coverage under `tests/frontend`.

Run:

```bash
npm test
npm run test:watch
```

When component behavior, mutation flows and stateful UI become substantial, introduce a Vue-aware regression layer (expected: Vitest + Vue Test Utils) and update this policy in the same change.

Production build is a separate gate:

```bash
npm run build
```

## Regression expectations

Add/update tests when practical for:

- GPX parsing/calculation bugs;
- import and duplicate behavior;
- anonymous/device authentication;
- pairing expiration/single-use semantics;
- critical frontend import flows;
- state preservation on failed mutations;
- shared interactive controls.

Visual-only CSS changes do not require exhaustive snapshot coverage.

## Fixtures

GPX domain work should use repository fixtures under a dedicated test fixture directory so parser/statistics behavior is deterministic.

## CI

CI runs backend tests plus frontend tests/build for pushes and PRs.
