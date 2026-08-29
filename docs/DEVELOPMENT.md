# Development workflow

## Working branch

Create short-lived work from the latest `dev`:

- `feature/<task>` for normal work;
- `agent/<task>` for AI-assisted work.

Changes target `dev` through pull requests. `main` is production-ready only.

## Local setup

Typical setup:

```bash
composer install
npm install
php artisan migrate
npm run dev
```

## Verification

Canonical checks:

```bash
php artisan test
npm test
npm run build
```

Use focused tests while implementing, but run broad checks before handoff when shared behavior changes.

## Schema changes

Use Laravel migrations. Do not manually mutate shared schemas.

## API/security

- keep public bootstrap/pairing surfaces intentionally narrow;
- all user data endpoints must resolve the authenticated anonymous user;
- device tokens are credentials, not user identifiers;
- one-time pairing tokens must expire and be single-use;
- shared GPX ingestion must not bypass normal authenticated persistence API;
- validate XML/file boundaries defensively.

## Documentation

Follow `docs/DOCUMENTATION.md`; update current truth in the same branch as the code/decision.
