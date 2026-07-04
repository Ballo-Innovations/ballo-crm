# Progress

This is the living, single-source-of-truth tracker for what actually exists in BalloCRM right
now — as opposed to what's planned ([roadmap.md](./roadmap.md)) or scheduled
([sprint-plan.md](./sprint-plan.md)). It is deliberately conservative: nothing is marked
"Completed" here unless it is genuinely built and working in the repo today.

> **Update protocol:** Per [CONTRIBUTING.md](../CONTRIBUTING.md), **every completed task must
> update three things in the same change**: this file (`docs/progress.md`), `docs/changelog.md`,
> and the relevant sprint file in `docs/tasks/` (e.g. `tasks/sprint-1.md` plus the owning
> developer's file). A task is not "done" until all three are updated — an implementation without
> a progress/changelog update is treated as an incomplete PR, not a style nitpick.

## Completed

Foundation/scaffolding work only — no user-facing feature is live yet.

- **Project scaffold**: Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS v4 initialized
  via `create-next-app`, with Geist fonts and metadata wired from `config/site.ts`.
- **shadcn/ui component library** installed using the `radix-nova` style (base color `neutral`,
  icon library `lucide`): `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`,
  `calendar`, `card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `field`, `input`,
  `input-group`, `label`, `navigation-menu`, `pagination`, `popover`, `progress`, `scroll-area`,
  `select`, `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`,
  `tooltip` — components only, not yet composed into an actual app shell.
- **Firebase wiring**: `lib/firebase/client.ts` (browser SDK) and `lib/firebase/admin.ts`
  (Admin SDK, `server-only`-guarded) both configured and reading validated env via
  `config/env.ts`. No Auth flow or Firestore reads/writes are wired to any UI yet.
- **App-level state/data providers**: Redux Toolkit (`store/store.ts`, `store/hooks.ts`,
  `store/slices/ui-slice.ts` — currently just `sidebarCollapsed` and `commandMenuOpen`) and
  TanStack Query, both composed in `providers/app-providers.tsx` alongside `next-themes` and the
  `sonner` toaster.
- **Environment validation**: `config/env.ts` — Zod `clientEnvSchema` / `serverEnvSchema` and the
  `getClientEnv()` / `getServerEnv()` accessors, matching `.env.example` exactly (see
  [environment.md](./environment.md)).
- **Firestore data model foundation**: multi-tenant `firestore.rules` and
  `firestore.indexes.json` covering `users/{uid}` + `organizations/{orgId}/...` subcollections
  and the five-role model (`owner`/`admin`/`manager`/`rep`/`viewer`) — rules only, no application
  code reads/writes these collections yet. See [firestore-rules.md](./firestore-rules.md) and
  [indexes.md](./indexes.md).
- **Tooling**: ESLint 9 + `eslint-config-next` + `eslint-config-prettier`, Prettier +
  `prettier-plugin-tailwindcss`, Husky + lint-staged pre-commit hooks (`npm run lint`,
  `npm run typecheck`, `npm run format` all runnable today).
- **Full `/docs` documentation set** written (this pass): architecture, tech stack, database
  schema, Firestore rules, indexes, API conventions, integrations, UI design system, routes,
  folder structure, coding standards, naming conventions, deployment, environment, decisions,
  glossary, changelog, risks, roadmap, sprint plan, and task-tracking scaffolding under
  `docs/tasks/`.
- **GitHub templates and VS Code workspace config** (`.github/`, `.vscode/`) for consistent PR/
  issue structure and shared editor settings across contributors.
- **Repository pushed and deployed**: code lives at
  [github.com/Ballo-Innovations/hackerthon-crm](https://github.com/Ballo-Innovations/hackerthon-crm)
  (`main`), and the Vercel project (`ballo-innovations/hackerthon-crm`) is connected via Vercel's
  native Git integration — pushes to `main` deploy to Production automatically, PRs get Preview
  deployments automatically. Live at **https://hackerthon-crm.vercel.app**. No environment
  variables are set on Vercel yet, so this is the foundation landing page only — see
  [deployment.md](./deployment.md#current-status).

## In Progress

None — Sprint 1 has not yet started. All work above is pre-Sprint-1 scaffolding; no developer has
begun a Sprint 1 task as of this writing.

## Blocked

Nothing is hard-blocked. One soft dependency to watch: the exact **BalloAds
`/v1/developer-portal/*` API contract** (endpoints, payload shapes, auth header format, rate
limits) is not yet confirmed, so [integrations.md](./integrations.md) marks those sections "to be
confirmed." This doesn't block Sprint 1 (auth, shell, Accounts CRUD have no BalloAds dependency)
but will block real BalloAds client code (`lib/balloads/`, planned for Phase 2) until resolved —
tracked as risk R2 in [risks.md](./risks.md).

## Pending

Everything in [sprint-plan.md](./sprint-plan.md) and [tasks/sprint-1.md](./tasks/sprint-1.md):

- **Auth flow** (Developer 1): `/login` route, Firebase Auth sign-in, session cookie issuance,
  and real token verification in Server Components/Actions (today `middleware.ts` only checks
  for the _presence_ of a `__session` cookie — it does not verify it, since the Edge runtime
  can't run the Admin SDK).
- **Dashboard shell** (Developer 2): sidebar/topbar/breadcrumbs actually rendering
  `config/site.ts`'s `primaryNav` (currently config-only, no UI consumes it yet).
- **Accounts CRUD** (Developer 3): the first real feature under `features/accounts/`, proving the
  repository → service → action → UI pattern end to end with Create/Read against Firestore.

Beyond Sprint 1, everything scheduled in [tasks/sprint-2.md](./tasks/sprint-2.md) and
[tasks/sprint-3.md](./tasks/sprint-3.md) — Opportunities, Contracts, Customer Journey lifecycle
tracking, and the first read-only BalloAds integration — remains pending and unstarted.

## Technical Debt

- **No test framework installed** (no Jest, Vitest, or Playwright; `package.json` has no `test`
  script). Flagged as risk R1 in [risks.md](./risks.md); roadmap requires closing this at the
  start of Phase 2 (see [roadmap.md](./roadmap.md#known-gaps-to-close-early)).
- **No lint/typecheck/build gate** (no GitHub Actions workflows exist yet — Vercel deploys on
  every push regardless of lint/typecheck state; those checks are run manually today). Also part
  of risk R1 in [risks.md](./risks.md); see
  [deployment.md](./deployment.md#no-lint-typecheck-build-gate-yet) for the recommended first
  workflow.

## Future Enhancements

Product-mission capabilities that are real goals but not yet scheduled in Sprint 1-3 — see the
full sequencing in [roadmap.md](./roadmap.md):

- **Account-Based Marketing (ABM)** — account targeting lists and coordinated outreach through
  BalloAds (Phase 4).
- **Vertical Sales Indexing** — segmenting Accounts/Opportunities/analytics by industry vertical
  as a first-class dimension (Phase 4).
- **Full AI Commercial Intelligence suite** — next-best-action recommendations, account/contact
  summarization, and natural-language commercial analytics beyond the initial Opportunity
  Qualification scoring assist (Phase 3, with the richer suite maturing into Phase 4).
- **Enterprise hardening** — granular field/record-level permissions beyond the five base roles,
  audit-log completeness review, and a full WCAG 2.1 AA accessibility audit pass (Phase 5).
