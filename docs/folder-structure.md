# Folder Structure

This document describes the real, scaffolded top-level layout of the BalloCRM repository and the
convention each folder follows. It is descriptive, not aspirational - every folder listed below
already exists on disk. Where a folder is currently empty of feature code (e.g. `features/`), that
is called out explicitly rather than implied otherwise. See [architecture.md](./architecture.md)
for how these folders compose into the request lifecycle, and [coding-standards.md](./coding-standards.md)
for the rules that govern what goes inside them.

## Top-level tree

```
.env.example              # Local env var template - copy to .env.local, never commit real secrets
.github/                  # GitHub-specific config (issue templates, future CI workflows)
.gitignore
.husky/                   # Git hooks (pre-commit lint-staged) installed via Husky
.prettierignore
.prettierrc.json
.vscode/                  # Shared editor settings for consistent formatting across contributors
actions/                  # Cross-cutting Server Actions shared by more than one feature
AGENTS.md                 # create-next-app boilerplate warning for AI agents - not BalloCRM's standards doc
app/                      # Next.js App Router: routes, layouts, route handlers
CHANGELOG.md              # Human-facing release notes (see docs/changelog.md for the dev-facing log)
CLAUDE.md                 # create-next-app boilerplate warning for AI agents - not BalloCRM's standards doc
components/               # Shared, feature-agnostic UI (shadcn primitives + cross-feature composed components)
components.json           # shadcn/ui config (style: radix-nova, base color: neutral, icons: lucide)
config/                   # Startup configuration: env var validation, site metadata, nav
constants/                # App-wide literal constants/enums that aren't config or a Zod enum
CONTRIBUTING.md           # Contribution workflow, branching, review checklist
docs/                     # This documentation tree - the source of truth for the project
features/                 # Feature-based domain code (accounts, opportunities, contracts, ...)
firebase.json             # Firebase project/emulator configuration
firestore.indexes.json    # Composite index definitions (see docs/indexes.md)
firestore.rules           # Firestore security rules (see docs/firestore-rules.md)
hooks/                    # Shared, feature-agnostic React hooks
LICENSE
lib/                      # Third-party SDK wrappers and low-level clients (Firebase, future BalloAds/Brutus clients)
middleware.ts             # Edge route gate: checks for a session cookie, does not verify it
next-env.d.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
providers/                # Client-side provider composition root (Redux, TanStack Query, theming, toasts)
public/                   # Static assets served as-is
README.md                 # Repo entry point: setup instructions, links into docs/
repositories/             # The only layer allowed to talk to Firestore directly
schemas/                  # Shared (cross-feature) Zod schemas - the source of truth for boundary-crossing shapes
services/                 # Business logic composing repositories (and future lib/ clients) into operations
store/                    # Redux Toolkit store, scoped to client-only UI state
styles/                   # Non-Tailwind global CSS overrides (reserved, currently near-empty)
tsconfig.json
types/                    # Ambient/shared TypeScript types not derived from a Zod schema
utils/                    # Small, pure, framework-agnostic helper functions
```

Every top-level folder above except `app/`, `public/`, `.github/`, `.vscode/`, `.husky/`, and
`docs/` has its own `README.md` at its root stating its convention in a few sentences. Those files
are authoritative; this document expands on them but does not override them.

## Expanded conventions per folder

### `app/`

The Next.js App Router tree: route segments, `layout.tsx`, `page.tsx`, and Route Handlers
(`route.ts`). Route Handlers are reserved for two cases - endpoints a third party calls into
(BalloAds delivery-status webhooks) and any surface that must be a plain HTTP endpoint by
contract. Everything else is a Server Component route calling into `actions/` for mutations.
Route segment naming and the current route inventory live in [routes.md](./routes.md).

### `components/`

Shared, feature-agnostic UI only, split into `components/ui/` (shadcn/ui primitives, generated -
don't hand-edit beyond what's necessary, re-run the generator instead) and `components/shared/`
(composed components used by two or more features, e.g. an `EntityAvatar` or `EmptyState`). If a
component is only ever used by one feature, it does not belong here - it belongs in that feature's
own `components/` folder. Design tokens, spacing, and usage rules live in
[ui-design-system.md](./ui-design-system.md).

### `features/`

Feature-based domain code - the primary unit of parallel work for this project. Each business
capability (accounts, opportunities, contracts, campaigns, etc.) is a self-contained folder under
`features/<feature>/`. As of this writing `features/` contains only its `README.md`; no feature
folders have been scaffolded yet (Sprint 1, Developer 3 starts with `accounts`). A feature folder
never imports from another feature folder directly - shared logic goes through `lib/`,
`services/`, or top-level `components/`. See the worked example below.

### `lib/`

Framework-level integration code that isn't business logic: SDK initialization and low-level
clients that many features depend on. Currently holds `lib/firebase/client.ts` (browser Auth +
Firestore, Client Component use only) and `lib/firebase/admin.ts` (server Admin SDK, guarded by
`server-only`). `lib/balloads/` and `lib/brutus/` are planned but not yet scaffolded - see
[integrations.md](./integrations.md). The rule of thumb: if it wraps a third-party SDK or
protocol, it goes here; if it composes multiple `lib/` clients into a business operation, it
belongs in `services/` instead.

### `services/`

Business logic that composes one or more `repositories/` functions (and, once they exist,
`lib/balloads` or `lib/brutus` clients) into a meaningful operation - for example, "qualify an
opportunity" might read the opportunity, call Brutus AI for a score, write the score back, and log
an Activity, all in one service function. `actions/` calls into `services/`; UI code and Server
Actions never call `repositories/` directly, so business rules stay centralized in one place
instead of scattered across call sites.

### `repositories/`

The only layer permitted to import `firebase/firestore` or `firebase-admin/firestore` directly.
One file per Firestore collection (`accounts-repository.ts`, `opportunities-repository.ts`, ...)
exporting plain functions (`getAccountById`, `listAccounts`, `createAccount`, ...) that take and
return Zod-inferred types from `schemas/`. Repositories know nothing about business rules - no
validation beyond shape, no side effects beyond the read/write itself. The collection list this
layer maps to is documented in [database-schema.md](./database-schema.md).

### `store/`

Redux Toolkit, scoped strictly to cross-cutting **client UI state** - sidebar collapse, global
dialogs, the command menu (`store/slices/ui-slice.ts`). Server data (accounts, opportunities,
contracts, etc.) is owned by TanStack Query, never Redux. `store/store.ts` builds one store
instance per request via `makeStore()` - never a module-level singleton, since that would leak
state across requests on the server. `store/hooks.ts` exports the typed `useAppDispatch` /
`useAppSelector` hooks used everywhere instead of the untyped Redux hooks.

### `providers/`

Holds `app-providers.tsx`, the single composition root wiring Redux's `Provider`, TanStack
Query's `QueryClientProvider`, `next-themes`' `ThemeProvider`, and the `sonner` toast renderer
around `{children}` in `app/layout.tsx`. New global client-side providers are added here - never
wrapped ad hoc inside a page or feature component, which would fragment provider state and make
it easy to accidentally double-mount a provider.

### `hooks/`

Shared, feature-agnostic React hooks only - `use-media-query`, `use-debounced-value`,
`use-mounted`, and similar utilities with no feature-specific data dependency. Feature-specific
hooks (e.g. a TanStack Query wrapper for accounts) live in `features/<feature>/hooks/` instead.
Redux's typed hooks live in `store/hooks.ts`, not here - don't duplicate them.

### `types/`

Ambient or shared TypeScript types that are **not** derived from a Zod schema - third-party type
augmentation, generic utility types (`Nullable<T>`, `PaginatedResult<T>`), or the shape of a
session object attached by middleware. If a type describes data that crosses a validation
boundary (a form, an API payload, a Firestore document), it does not belong here - it belongs in
`schemas/` as a Zod schema, with the TypeScript type inferred via `z.infer`.

### `schemas/`

Zod schemas that are the single source of truth for any shape crossing a boundary: form input,
Server Action payload, Firestore document, or an external API (BalloAds, Brutus AI) request or
response. Naming is `<entity>-schema.ts`, exporting `<entity>Schema` and
`type <Entity> = z.infer<typeof <entity>Schema>`. Only shapes shared across features (e.g. the
base `Account` shape used by both `accounts` and `opportunities`) belong at this top level;
feature-specific schemas live in `features/<feature>/schemas/`. Full naming reference:
[naming-conventions.md](./naming-conventions.md).

### `actions/`

Thin, cross-cutting Server Action entry points (`"use server"`) - used only when more than one
feature needs the same action. A Server Action parses/validates its input with a Zod schema from
`schemas/`, calls a `services/` function, and returns a typed result
(`{ ok: true, data }` or `{ ok: false, error }`) rather than throwing for expected
validation/business errors. Feature-specific actions live inside `features/<feature>/actions/`
and are only promoted to this top-level folder if a second feature needs them.

### `config/`

Application configuration read at startup: environment variable validation (`config/env.ts`,
Zod-validated `ClientEnv`/`ServerEnv`) and site metadata plus navigation (`config/site.ts`,
`siteConfig` and `primaryNav`). Config is static or derived from environment variables at build
or boot time - anything that varies per organization at runtime (e.g. an org's BalloAds API key)
lives in Firestore, read through `repositories/`, never here.

### `utils/`

Small, pure, framework-agnostic helper functions with no side effects - formatters, string/number
helpers, array helpers. If a helper needs Firebase, BalloAds, or Brutus AI, it is not a util; it
belongs in `lib/`, `repositories/`, or `services/` instead. `lib/utils.ts` (shadcn's `cn()`
helper) is the one exception kept where the generator places it.

### `constants/`

App-wide literal constants and enums that are neither configuration (`config/`) nor a Zod
schema's `.enum()` (which lives next to that schema in `schemas/`). Examples:
`OPPORTUNITY_STAGES`, `ACCOUNT_HEALTH_THRESHOLDS`.

### `styles/`

Reserved for non-Tailwind global CSS that doesn't belong in `app/globals.css` - a third-party
stylesheet override, print styles. Tailwind v4 configuration lives inline in `app/globals.css` via
`@theme`; do not add a `tailwind.config.ts` unless a plugin specifically requires the JS config
format.

## Worked example: the shape of a feature folder

No feature folders exist yet (see [progress.md](./progress.md) for current status), but every one
scaffolded from here forward follows this shape. For a hypothetical `features/accounts/`:

```
features/accounts/
  components/
    account-card.tsx           # feature-scoped UI, not shared elsewhere
    account-list.tsx
    account-detail-header.tsx
  hooks/
    use-account-query.ts       # TanStack Query wrapper: fetch/list accounts
    use-account-filters.ts     # local UI state for the accounts list view
  schemas/
    account-schema.ts          # AccountSchema, type Account = z.infer<typeof AccountSchema>
    create-account-schema.ts   # narrower schema for the create-account form payload
  actions/
    create-account.ts          # "use server" - validates input, calls services/, returns { ok, ... }
    update-account.ts
  types.ts                     # feature-local types not derived from a schema (e.g. view-model shapes)
```

If `features/accounts/components/` grows past roughly ten files, split it by sub-domain -
`components/list/` and `components/detail/` - rather than letting one flat folder sprawl.

## The data-flow layering rule

Every mutation and every server-side read follows the same one-directional path:

```
UI (Server or Client Component)
  -> actions/            thin Server Action: validates input with Zod, calls a service, returns { ok, ... }
    -> services/         business logic: composes repositories (and lib/ clients), owns side effects
      -> repositories/   the only layer that imports firebase/firestore or firebase-admin/firestore
        -> Firestore
```

UI code never imports Firestore directly, and a layer never reaches past the one directly below
it (e.g. an action never calls a repository function, skipping the service). This keeps
validation, business rules, and persistence each in exactly one place, which matters more than
usual here because multiple developers - and multiple AI coding agents - are working on different
features in parallel without a lot of synchronous coordination.

**This rule is currently enforced by convention and code review, not by tooling.** There is no
lint rule today that fails a build if `features/accounts/components/account-card.tsx` imports
`firebase/firestore` directly - a reviewer (human or AI) has to catch it, and the
[CONTRIBUTING.md](../CONTRIBUTING.md) review checklist calls it out explicitly ("No `any`, no direct
Firestore access outside `repositories/`"). A future ESLint boundary rule (e.g.
`eslint-plugin-boundaries`, configured to forbid `firebase/firestore` and `firebase-admin/firestore`
imports outside `repositories/**`, and to forbid `features/*/` from importing `features/!(same)/*`)
would turn this into an automated gate instead of a review-time judgment call - this is tracked as
a candidate item in [decisions.md](./decisions.md) (ADR-002) and should be considered for
[roadmap.md](./roadmap.md) / [risks.md](./risks.md) as the codebase grows past what code review
alone can reliably catch.
