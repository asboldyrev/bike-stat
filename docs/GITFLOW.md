# GitFlow strategy

## Branch roles

- `main`: production-ready code only.
- `dev`: integration branch.
- `feature/*`, `agent/*`: short-lived isolated work targeting `dev`.

## Delivery flow

1. branch from latest `dev`;
2. implement and verify;
3. open PR to `dev`;
4. CI passes;
5. repository owner reviews/merges;
6. promote `dev` to `main` deliberately for a release.

Agents do not merge their own branches.

## CI policy

Baseline:

- backend: Composer install + `php artisan test`;
- frontend: `npm ci` + `npm test` + `npm run build`.

## CD policy

Automated deployment is not part of the foundation. Introduce it only with an explicit deployment decision.
