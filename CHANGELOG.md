# Changelog

All notable changes to BalloCRM are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Every merged PR should add an entry
under `[Unreleased]` in the relevant section (Added / Changed / Fixed / Removed) - see
`CONTRIBUTING.md`.

## [Unreleased]

### Added

- E0-05: role-based access. The security doc's permission matrix is one table in
  `src/lib/rbac.ts` (`can`, `scopeFor`); `requireCan(capability)` and `requireRole` guard server
  actions; `accountReadFilter` limits reps to their team's accounts and `canEditRecord` to their
  own. The nav and command palette show only permitted modules; Settings is admin-only with a
  real 403 page. The session now carries `teamId`; the seed puts the reps in two teams.
- Testing standards for AI-assisted work (`docs/05-qa/01-test-strategy.md`): tests are written
  first from each ticket's acceptance criteria, every criterion maps to a named test in the PR,
  bug fixes start with a failing test. Playwright is set up (`e2e/`, `pnpm test:e2e`) and runs
  on every pull request instead of nightly; each UI ticket adds its own spec. CI gained a
  Postgres service for integration tests (`pnpm test:int`) and a coverage floor on
  `src/modules/**/service.ts` (`pnpm test:coverage`).
- E0-10: seed v0 - the 8 demo users from the seed spec (password `Compass!2026`, demo only), the
  product catalogue and 5 fictional accounts with subscriptions. `pnpm db:seed` and
  `pnpm db:seed --reset` give the same result however often they run.
- E0-04: sign in with email and password (Auth.js credentials, bcrypt, JWT session in an
  httpOnly cookie), the role in the session, sign out from the sidebar, and every route behind
  login except the landing page, `/login`, health, `/sign/*`, `/openapi.json` and webhooks
  (pages redirect to `/login`, the API answers 401). New shared `PillField` form field.
- E0-03: initial Prisma migration (`prisma/migrations/20261125000000_init`) for schema v1, 20 tables
  and 12 enums, plus a test that every model and enum has its migration.
- `docs/01-product/00-goals-and-success-metrics.md`: the Challenge 2 problem statement, seven
  goals with metrics, a project scorecard and a capability-to-ticket coverage table. Tickets gained
  a `Goal` column; forecast definitions added to the dashboards spec.

### Changed

- MinIO image switched to `cgr.dev/chainguard/minio` in both compose files; the official
  `minio/minio` image is no longer published.

- Git workflow: promotion flow `dev` → `stage` → `main` replaces trunk-based. Ticket E0-11
  rewritten for the new hosting; E0-13 (prod host) added.

- Re-scaffolded the repo to match the Compass project kit: code moved under `src/`, one folder
  per module in `src/modules/` (`actions` / `queries` / `service` / `types`), navigation renamed
  to the kit's nine modules with placeholder routes, npm replaced by pnpm.
- Docs replaced by the kit (`docs/00-executive` to `docs/07-dev-setup`); the earlier docs and
  task files moved to `docs/_archive/ballocrm-firebase/`.

### Added

- Environments: dev / stage / prod from the `dev` / `stage` / `main` branches. `Dockerfile`,
  `deploy/` (compose file behind Traefik, deploy and backup scripts), a Deploy workflow (GHCR
  image, SSH deploy, health check) and `GET /api/v1/health`. Nothing is deployed yet.
- Runbook `docs/07-dev-setup/environments-and-deployment.md`, ADR-004 (hosting and backend),
  `docs/04-delivery/06-working-with-claude.md`, shared `.claude/` settings and skills, `.mcp.json`.
- Restricted SSH access for the team: `deploy/host/` (the `ballocrm` host command, forced SSH
  command, sudo rule, admin script). Installed on the dev/staging VM with dev and stage
  databases running.
- `APP_ENV` variable; `db:seed --reset` refuses to run when it is `prod`.

- Prisma schema v1 from the kit (`prisma/schema.prisma`), seed inputs and a seed entry point,
  `docker-compose.yml` (Postgres 16 + MinIO), kit `.env.example`.
- `src/lib` stubs: `db`, `auth` (`requireRole`), `audit` (`withAudit`), `errors`, `llm`, `money`
  (`formatZMW`).
- Vitest and a GitHub Actions CI workflow (lint, typecheck, test, build).

### Removed

- Firebase (Auth, Firestore, rules, indexes), Redux Toolkit, TanStack Query, the session-cookie
  middleware, and the README-only layer folders.

## Earlier foundation (superseded by the re-scaffold above)

### Added

- Project foundation: Next.js 15 (App Router, TypeScript strict) scaffolded with Tailwind CSS v4
  and shadcn/ui (`radix-nova` style), Firebase (client + Admin SDK), Redux Toolkit, TanStack
  Query, React Hook Form + Zod, Recharts, and Lucide icons.
- Feature-based directory structure (`app/`, `components/`, `features/`, `lib/`, `services/`,
  `repositories/`, `store/`, `providers/`, `hooks/`, `types/`, `schemas/`, `actions/`, `config/`,
  `utils/`, `constants/`, `styles/`) with per-folder README conventions.
- Firebase project config: `firestore.rules`, `firestore.indexes.json`, `firebase.json`
  (multi-tenant org-scoped security model).
- Tooling: ESLint + Prettier (with `prettier-plugin-tailwindcss`), Husky pre-commit hook running
  `lint-staged`.
- Full documentation set under `/docs` (vision, architecture, tech stack, database schema,
  Firestore rules/indexes reference, API, integrations, UI design system, routes, folder
  structure, coding standards, naming conventions, deployment, environment, decisions, glossary,
  risks, roadmap) and project management docs under `/docs/tasks` (backlog, Sprint 1–3,
  per-developer assignments, task template).
- Root project files: `.env.example`, `.gitignore`, `CONTRIBUTING.md`, `LICENSE`, GitHub issue
  and PR templates, VS Code workspace settings.
- Deployment: pushed to `github.com/Ballo-Innovations/hackerthon-crm` and connected the Vercel
  project (`ballo-innovations/hackerthon-crm`) via Vercel's native Git integration - pushes to
  `main` now deploy to Production automatically and PRs get automatic Preview deployments. Live
  at https://hackerthon-crm.vercel.app. See `docs/deployment.md`.

### Notes

- No business features (Accounts, Opportunities, Contracts, etc.) are implemented yet by design
  - see `docs/roadmap.md` and `docs/tasks/sprint-1.md` for what ships next.

## [0.1.0] - 2026-07-04

- Repository initialized for the 2026 iHub Innovation Hackathon, Challenge 2.
