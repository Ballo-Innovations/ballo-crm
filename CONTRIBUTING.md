# Contributing to BalloCRM

Work comes from the ticket list in `docs/04-delivery/03-tickets.csv`. Every PR closes one ticket.

## Before you write code

1. Read `AGENTS.md` and the spec your ticket points at.
2. Restate the ticket's acceptance criteria before starting.
3. Stay inside your module folder (`src/modules/<name>/`) unless the ticket says otherwise.
   Ownership: `src/modules/README.md` and `docs/04-delivery/01-team-and-roles.md`.

## Git workflow

Full rules: `docs/04-delivery/05-git-workflow.md`.

- Short-lived branches `feat/<ticket-id>-slug` from `dev`, squash-merged to `dev`.
- `dev` → `stage` → `main` by promotion PR; each branch deploys to its own environment
  (`docs/07-dev-setup/environments-and-deployment.md`).
- Coding with Claude: `docs/04-delivery/06-working-with-claude.md`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Migrations only via `pnpm db:migrate --name <slug>`; never edit a committed migration.
- `pnpm db:seed --reset` must always work on a fresh database.

## Definition of done

`docs/04-delivery/04-definition-of-done.md`. In short: one review, zod + `withAudit` +
`requireRole` on every server action, unit tests for any computation in `service.ts`, loading /
empty / error states, works at 390px, seed data exercises it, CI green.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same four on every PR.
