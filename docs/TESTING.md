# Testing strategy

## Backend

Laravel tests live under `tests/Feature` and `tests/Unit`.

Use feature tests for API/auth/persistence/security boundaries and unit tests for pure GPX/statistics behavior.

Run:

```bash
php artisan test
```

## Frontend

Frontend behavioral tests live under `tests/frontend` and use Vitest, Vue Test Utils and jsdom.

Run:

```bash
npm test
npm run test:watch
```

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

CI should run backend tests plus frontend tests/build for pushes and PRs.
