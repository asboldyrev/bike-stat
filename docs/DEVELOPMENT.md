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

- keep public bootstrap/pairing surfaces intentionally narrow and rate limited;
- all user data endpoints must use the `device.auth` middleware and resolve the anonymous user from its Bearer credential;
- device token plaintext is returned only on issuance; persist only SHA-256 hashes;
- device tokens are credentials, not user identifiers;
- pairing tokens are a separate credential type, expire after two minutes and are single-use;
- pairing links keep the secret in the URL fragment rather than the query string;
- shared GPX ingestion must not bypass normal authenticated persistence API;
- validate XML/file boundaries defensively.

## Documentation

Follow `docs/DOCUMENTATION.md`; update current truth in the same branch as the code/decision.
