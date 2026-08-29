# Agent instructions

This file is the entry point for AI-assisted work in Bike Stat.

## Required reading before work

Before proposing or implementing a change, read the latest `dev` branch and, in this order:

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/PROJECT_STATUS.md`
4. `docs/ROADMAP.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DEVELOPMENT.md`
7. `docs/TESTING.md`
8. `docs/DOCUMENTATION.md`
9. relevant ADRs in `docs/decisions/`
10. `BACKLOG.md` when the task concerns deferred work

Repository documentation and current `dev` code are the source of truth. Do not rely on an old conversation when they differ.

## Repository workflow

- Never modify `main` as part of agent work.
- Start every task from the latest `dev`.
- Use one short-lived branch per coherent task: `agent/<short-task-name>`.
- Agent branches target `dev`.
- Do not merge agent branches into `dev` or `main`.
- Do not silently include unrelated cleanup.

## Before implementation

- Inspect current code on `dev`.
- Check `docs/PROJECT_STATUS.md` for the active checkpoint and immediate next work.
- Check relevant ADRs before changing an accepted architecture.
- Check `BACKLOG.md` before adding deferred work.
- Review relevant backend/frontend tests before changing protected behavior.

## Verification

Run checks relevant to the change. At minimum consider:

- `php artisan test`;
- `npm test`;
- `npm run build`;
- regression coverage for bug fixes;
- authorization/security tests for protected operations.

Do not claim a check passed unless it was actually run successfully.

## Documentation is part of the change

Update documentation in the same branch when code or accepted decisions change documented project truth. Follow `docs/DOCUMENTATION.md`.

## End-of-task handoff

When work is ready for owner verification:

- state the branch name;
- summarize implemented scope;
- list automated checks actually run and their result;
- list manual checks still needed;
- list documentation updated;
- mention intentional limitations/follow-up;
- do not merge the branch.
