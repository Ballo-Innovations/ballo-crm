# BalloCRM - Project Brief (Internal Context Doc)

> This file is the canonical brief for anyone (human or AI agent) writing documentation, code,
> or tasks for BalloCRM. If a generated document contradicts this brief, this brief wins.
> Do not delete this file - it is the seed context for all `/docs` content.

## 1. Identity

- **Name:** BalloCRM
- **Tagline:** Commercial Operations & B2B CRM Intelligence Platform
- **Event:** 2026 iHub Innovation Hackathon
- **Challenge:** Challenge 2 - Commercial Operations Automation & B2B CRM Intelligence Platform
- **Parent company asset:** BalloAds - an existing, production C#/.NET messaging platform with SMS,
  WhatsApp, Email, developer APIs, and its own authentication. BalloCRM is a **new, separate**
  Next.js application. It does not fork, embed, or reimplement BalloAds.

## 2. Product Mission

Replace fragmented spreadsheets with centralized commercial intelligence for B2B sales and
account teams. In scope:

- Customer Information Management (CIMS)
- Enterprise Accounts
- Sales Pipelines
- Contracts
- Customer Journey (lifecycle stages, not BalloAds' messaging "Journeys" feature - see §5 note)
- Account-Based Marketing (ABM)
- Vertical Sales Indexing (segmenting accounts/opportunities by industry vertical)
- Opportunity Qualification (structured scoring, e.g., BANT/MEDDIC-style fields)
- AI Commercial Intelligence (Brutus AI-generated insights, next-best-action, summarization)
- Cross-selling / Upselling signals
- Commercial Analytics (dashboards, pipeline velocity, forecasting)
- Automated Customer Communications (triggered **through** BalloAds, never reimplemented)

## 3. Explicit Non-Goals

- Do **not** build SMS/WhatsApp/Email sending, delivery, or template rendering infrastructure.
- Do **not** build a second authentication system for messaging - BalloAds auth stays inside
  BalloAds. BalloCRM has its own Firebase Auth for CRM users, and calls BalloAds as a service
  using developer API credentials scoped per organization.
- Do **not** duplicate BalloAds' journey/automation engine. If a CRM workflow needs to send a
  message, it calls BalloAds APIs; it does not implement its own SMS/WhatsApp delivery loop.

## 4. Tech Stack (authoritative - do not substitute)

| Layer                      | Choice                                                                         |
| -------------------------- | ------------------------------------------------------------------------------ |
| Framework                  | Next.js 15, App Router, React Server Components, TypeScript (strict, no `any`) |
| Styling                    | Tailwind CSS, shadcn/ui, Lucide Icons                                          |
| Charts                     | Recharts                                                                       |
| Auth                       | Firebase Authentication                                                        |
| Database                   | Firebase Firestore                                                             |
| Hosting                    | Vercel                                                                         |
| Messaging                  | BalloAds Developer APIs only (`/v1/developer-portal/*`)                        |
| AI                         | Brutus AI                                                                      |
| Client state               | Redux Toolkit                                                                  |
| Server cache/data fetching | TanStack Query                                                                 |
| Validation                 | Zod                                                                            |
| Forms                      | React Hook Form (+ `@hookform/resolvers/zod`)                                  |
| Lint/Format                | ESLint, Prettier                                                               |
| Git hooks                  | Husky (+ lint-staged)                                                          |

## 5. BalloAds Integration Contract

BalloCRM integrates with BalloAds **exclusively** through `/v1/developer-portal/*` REST
endpoints, using per-organization developer API keys stored encrypted in Firestore
(`organizations/{orgId}/integrations/balloAds`). All calls are server-side (Route Handlers /
Server Actions) - the developer API key must never reach the browser.

Known real-world BalloAds CRM-adjacent backend concepts (from BalloAds internal engineering
notes - useful for realistic modeling of what data the API can plausibly expose; BalloCRM does
not reimplement any of this, it only _consumes_ the outputs where an API surface exists):

- **Health Score**: BalloAds computes a per-company `HealthScore` (0-100, default 50) from a
  weighted model - activity recency (40), credit runway (20), payment reliability (20), campaign
  cadence (10), sender verification/platform readiness (10) - with a `HealthScoreBreakdownJson`
  for auditability. BalloCRM's Accounts feature should treat an externally-supplied health score
  as an optional enrichment field surfaced from BalloAds, not something BalloCRM calculates
  itself.
- **Journeys / triggers**: BalloAds has its own automation engine (`new_signup`,
  `payment_failed`, `plan_upgraded`, `plan_downgraded`, `credits_low`, `inactive_30d`, etc.)
  driving SMS/email/WhatsApp sends. BalloCRM's "Customer Journey" concept (lifecycle stage
  tracking for a CRM Account/Contact) is a **distinct, CRM-native concept** and must not be
  confused with BalloAds Journeys in naming or data model. Where BalloCRM wants to _trigger_ a
  BalloAds journey/campaign (e.g., "send onboarding sequence" from a CRM opportunity stage
  change), it does so by calling the relevant `/v1/developer-portal/*` endpoint, and logs the
  call as a CRM Activity.
- **Opt-outs and delivery status**: BalloAds tracks opt-outs and message logs per company per
  channel. BalloCRM should read delivery/opt-out status back via the developer API to display
  in the Contact/Account timeline, not maintain its own opt-out ledger.

Treat all of the above as **illustrative of realistic BalloAds capabilities**, not as a
guaranteed live API contract - `docs/integrations.md` should mark exact endpoint paths/payloads
as "to be confirmed against the live BalloAds developer-portal API reference" wherever the
hackathon has not yet supplied the OpenAPI spec.

## 6. AI Layer - Brutus AI

Brutus AI is BalloCRM's AI provider for: opportunity qualification scoring, next-best-action
recommendations, account/contact summarization, cross-sell/upsell signal detection, and
natural-language commercial analytics ("ask a question about your pipeline"). Model AI work as
async **AI Jobs** (Firestore-tracked: `queued -> running -> completed|failed`) invoked from
Server Actions, never as long-lived client-side streaming unless a specific UI needs it (e.g., a
chat-style assistant panel).

## 7. Architecture Principles

- **Feature-based architecture.** Each business capability (accounts, opportunities, contracts,
  campaigns, etc.) is a self-contained folder under `features/<feature>/` with its own
  components, hooks, schemas, and server actions. Cross-feature reuse goes through `lib/`,
  `components/` (shared UI), or `services/`.
- **Server Components first.** Client Components (`"use client"`) only where interactivity,
  browser APIs, or React state/hooks require it.
- **Server Actions preferred** over client-side fetch to internal APIs. Route Handlers are used
  for webhooks (BalloAds callbacks) and anything a third party calls into.
- **Repository pattern** for Firestore access: `repositories/` contains all direct
  `firebase/firestore` calls; `services/` contains business logic that composes repositories;
  `actions/` are the thin Server Action entry points feature UI calls. UI code never imports
  Firestore directly.
- **Strict typing.** No `any`. Zod schemas in `schemas/` are the single source of truth for a
  shape; TypeScript types are inferred from Zod (`z.infer<...>`) wherever the shape is
  user-supplied or crosses a boundary (form input, API payload, Firestore document).
- **AI-agent-friendly repo.** Small files, self-contained features, no god-files, everything
  documented in `/docs` before or alongside implementation, task ownership tracked in
  `/docs/tasks` so multiple contributors (human or AI) can work in parallel without collisions.

## 8. UI Direction

Enterprise SaaS, minimal, professional, fast, responsive, accessible (WCAG 2.1 AA target).
Visual/interaction inspiration: Salesforce, HubSpot, Linear, Stripe Dashboard, Vercel Dashboard,
Notion, Retool. Prefer information density appropriate for power users (tables, inline edit,
keyboard shortcuts) over consumer-app whitespace-heavy layouts, while keeping typography and
spacing consistent via the design system in `docs/ui-design-system.md`.

## 9. Documentation-Driven Development

Documentation is the source of truth. Every feature is documented in `/docs` before or alongside
implementation. Every completed task updates `docs/progress.md`, `docs/changelog.md`, and the
relevant sprint file in `docs/tasks/`. Do not let code and docs diverge - if you change a
Firestore schema, contract, or route, update the corresponding doc in the same change.

## 10. Team Shape (Sprint 1)

Three developers working in parallel, minimal blocking:

- **Developer 1 - Infrastructure & Auth**: repo tooling, Firebase project setup, Firebase Auth,
  environment/config, CI basics.
- **Developer 2 - Shell, Design System & Navigation**: app shell, layout, nav, shadcn/ui
  component library setup, dashboard shell, reusable components.
- **Developer 3 - Core CRM Domain**: Accounts, Opportunities, Contracts data model + first CRUD
  screens.

Sprint 1 goal: a deployable skeleton - auth works, shell renders, one CRM entity (Accounts) has
working Create/Read against Firestore - proving the full stack end to end.

## 11. Actual Scaffolded State (ground truth - describe this, don't invent alternatives)

This section is authoritative for anything a doc needs to say about what already exists. If a
doc contradicts this section, fix the doc.

### Repo root

```
.env.example          firebase.json            package.json
.github/              firestore.indexes.json   postcss.config.mjs
.gitignore            firestore.rules          providers/            (app-providers.tsx)
.husky/               hooks/                   public/
.prettierignore       lib/                     README.md
.prettierrc.json      LICENSE                  repositories/
.vscode/              middleware.ts            schemas/
actions/              next.config.ts           services/
AGENTS.md             next-env.d.ts            store/                (store.ts, hooks.ts, slices/)
app/                  package-lock.json        styles/
CHANGELOG.md          CONTRIBUTING.md          tsconfig.json
CLAUDE.md             components.json          types/
components/           config/                  utils/
constants/            docs/
features/
```

Every top-level folder above (except `app/`, `public/`, `.github/`, `.vscode/`, `.husky/`,
`docs/`) contains a `README.md` explaining its convention - treat those as authoritative for
`docs/folder-structure.md` and `docs/coding-standards.md`, don't re-derive the rules from
scratch.

`AGENTS.md`/`CLAUDE.md` at the repo root are auto-generated by `create-next-app` and contain only
a Next.js-version warning for AI agents reading stale training data - they are not BalloCRM's
coding standards doc (that's `docs/coding-standards.md`).

### Installed dependencies (package.json, already installed - do not re-suggest installing these)

Runtime: `next@15.5.20`, `react@19.2.4`, `react-dom@19.2.4`, `firebase@^12` (client SDK),
`firebase-admin@^14` (server SDK), `server-only`, `@reduxjs/toolkit`, `react-redux`,
`@tanstack/react-query` + `@tanstack/react-query-devtools`, `react-hook-form`,
`@hookform/resolvers` (zod resolver), `zod@^4`, `recharts`, `lucide-react`, `date-fns`, `sonner`
(toasts), `next-themes` (dark mode), `radix-ui`, `class-variance-authority`, `clsx`,
`tailwind-merge`, `cmdk`, `react-day-picker`, `tw-animate-css`.

Dev tooling: `typescript`, `tailwindcss@^4` + `@tailwindcss/postcss`, `eslint@^9` +
`eslint-config-next@15` + `eslint-config-prettier`, `prettier` + `prettier-plugin-tailwindcss`,
`husky`, `lint-staged`.

### shadcn/ui

`components.json` uses style **`radix-nova`** (Radix UI primitives - not the newer experimental
`@base-ui/react`-based `base-nova` style - chosen for stability and ecosystem familiarity),
base color `neutral`, icon library `lucide`. Installed components in `components/ui/`: `alert`,
`alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `checkbox`,
`command`, `dialog`, `dropdown-menu`, `field` (the current shadcn form-building primitive -
`FieldSet`/`FieldGroup`/`FieldLabel`/etc., used with `react-hook-form` directly; there is no
separate legacy `Form`/`FormField` wrapper component in this shadcn version), `input`,
`input-group`, `label`, `navigation-menu`, `pagination`, `popover`, `progress`, `scroll-area`,
`select`, `separator`, `sheet`, `skeleton`, `sonner` (toast renderer), `switch`, `table`, `tabs`,
`textarea`, `tooltip`. Add more with `npx shadcn@latest add <name>`.

### App/config wiring already in place

- `app/layout.tsx` - root layout, Geist fonts, wraps `{children}` in `<AppProviders>`, metadata
  from `config/site.ts`.
- `app/page.tsx` - foundation landing placeholder (not a real dashboard) pointing at `/docs`.
- `providers/app-providers.tsx` - composition root: Redux `Provider` (store built per-render via
  `makeStore()`, not a module singleton), `QueryClientProvider`, `next-themes` `ThemeProvider`
  (class-based, system default), `sonner` `Toaster`, React Query Devtools in development only.
- `store/store.ts` + `store/hooks.ts` + `store/slices/ui-slice.ts` - Redux Toolkit wired for
  client UI state only (currently: `sidebarCollapsed`, `commandMenuOpen`).
- `lib/firebase/client.ts` - browser Firebase app/auth/firestore, reads `config/env.ts`
  `getClientEnv()`.
- `lib/firebase/admin.ts` - Admin SDK app/auth/firestore, guarded by `server-only`, reads
  `config/env.ts` `getServerEnv()`.
- `config/env.ts` - Zod-validated client and server env schemas.
- `config/site.ts` - `siteConfig` (name/tagline/description) and `primaryNav` (Dashboard,
  Accounts, Contacts, Opportunities, Contracts, Campaigns, Analytics, Settings) - nav items exist
  as config only, the shell/sidebar UI that renders them has not been built yet (Sprint 1,
  Developer 2).
- `middleware.ts` - checks for a `__session` cookie on non-public paths and redirects to
  `/login` if absent; does **not** verify the token (Edge runtime can't run the Admin SDK) -
  real verification must happen in the Server Component/Action behind the gate. `/login` route
  itself does not exist yet (Sprint 1, Developer 1 task).
- `firestore.rules` / `firestore.indexes.json` / `firebase.json` - multi-tenant model:
  `users/{uid}` (top-level, holds `orgId` + `role`) and `organizations/{orgId}/...` subcollections
  for `accounts`, `contacts`, `opportunities`, `tasks`, `contracts`, `campaigns`, `activities`,
  `notifications`, `auditLogs`, `aiJobs`, `templates`, `analyticsCache`, `settings`,
  `integrations` (BalloAds/Brutus credentials, server-only - `allow read, write: if false` in
  rules, all access via Admin SDK). Roles used in rules: `owner`, `admin`, `manager`, `rep`,
  `viewer`. Note: there is **no separate `timeline` collection** - "Customer Journey"/timeline
  views are a query over `activities` filtered by `relatedTo.type` + `relatedTo.id` (composite
  index already defined), to avoid dual-writing the same event twice. Document this as a
  deliberate decision in `docs/decisions.md`, and make `docs/database-schema.md` describe
  `activities` as serving both the audit trail and the timeline UI.
- No test framework is installed yet (no Jest/Vitest/Playwright). Do not document test commands
  that don't exist; `docs/coding-standards.md` should note testing conventions to adopt but the
  root `package.json` has no `test` script yet - this is a gap to flag in `docs/risks.md` /
  `docs/roadmap.md`, not something to silently invent.
- No CI (GitHub Actions) is configured yet - also a gap for `docs/risks.md`/`docs/roadmap.md`.

### What is explicitly NOT built yet (don't describe these as done anywhere)

- No authentication flow (`/login` page, Firebase Auth sign-in, session cookie issuance).
- No dashboard shell (sidebar, topbar, breadcrumbs wired to `primaryNav`).
- No CRM feature code under `features/` (the folder only has a `README.md`).
- No Server Actions, repositories, or services beyond the `README.md` convention docs.
- No BalloAds or Brutus AI client code in `lib/` yet (folders don't exist yet beyond `client.ts`/
  `admin.ts`/`README.md`).

All of the above are Sprint 1 (or later) tasks - see `docs/tasks/sprint-1.md` and the
per-developer files. Documentation should describe them as the _plan_, using future tense or an
explicit "Status: not yet implemented" marker, never as already-working functionality.
