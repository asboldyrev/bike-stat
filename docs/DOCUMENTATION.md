# Documentation maintenance policy

Repository docs describe current project truth, not a chronological changelog. Git history and PRs are the history.

## Source-of-truth map

- `AGENTS.md`: AI-assisted workflow rules.
- `docs/PROJECT_CONTEXT.md`: stable product/technical context.
- `docs/PROJECT_STATUS.md`: current checkpoint, next work and blockers.
- `docs/ROADMAP.md`: major stage order/status.
- `docs/ARCHITECTURE.md`: current system structure and boundaries.
- `docs/DEVELOPMENT.md`: practical local/workflow conventions.
- `docs/TESTING.md`: test strategy and regression expectations.
- `docs/GITFLOW.md`: branch, PR, CI/CD policy.
- `BACKLOG.md`: accepted deferred work.
- `docs/decisions/*.md`: durable architectural/product-engineering decisions.

## Update rules

Update a document only when the information it owns changes.

Create an ADR when a decision has meaningful alternatives, changes a trust/data boundary, significantly constrains future implementation, or is likely to be re-debated.

Accepted ADRs are historical records. Supersede rather than rewriting the past.

## End-of-task documentation check

Ask whether the change altered:

1. current checkpoint;
2. architecture/boundaries;
3. a durable decision;
4. deferred work;
5. development/testing/Git/CI policy;
6. stable product scope.

Update only the responsible documents.
