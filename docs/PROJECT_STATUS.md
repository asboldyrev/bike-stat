# Current project status

Last updated: 2026-08-29

## Active roadmap stage

Persistence and manual import — anonymous device authentication.

## Completed stages

### Project foundation

Merged into `dev`:

- repository documentation/source-of-truth structure;
- Vue/Pinia/Router shell;
- frontend smoke tests;
- backend/frontend CI.

### GPX domain

Merged into `dev`:

- defensive GPX parser;
- SuperCycle 3.4.4 compatibility;
- distance/time/speed/elevation statistics;
- deterministic unit/regression coverage.

### Persistence backend

Merged into `dev`:

- activities, original GPX metadata/storage and normalized track points;
- transactional `ImportGpxActivity`;
- per-user SHA-256 duplicate detection;
- persistence feature coverage.

## Current authentication slice

The active branch implements the anonymous device identity model from ADR 0004.

First device:

1. `POST /api/bootstrap`;
2. create an internal anonymous `User`;
3. issue a 256-bit random device credential;
4. return plaintext once;
5. store only SHA-256 in `device_tokens`.

Protected API requests use:

```http
Authorization: Bearer <device-token>
```

`AuthenticateDeviceToken` resolves the owning user, rejects revoked credentials and periodically updates `last_used_at`.

Additional devices:

1. an authenticated device calls `POST /api/pairings`;
2. a separate random pairing credential is issued with a 2-minute expiry;
3. the returned pairing URL keeps the secret in the URL fragment: `/pair#token=...`;
4. the new device calls `POST /api/pairings/redeem`;
5. redemption is transactionally locked and single-use;
6. a new independent device credential is issued for the same user.

Public bootstrap/redeem endpoints and authenticated pairing issuance are rate limited.

The current Laravel user table still contains the framework-default required name/email/password columns. Anonymous bootstrap fills them with non-user-facing technical random values for schema compatibility. They are not authentication credentials and are not exposed in the product. Removing those legacy fields may be done later as an isolated schema cleanup.

## Immediate next work

1. Verify and merge device authentication.
2. Expose protected `POST /api/activities/import` using `ImportGpxActivity`.
3. Add the frontend device-token bootstrap/storage/API client.
4. Build manual GPX import UI.
5. Add activity list/details API and UI.

## Current blockers

None.
