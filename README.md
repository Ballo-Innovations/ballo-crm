# BalloCRM

**Commercial Operations & B2B CRM Intelligence Platform** — built for the 2026 iHub Innovation
Hackathon, Challenge 2: Commercial Operations Automation & B2B CRM Intelligence Platform.

> Status: **project foundation complete, business features not yet started.** See
> [docs/progress.md](docs/progress.md) for exactly what's done and
> [docs/tasks/sprint-1.md](docs/tasks/sprint-1.md) for what's next.

## Vision

Organizations run their commercial operations across fragmented spreadsheets — separate files
for accounts, pipelines, contracts, and outreach that never agree with each other. BalloCRM
replaces that with a single, AI-augmented system of record for B2B commercial teams: Customer
Information Management, Enterprise Accounts, Sales Pipelines, Contracts, Customer Journey
tracking, Account-Based Marketing, Vertical Sales Indexing, Opportunity Qualification, AI
Commercial Intelligence (via Brutus AI), Cross-sell/Upsell signals, Commercial Analytics, and
Automated Customer Communications — the last of these delivered entirely through our existing
production messaging platform, **BalloAds**, never reimplemented. Full detail:
[docs/vision.md](docs/vision.md).

## Architecture

Next.js 15 (App Router, React Server Components) on Vercel, Firebase (Auth + Firestore) as the
system of record, a strict feature-based layering (`UI -> actions/ -> services/ ->
repositories/ -> Firestore`), and two external integrations called server-side only: BalloAds'
`/v1/developer-portal/*` API for all messaging, and Brutus AI for commercial intelligence. Full
diagrams and rationale: [docs/architecture.md](docs/architecture.md). Every technology choice and
why it was made: [docs/tech-stack.md](docs/tech-stack.md) and [docs/decisions.md](docs/decisions.md).

## Folder structure

```
app/            Next.js App Router routes, layouts, pages
components/     Shared UI — components/ui (shadcn/ui) and components/shared
features/       Self-contained business domains (accounts, opportunities, ...)
lib/            SDK/client integration code (Firebase, BalloAds, Brutus AI)
services/       Business logic composing repositories + external clients
repositories/   The only layer allowed to touch Firestore directly
actions/        Cross-cutting Server Actions ("use server")
store/          Redux Toolkit — client UI state only
providers/      Client-side provider composition root
hooks/          Shared React hooks
types/          Non-schema-derived shared TypeScript types
schemas/        Zod schemas — single source of truth for validated shapes
config/         Env validation (Zod) and site/nav configuration
utils/          Small pure helpers
constants/      App-wide literal constants
styles/         Non-Tailwind global CSS (rarely needed)
docs/           Full documentation set (source of truth — read this first)
```

Every folder above has its own `README.md` explaining its conventions. Full reference:
[docs/folder-structure.md](docs/folder-structure.md).

## Installation

Prerequisites: Node.js 20+, npm, a Firebase project, BalloAds developer-portal credentials,
Brutus AI credentials.

```bash
git clone <repo-url>
cd hackerthon-crm
npm install
cp .env.example .env.local   # fill in Firebase/BalloAds/Brutus values — see docs/environment.md
```

## Local development

```bash
npm run dev          # start the dev server at http://localhost:3000
npm run lint          # ESLint
npm run lint:fix      # ESLint --fix
npm run format        # Prettier --write
npm run format:check  # Prettier --check
npm run typecheck     # tsc --noEmit
npm run build          # production build
```

A pre-commit hook (Husky + lint-staged) runs ESLint/Prettier on staged files automatically. To
run against the Firebase Local Emulator Suite instead of a live project, see
[docs/environment.md](docs/environment.md) and [docs/firestore-rules.md](docs/firestore-rules.md)
(`firebase emulators:start` — ports configured in `firebase.json`).

## Deployment

Vercel for the app, Firebase for Auth/Firestore. Push to a branch for a Preview deployment; merge
to `main` for Production. Full checklist, environment strategy, and rules/index deploy commands:
[docs/deployment.md](docs/deployment.md).

## Team workflow

Documentation-driven development: every feature is documented before or alongside
implementation, every completed task updates [docs/progress.md](docs/progress.md),
[CHANGELOG.md](CHANGELOG.md), and its sprint file. Three developers work Sprint 1 in parallel
with minimal blocking — Infrastructure & Auth, Shell/Design System/Navigation, and Core CRM
Domain. See [docs/sprint-plan.md](docs/sprint-plan.md),
[docs/tasks/developer-1.md](docs/tasks/developer-1.md),
[docs/tasks/developer-2.md](docs/tasks/developer-2.md), and
[docs/tasks/developer-3.md](docs/tasks/developer-3.md). Contribution process, branching, and PR
checklist: [CONTRIBUTING.md](CONTRIBUTING.md).

## Coding standards

Strict TypeScript (no `any`), Server Components first, Server Actions over client fetch, Zod as
the single source of truth for any boundary-crossing shape, one-directional data flow
(`actions/ -> services/ -> repositories/`), small self-contained feature folders so multiple
human and AI contributors can work in parallel without collisions. Full reference:
[docs/coding-standards.md](docs/coding-standards.md) and
[docs/naming-conventions.md](docs/naming-conventions.md).

## Documentation index

Start at [docs/README.md](docs/README.md) for the full, categorized documentation index.

## License

Proprietary — see [LICENSE](LICENSE).
