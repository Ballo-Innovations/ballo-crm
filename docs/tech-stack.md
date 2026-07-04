# Tech Stack

This is the authoritative reference for every technology choice in BalloCRM: what it is, why it
was chosen _for this project_ (not generic marketing language), and the exact version already
installed in `package.json`. Do not substitute or "upgrade" any of these without updating this
document and [decisions.md](./decisions.md) in the same change - see the brief's Tech Stack table,
which this document expands on. Versions below are copied from the ground-truth dependency list;
if you're unsure whether something is installed, check `package.json` before assuming, but treat
this list as current as of the last update to this file.

## Framework

**Next.js 15 (App Router), React Server Components, TypeScript strict** - `next@15.5.20`,
`react@19.2.4`, `react-dom@19.2.4`.

Next.js's App Router gives BalloCRM Server Components and Server Actions as first-class primitives,
which is exactly the shape the [architecture](./architecture.md) leans on: most CRM screens are
data-heavy reads (account lists, pipelines, dashboards) that benefit from rendering on the server
close to Firestore, with small interactive islands hydrated as Client Components. Server Actions
remove the need to hand-write a matching internal REST API for every form in the app - critical
for a hackathon timeline with three developers working in parallel across separate features.
TypeScript is run in `strict` mode with no `any` allowed, because this is a
documentation/AI-agent-driven codebase (see [coding-standards.md](./coding-standards.md)) where
inferred, precise types are what let another contributor - human or AI - trust a function's
signature without re-reading its implementation.

## Styling / UI

**Tailwind CSS, shadcn/ui, Lucide Icons** - `tailwindcss@^4` + `@tailwindcss/postcss` (dev
dependency), plus the Radix UI primitives (`radix-ui`), `class-variance-authority`, `clsx`,
`tailwind-merge`, `cmdk`, `react-day-picker`, and `tw-animate-css` that shadcn/ui's generated
components depend on. `lucide-react` supplies icons.

Tailwind gives the whole team a shared, constrained styling vocabulary instead of ad hoc CSS files,
which matters when multiple developers (and AI agents) are touching UI in parallel - see
[ui-design-system.md](./ui-design-system.md) for the actual token/spacing scale. shadcn/ui was
chosen over a packaged component library (e.g. MUI, Ant) because it copies component source
directly into `components/ui/`, so BalloCRM owns and can freely restyle every primitive to match
the enterprise-SaaS direction (Salesforce/HubSpot/Linear/Stripe-inspired) called for in the brief,
without fighting a third party's theming API. `components.json` is configured with style
**`radix-nova`** - the Radix-UI-primitive-based shadcn style, not the newer experimental
`@base-ui/react`-based `base-nova` style - chosen specifically for the stability and ecosystem
familiarity of Radix, which matters more than early access to newer primitives for a
hackathon-to-production codebase. Base color is `neutral`; icon library is `lucide`. Installed
components today: `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`,
`card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `field`, `input`, `input-group`, `label`,
`navigation-menu`, `pagination`, `popover`, `progress`, `scroll-area`, `select`, `separator`,
`sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip` - add more with
`npx shadcn@latest add <name>` rather than hand-rolling a component shadcn already provides. Note
that this shadcn version's form primitive is `field` (`FieldSet` / `FieldGroup` / `FieldLabel`,
used directly with `react-hook-form`) - there is no separate legacy `Form`/`FormField` wrapper, so
don't write code that assumes one exists.

## Charts

**Recharts** - `recharts`.

Recharts is a React-native charting library (composable `<LineChart>`/`<BarChart>` components
rather than an imperative canvas API), which fits directly into Server/Client Component boundaries
and needs no separate DOM-manipulation escape hatch. It's the library BalloCRM's Commercial
Analytics dashboards (pipeline velocity, forecasting, health-score trends) are built on - see
[ui-design-system.md](./ui-design-system.md) for chart color/style conventions.

## Auth

**Firebase Authentication** - `firebase@^12` (client SDK), `firebase-admin@^14` (server SDK),
`server-only` (guards Admin SDK code from ever being bundled into a client component).

Firebase Auth is BalloCRM's _own_, separate identity system for CRM staff - it is explicitly not
BalloAds' authentication, which stays inside BalloAds and is never touched by BalloCRM (see
[architecture.md](./architecture.md#4-authentication) and the brief's non-goals). It was chosen
because it pairs naturally with Firestore (same project, same IAM boundary, same Admin SDK) and
gives BalloCRM email/password and future OAuth provider sign-in without standing up a separate auth
service for a hackathon timeline.

## Database

**Firebase Firestore** - via `firebase@^12` (client) and `firebase-admin@^14` (server).

Firestore was chosen for zero-ops document storage with real-time listeners, native multi-tenant
data modeling via subcollections (`organizations/{orgId}/...`), and Security Rules that can enforce
org/role isolation at the database layer as a defense-in-depth backstop behind the app's own
authorization checks. This fits a hackathon timeline where standing up and migrating a relational
schema (plus a connection-pooled hosting story) would cost time the team doesn't have, while still
giving production-viable multi-tenant isolation. Full collection/document model:
[database-schema.md](./database-schema.md); enforced access rules: [firestore-rules.md](./firestore-rules.md).

## Hosting

**Vercel** - deployment target for the Next.js app (no package.json entry; it's the hosting
platform, not a dependency).

Vercel is the natural pairing for a Next.js App Router project - Server Components, Server
Actions, and Route Handlers deploy with zero custom infrastructure, and PR preview deployments give
each developer's branch a shareable live URL without any manual environment setup, which matters
for three developers shipping features in parallel during the hackathon. See
[deployment.md](./deployment.md) for environments and project configuration.

## Messaging

**BalloAds Developer APIs** (`/v1/developer-portal/*`) - not an npm dependency; consumed via a
BalloCRM-authored HTTP client in `lib/` (planned, not yet built - see
[architecture.md](./architecture.md#11-what-is-explicitly-not-built-yet) equivalent ground truth).

BalloAds is the parent company's existing, production SMS/WhatsApp/Email platform. BalloCRM is
explicitly forbidden from rebuilding any part of that (see the brief's non-goals) - it calls
BalloAds' developer-portal REST API server-side, using an encrypted, per-organization API key, for
every messaging-adjacent need (triggering a send, reading delivery/opt-out status, reading an
externally computed account health score). Full contract and endpoint status:
[integrations.md](./integrations.md).

## AI

**Brutus AI** - not an npm dependency yet; consumed via a BalloCRM-authored client in `lib/`
(planned, not yet built).

Brutus AI is BalloCRM's AI provider for opportunity qualification, next-best-action, summarization,
cross-sell detection, and natural-language pipeline analytics. It's modeled as an async AI Job
(Firestore-tracked `queued -> running -> completed|failed`) rather than an inline synchronous call,
so AI latency and provider failures never block a page render - see
[architecture.md](./architecture.md#7-brutus-ai-integration) and [integrations.md](./integrations.md)
for the job lifecycle and payload contracts.

## State (client UI state)

**Redux Toolkit** - `@reduxjs/toolkit`, `react-redux`.

Redux Toolkit is used strictly for ephemeral, client-only UI state - the kind of state that has no
business living in Firestore or being refetched from a server: `sidebarCollapsed`,
`commandMenuOpen`, and future UI-only flags. It is deliberately not used for server data (accounts,
opportunities, etc.) - that's TanStack Query's job, below. The store is built per-render via
`makeStore()` in `store/store.ts` (not a module-level singleton), which matters in a server-rendered
Next.js app to avoid leaking state across requests. See `store/README.md` for the slice convention.

## Data fetching (server data)

**TanStack Query** - `@tanstack/react-query`, `@tanstack/react-query-devtools`.

TanStack Query owns caching, revalidation, and loading/error state for server-originated data
fetched from Client Components (e.g. a live-updating table that needs to refetch on an interval or
after a mutation), complementing Server Components' initial server-rendered fetch rather than
replacing it. Devtools are wired in development only via `providers/app-providers.tsx`. This is the
project's answer to "how does a Client Component get fresh server data" - it is not used for the
one-off UI toggles Redux Toolkit already covers.

## Validation

**Zod** - `zod@^4`.

Zod schemas in `schemas/` are the single source of truth for any shape that is user-supplied or
crosses a boundary - form input, a Server Action payload, a Firestore document read back out.
TypeScript types are inferred from those schemas (`z.infer<...>`) rather than hand-duplicated as
separate `interface`/`type` declarations, so a schema change can't silently drift from its type.
This is the enforcement mechanism behind the "no `any`, strict typing" rule in the architecture
principles.

## Forms

**React Hook Form + `@hookform/resolvers` (Zod resolver)** - `react-hook-form`,
`@hookform/resolvers`.

React Hook Form keeps form state out of React re-renders (uncontrolled-by-default inputs), which
matters for the information-dense, table-and-form-heavy enterprise UI the brief calls for (inline
edit, multi-field opportunity/contract forms). Paired with the Zod resolver, every form validates
against the exact same schema used server-side in the corresponding Server Action, so client and
server validation can never disagree. Used directly with shadcn/ui's `field` primitives
(`FieldSet`/`FieldGroup`/`FieldLabel`) rather than a separate `Form` wrapper component, since this
shadcn version doesn't ship one.

## Lint / Format

**ESLint + Prettier + `prettier-plugin-tailwindcss`** - `eslint@^9`, `eslint-config-next@15`,
`eslint-config-prettier`, `prettier`, `prettier-plugin-tailwindcss` (all dev dependencies).

ESLint (via `eslint-config-next`) catches Next.js/React correctness issues; `eslint-config-prettier`
turns off any ESLint formatting rules that would fight Prettier, so the two tools never disagree
about the same line. `prettier-plugin-tailwindcss` auto-sorts Tailwind class lists into a
canonical order, which matters once three developers are writing className strings in parallel -
it removes an entire category of diff noise and bikeshedding. See
[coding-standards.md](./coding-standards.md) for the enforced rule set.

## Git hooks

**Husky + lint-staged** - `husky`, `lint-staged` (dev dependencies), wired via `.husky/`.

Husky runs a pre-commit hook that invokes lint-staged, which in turn runs ESLint/Prettier only on
staged files. This catches lint/format problems before they land in a shared branch, which matters
more than usual in a hackathon where three people are committing to feature branches quickly and
there's no CI gate (yet - see below) to catch it after the fact.

## Not yet set up - adopt next

The ground-truth state of the repo as of this writing does not include everything a production CRM
eventually needs. These are gaps to plan for, not oversights to paper over:

- **Testing framework.** No Jest, Vitest, or Playwright is installed, and `package.json` has no
  `test` script. Do not reference test commands anywhere in the docs or task files until this
  lands. Tracked as a gap in [risks.md](./risks.md) and sequenced in [roadmap.md](./roadmap.md);
  [coding-standards.md](./coding-standards.md) documents the testing conventions to adopt once a
  framework is chosen, without pretending one already runs.
- **CI (GitHub Actions).** No workflow is configured yet - lint/type-check/build (and eventually
  tests) currently only run locally via the Husky pre-commit hook, which is not a substitute for a
  required CI check on pull requests. Also tracked in [risks.md](./risks.md) and
  [roadmap.md](./roadmap.md).

Both are Sprint 1-or-later infrastructure tasks owned by Developer 1 - see
[tasks/sprint-1.md](./tasks/sprint-1.md) and [tasks/developer-1.md](./tasks/developer-1.md).
