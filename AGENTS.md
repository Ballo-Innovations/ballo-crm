# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# BalloCRM (kit codename: Compass)

## What this is

A B2B CRM and commercial intelligence platform for the iHub Hackathon 2026, Challenge 2, built
for Infratel. The problem, the seven goals and how each is measured are in
`docs/01-product/00-goals-and-success-metrics.md`; every ticket names the goal it serves. Work
that serves no goal is out of scope. Specs live in `/docs` (copied from the Compass project kit, which calls the product
"Compass" - same product, our name is BalloCRM). Read `docs/01-product/01-PRD.md`,
`docs/01-product/02-scoring-and-grading-spec.md` and `docs/02-architecture/01-architecture.md`
before any non-trivial change.

## Where the context lives

| Need                                   | Read                                                |
| -------------------------------------- | --------------------------------------------------- |
| Problem, goals, metrics                | `docs/01-product/00-goals-and-success-metrics.md`   |
| Requirements and coverage              | `docs/01-product/01-PRD.md` and the specs beside it |
| Tickets (acceptance criteria and goal) | `docs/04-delivery/03-tickets.csv`                   |
| Definition of done                     | `docs/04-delivery/04-definition-of-done.md`         |
| Branches, PRs, promotion               | `docs/04-delivery/05-git-workflow.md`               |
| Team rules for AI-assisted work        | `docs/04-delivery/06-working-with-claude.md`        |
| Environments, deploys, server access   | `docs/07-dev-setup/environments-and-deployment.md`  |
| Data model, API, security              | `docs/02-architecture/`                             |
| Design system and wireframes           | `docs/03-design/`                                   |

`CLAUDE.md` imports this file, so Claude Code loads it in every session; other agents read
`AGENTS.md` directly. Shared permissions are in `.claude/settings.json`, shared skills
(`/start-ticket`, `/pre-pr`) in `.claude/skills/`, shared MCP servers in `.mcp.json`.

`docs/_archive/` holds the earlier Firebase-based plan. It is superseded - do not follow it.

## Stack (do not change)

Next.js 15 App Router · TypeScript strict · Tailwind + shadcn/ui · Prisma + PostgreSQL 16 ·
Auth.js · Recharts · dnd-kit · @react-pdf/renderer + pdf-lib · MinIO (S3) · Vitest · Playwright ·
pnpm.

Only part of this is installed so far; each ticket adds what it needs from this list. Ask before
adding anything that is not on it.

## Commands

`pnpm dev` · `pnpm db:migrate` · `pnpm db:seed --reset` · `pnpm test` · `pnpm lint` ·
`pnpm typecheck` · `docker compose up`

## Conventions

- Modules under `src/modules/<name>/{actions,queries,service,types}.ts`. Business logic only in
  `service.ts` as pure functions; tests next to them.
- Every mutating server action: `requireRole([...])` → zod parse → `withAudit(...)`.
- Money is integer ngwee; format with `formatZMW`. Dates UTC in DB; display Africa/Lusaka.
- Enums come from Prisma; never string-literal a stage/grade/role.
- UI: shadcn components only; dark theme tokens from `docs/03-design/01-design-system.md`; detail
  views open in the right Drawer, not a new page.
- Loading, empty, error states are mandatory on every list/page.
- No `any`. No console.log in committed code.

## Environments & branches

- One backend: this Next.js app (server actions + REST under `/api/v1`). No separate service.
  `api.<app host>/v1/...` is a proxy route to `/api/v1/...` (ADR-004).
- `dev` → dev, `stage` → stage, `main` → prod. Branch from `dev`, open PRs against `dev`. Never
  push to or open a ticket PR against `stage` or `main`; never merge a PR yourself.
- Hosts are reached only through the restricted `ballocrm` command
  (`ssh crm-<name>@<host> <env> <action>`); it is the only way to touch a deployed environment.
- Deploys happen through `.github/workflows/deploy.yml` only. Do not SSH to a host, run the
  Deploy workflow or change `deploy/` unless the developer asks for exactly that in this session.
- Deployed databases only get `prisma migrate deploy`. Never run `db:seed --reset` or
  `prisma migrate dev` against anything but a local database.
- Never read, print or commit `.env` files or secrets. New variables go in `.env.example`,
  `deploy/.env.example` and `src/lib/env.ts` together.
- `GET /api/v1/health` must stay public.
- Runbook: `docs/07-dev-setup/environments-and-deployment.md`. Team rules for AI-assisted work:
  `docs/04-delivery/06-working-with-claude.md`.

## Scoring & recommender

Implement exactly per spec. The worked example (Negotiate, committee 0.7, engagement 60 →
58/GOLD) is a unit test and must pass. Rules and modifiers are tables in code, not scattered ifs.

## LLM

Server-only via `src/lib/llm.ts`. Every call cached in `AiArtifact`. If `ANTHROPIC_API_KEY` is
missing, return the template fallback - never throw.

## Reference repos (read-only inspiration)

`/reference/twenty`, `/reference/espocrm`, `/reference/atomic-crm` may be cloned locally
(gitignored). Use them to understand data models and UX patterns. **Never copy code from them.**
Write our own implementation.

## Definition of done

See `docs/04-delivery/04-definition-of-done.md`. Ask before adding dependencies.

## Working style

Work ticket by ticket from `docs/04-delivery/03-tickets.csv`, one ticket per session and branch
(`/start-ticket <id>`). Before starting one, restate its acceptance criteria and the goal it serves. Stay inside the
ticket's module; ask before changing `prisma/schema.prisma`, `src/lib/`, CI or `deploy/`. After
finishing, run `pnpm typecheck && pnpm test` and summarise what changed.
