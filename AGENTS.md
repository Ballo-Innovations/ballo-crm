# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# BalloCRM (kit codename: Compass)

## What this is

A B2B CRM and commercial intelligence platform for the iHub Hackathon 2026, Challenge 2, built
for Infratel. Specs live in `/docs` (copied from the Compass project kit, which calls the product
"Compass" - same product, our name is BalloCRM). Read `docs/01-product/01-PRD.md`,
`docs/01-product/02-scoring-and-grading-spec.md` and `docs/02-architecture/01-architecture.md`
before any non-trivial change.

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

Work ticket by ticket from `docs/04-delivery/03-tickets.csv`. Before starting one, restate its
acceptance criteria. After finishing, run `pnpm typecheck && pnpm test` and summarise what
changed.
