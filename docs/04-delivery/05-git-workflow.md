# Git & CI Workflow

- Trunk-based: short-lived branches `feat/<ticket-id>-slug`, squash-merge to `main`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`).
- PR template: what / why / screenshot / ticket / test notes.
- CI (GitHub Actions): `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; on `main` → deploy.
- Migrations: only via `prisma migrate dev --name <slug>`; never edit a committed migration.
- Seed: `pnpm db:seed --reset` must always work on a fresh DB.
- Freeze: 24h before submission only `fix:` commits with a second reviewer.
- Tag the submission commit `v1.0-hackathon`.
