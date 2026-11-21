# Git & CI Workflow

## Branches

| Branch  | Deploys to | Receives                                  | Merge style  |
| ------- | ---------- | ----------------------------------------- | ------------ |
| `dev`   | dev        | ticket branches                           | squash       |
| `stage` | stage      | `dev`, by promotion PR                    | merge commit |
| `main`  | prod       | `stage`, by promotion PR; urgent hotfixes | merge commit |

- Ticket branches are short-lived and start from `dev`: `feat/<ticket-id>-slug` (also `fix/`,
  `chore/`, `docs/`, `test/`). One ticket per branch, one branch per PR.
- All three long-lived branches are protected: pull request and green CI required; no direct or
  force pushes. An approval is not required, because the deadline is close: the author may merge
  their own PR once CI is green and they have read the whole diff. Ask for a review anyway when
  the change touches `prisma/schema.prisma`, `src/lib/`, scoring, auth or `deploy/`.
- **Promotion:** Dev C opens `dev` → `stage` at the end of each day once dev is healthy.
  `stage` → `main` happens after the QA checklist passes on stage, and needs the prod approver.
  Promotion PRs use a merge commit, never squash, so the three branches keep the same history.
- **Hotfix:** branch `fix/<slug>` from `main`, PR to `main`, then merge `main` back into `stage`
  and `dev` the same day.

## Commits and PRs

- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). The squash title is the
  ticket's commit message: `feat(pipeline): kanban weighted totals (E1-04)`.
- PR template: what / why / screenshot / ticket / test notes.
- Add a line to `CHANGELOG.md` under `[Unreleased]`.

## CI and deploys

- Every PR: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm test:int && pnpm build && pnpm test:e2e`.
- Every push to `dev`, `stage` or `main`: the same checks, then image build and deploy to that
  branch's environment. See `docs/07-dev-setup/environments-and-deployment.md`.

## Database

- Migrations: only via `prisma migrate dev --name <slug>`; never edit a committed migration.
  Deployed environments only ever run `prisma migrate deploy`.
- Seed: `pnpm db:seed --reset` must always work on a fresh DB. It is blocked on prod.

## Release

- Freeze: 24h before submission only `fix:` commits with a second reviewer.
- Tag the submission commit on `main` as `v1.0-hackathon`.
