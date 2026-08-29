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

## GPX upload runtime limits

The application accepts GPX uploads up to 10 MiB. PHP must allow the HTTP request to reach Laravel before the Laravel validation rule can enforce that limit.

Deployment PHP configuration must therefore have at least:

```ini
upload_max_filesize = 10M
post_max_size = 12M
```

Using `post_max_size = 16M` is recommended to leave comfortable multipart overhead.

These settings are PHP runtime/deployment configuration, not Laravel `.env` settings. After changing PHP-FPM/Apache PHP configuration, restart/reload the relevant PHP/web-server process.

If an otherwise valid GPX returns `The file failed to upload.`, inspect the active web SAPI configuration rather than only CLI PHP:

```bash
php -i | grep -E 'upload_max_filesize|post_max_size'
```

CLI values may differ from PHP-FPM/Apache values, so confirm the configuration used by the web request in the deployment environment.

Reverse proxies may have their own body-size limit as well (for example Nginx `client_max_body_size`), which must also be at least the application upload limit.

## Frontend product constraints

Bike Stat is mobile-first.

For every user-facing MVP change:

- design the narrow-screen/touch interaction first;
- avoid layouts that only become usable at desktop widths;
- keep primary actions reachable and obvious on phones;
- use touch-friendly controls and spacing;
- verify dense metric/card layouts do not overflow or become unreadable on narrow screens;
- desktop presentation should enhance, not redefine, the interaction model;
- primary mobile navigation must remain reachable without scrolling and must respect safe-area insets;
- service routes such as `/pair` must not accidentally trigger first-run identity bootstrap before their own credential flow completes.

Bulk GPX import must be implemented as a first-class MVP workflow rather than a desktop-only convenience. It should support multiple selected files, independent per-file results, and partial success.

## PWA runtime requirements

Service workers and installable PWA acceptance require a secure origin in deployed environments.

Use HTTPS for phone/staging/production verification. Local development may use browser-supported localhost/loopback exceptions.

The production build exposes `/build/manifest.json`; the Bike Stat service worker reads that manifest during install to cache the current Vite app-shell assets. Deployment must therefore publish the complete `public/build` directory together with `public/sw.js`, `public/manifest.webmanifest` and `public/icons`.

Keep the service-worker registration URL stable (`/sw.js`) and bypass HTTP caching for update checks. Do not version the worker registration with the Vite bundle hash: that previously caused persistent waiting-worker prompts/reload loops.

Do not enable automatic `skipWaiting` without revisiting the update UX: current behavior intentionally requires explicit user confirmation so an active bulk import is not interrupted by a deployment.

API responses and OpenStreetMap tiles are not part of the PWA baseline cache.

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
