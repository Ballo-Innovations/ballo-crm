# BalloCRM

**Commercial Operations & B2B CRM Intelligence Platform** for the 2026 iHub Innovation Hackathon,
Challenge 2, built for Infratel. One place for every account, deal, contract and engagement, with
an intelligence layer that says which opportunities to work, what to sell next, and why.

> Status: **scaffold only.** The repo is aligned with the Compass project kit (stack, folder
> layout, data model, docs, tickets). No business feature is built yet - every module route is a
> placeholder. Work is assigned from [docs/04-delivery/03-tickets.csv](docs/04-delivery/03-tickets.csv).

The kit calls the product "Compass"; it is the same product as BalloCRM.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind + shadcn/ui · Prisma + PostgreSQL 16 ·
Auth.js · Recharts · dnd-kit · @react-pdf/renderer + pdf-lib · MinIO (S3) · Vitest · Playwright ·
pnpm. Rationale: [ADR-001](docs/02-architecture/adr/ADR-001-stack.md).

## Getting started

Prerequisites: Node.js 22+, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d      # Postgres + MinIO
pnpm db:migrate           # create the schema
pnpm db:seed              # product catalogue only, until E0-10
pnpm dev                  # http://localhost:3000
```

Other commands: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` · `pnpm db:studio`.

## Layout

```
src/
  app/              routes: / (landing) and the 9 module routes under (app)/
  modules/          one folder per module, each with actions / queries / service / types
  lib/              db, auth, audit, errors, env, money, llm, site nav
  components/ui/    shadcn primitives
prisma/             schema.prisma, seed.ts, seed/*.json
mock-integrations/  mock SMS / telephony / ERP / eSPF service (not built yet)
docs/               the project kit: specs, architecture, tickets, QA, pitch
```

Module ownership: [src/modules/README.md](src/modules/README.md).

## Docs

Start at [docs/README.md](docs/README.md). Conventions for contributors and AI agents:
[AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Proprietary - see [LICENSE](LICENSE).
