# Sprint 1 — Foundation Skeleton

**Sprint goal:** a deployable skeleton that proves the full stack end to end — Firebase Auth
sign-in works, the dashboard shell renders with real navigation, and one CRM entity (Accounts)
has working Create/Read against Firestore through the repository → service → action → UI layering
defined in [architecture.md](../architecture.md). No Opportunities, Contracts, Campaigns, ABM, or
AI work happens this sprint — see [roadmap.md](../roadmap.md) Phase 1.

**Team:** three developers working in parallel per the project brief's Sprint 1 team shape —
Developer 1 (Infrastructure & Auth, `INFRA-*`), Developer 2 (Shell, Design System & Navigation,
`SHELL-*`), Developer 3 (Core CRM Domain, `CRM-*`). Field structure for every task below follows
[task-template.md](./task-template.md) exactly; do not drop a field.

**Ground truth reminder:** the project foundation (Next.js/Tailwind/shadcn, Firebase SDK wiring
in `lib/firebase/`, Redux store, TanStack Query provider, `/docs`) is already scaffolded. None of
the tasks below re-scaffold it — they build the first real features on top of it.

**Project-wide Definition of Done** (referenced, not restated, by every task's Definition of Done
checklist): acceptance criteria met; relevant `docs/*.md` updated in the same change;
`npm run lint`, `tsc --noEmit`, and `npm run build` all pass; PR opened per
[CONTRIBUTING.md](../../CONTRIBUTING.md); `docs/progress.md` and `docs/changelog.md` updated.

---

## Developer 1 — Infrastructure & Auth

### INFRA-001: Configure Firebase project and wire environment variables

- **Task ID**: `INFRA-001`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Configure Firebase project and wire environment variables
- **Objective**: Stand up the actual Firebase project (Auth + Firestore) behind the
  already-scaffolded `lib/firebase/client.ts` and `lib/firebase/admin.ts`, and populate real
  credentials through `config/env.ts` so every later task (auth, Firestore reads/writes) has a
  working backend to target instead of placeholder env values.
- **Business Value**: Nothing else in the app — login, Accounts CRUD, AI jobs — can run against
  real data until this lands. It is the root of the Sprint 1 critical path.
- **Dependencies**: none — this is the root of the critical path (see
  [Cross-track dependencies](#cross-track-dependencies) below).
- **Target Files**:
  - `.env.local` (untracked, created locally from `.env.example`)
  - `.env.example` (add any newly-required key names, no real values)
  - `config/env.ts` (extend the Zod schema only if a new required key is introduced)
  - `firebase.json`, `firestore.rules`, `firestore.indexes.json` (deploy target project ID only —
    do not change rule logic in this task)
- **Technical Instructions**:
  1. Create the Firebase project (or confirm the hackathon-provided one) with Authentication
     (Email/Password provider, minimum viable for Sprint 1) and Firestore (production mode,
     nearest region) enabled.
  2. Generate a Web App config for the client SDK and a Service Account key for the Admin SDK;
     populate `.env.local` per the keys already read by `getClientEnv()` / `getServerEnv()` in
     `config/env.ts` — do not invent new env var names without updating `.env.example` and the
     Zod schema together.
  3. Run `firebase use --add` to bind the CLI to the project and confirm
     `firebase deploy --only firestore:rules,firestore:indexes` succeeds against it.
  4. Verify `lib/firebase/client.ts` and `lib/firebase/admin.ts` both initialize without throwing
     by hitting a throwaway Server Component/Route Handler that calls each, then delete the
     throwaway code before opening the PR.
- **Acceptance Criteria**:
  - A real Firebase project exists with Email/Password Auth and Firestore enabled.
  - `.env.example` lists every required key with a placeholder value and a comment on where to
    find it in the Firebase console.
  - `npm run dev` boots with no `config/env.ts` Zod validation errors.
  - `firebase deploy --only firestore:rules,firestore:indexes` completes without error against
    the configured project.
  - A throwaway smoke check (documented in the PR description) confirms both the client and
    admin SDK initialize successfully.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/environment.md` and `docs/deployment.md` updated with the real setup steps taken
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../tech-stack.md](../tech-stack.md) before starting;
  must update [../environment.md](../environment.md) and [../deployment.md](../deployment.md) as
  part of the same change.
- **Testing Notes**: No automated test framework is installed yet (see
  [../risks.md](../risks.md) R1). Manual verification: run `npm run dev`, confirm no env
  validation crash; add a temporary `console.log` in a Server Component calling the Admin SDK to
  confirm it connects, then remove it before opening the PR.

### INFRA-002: Firebase Auth sign-in Server Action, session cookie issuance, and first-run org bootstrap

- **Task ID**: `INFRA-002`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Implement sign-in Server Action, session cookie issuance, and first-run org/user bootstrap
- **Objective**: Give the app a working Firebase Auth sign-in path — the client signs in with
  Firebase Auth, exchanges the ID token for a server-issued `__session` HTTP-only cookie, and (on
  a brand-new user) bootstraps the `users/{uid}` and `organizations/{orgId}` documents so every
  later CRM write has a real `orgId` to scope into.
- **Business Value**: This is the second link in the Sprint 1 demo's critical path — without it,
  the login page Developer 2 builds (`SHELL-001`) has nothing to call, and Accounts CRUD
  (`CRM-002`+) has no verified `orgId` to write under.
- **Dependencies**: `INFRA-001`.
- **Target Files**:
  - `features/auth/actions/sign-in.ts` (new)
  - `features/auth/actions/sign-out.ts` (new)
  - `features/auth/schemas/sign-in-schema.ts` (new)
  - `repositories/users-repository.ts` (new)
  - `repositories/organizations-repository.ts` (new)
  - `services/auth-service.ts` (new)
- **Technical Instructions**:
  1. Add `features/auth/schemas/sign-in-schema.ts` with a Zod `signInSchema` (`email`, `password`)
     per the `schemas/README.md` naming convention (feature-specific, so it lives under
     `features/auth/schemas/`, not top-level `schemas/`).
  2. `sign-in.ts` is a `"use server"` action: verifies the client-supplied Firebase ID token
     server-side with the Admin SDK (`lib/firebase/admin.ts`), then uses
     `getAdminAuth().createSessionCookie()` to mint the `__session` cookie and set it via
     `next/headers` `cookies()` with `httpOnly`, `secure`, and an expiry matching the session
     cookie's TTL.
  3. `auth-service.ts` composes `users-repository.ts` + `organizations-repository.ts`: on first
     sign-in for a `uid` with no `users/{uid}` document, create a new `organizations/{orgId}`
     document (`orgId` generated) and a `users/{uid}` document (`{ orgId, role: "owner" }`) in a
     single logical operation — this is the only place in the app allowed to create an
     organization.
  4. `sign-out.ts` clears the `__session` cookie and calls `getAdminAuth().revokeRefreshTokens()`
     for the current `uid`.
  5. Do not touch `middleware.ts` in this task — it already checks cookie presence; verification
     of the cookie's validity happens in `INFRA-003`.
- **Acceptance Criteria**:
  - Submitting valid credentials from a form results in a `__session` HTTP-only cookie being set.
  - A brand-new Firebase Auth user gets exactly one `organizations/{orgId}` and one
    `users/{uid}` document created on first successful sign-in; a returning user does not create
    duplicates.
  - Signing out clears the cookie and revokes the refresh token.
  - Invalid credentials return a typed `{ ok: false, error }` result, never an unhandled throw.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/database-schema.md` updated to document the `users/{uid}` and
        `organizations/{orgId}` document shapes as implemented
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: Must read [../architecture.md](../architecture.md) §4
  (Authentication) and [../decisions.md](../decisions.md) before starting; must update
  [../database-schema.md](../database-schema.md) and [../routes.md](../routes.md) as part of the
  same change.
- **Testing Notes**: No test framework installed yet (see [../risks.md](../risks.md) R1). Manual
  verification: sign in with a fresh test account, confirm `organizations/{orgId}` and
  `users/{uid}` appear in the Firestore console exactly once; sign in again and confirm no
  duplicate documents; sign out and confirm the cookie is gone and a stale ID token is rejected.

### INFRA-003: Server-side session verification helper

- **Task ID**: `INFRA-003`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Add server-side session verification helper for Server Components and Actions
- **Objective**: Provide a single, reusable `getCurrentUser()` helper that verifies the
  `__session` cookie with the Admin SDK and resolves it to `{ uid, orgId, role }`, since
  `middleware.ts` only checks cookie _presence_, not validity, per
  [architecture.md](../architecture.md) §4.
- **Business Value**: Every protected page and every Accounts read/write needs a trustworthy
  `orgId` derived from a verified session, never from client input — this is the one place that
  guarantee is enforced, closing the gap `middleware.ts` deliberately leaves open.
- **Dependencies**: `INFRA-002`.
- **Target Files**:
  - `lib/auth/get-current-user.ts` (new)
  - `lib/auth/README.md` (new — short convention note, following the pattern of other `lib/`
    subfolders)
- **Technical Instructions**:
  1. `getCurrentUser()` reads the `__session` cookie via `next/headers` `cookies()`, verifies it
     with `getAdminAuth().verifySessionCookie(cookie, true)` (checked for revocation), and on
     success reads `users/{uid}` via `repositories/users-repository.ts` to get `orgId`/`role`.
  2. Returns `null` (not a throw) on any verification failure, so callers can branch to a
     redirect; export a `requireCurrentUser()` variant that redirects to `/login` if `null`, for
     Server Components that must not render without a session.
  3. Mark the module `server-only` (the installed `server-only` package) so any accidental
     Client Component import fails at build time, per [../risks.md](../risks.md) R6.
- **Acceptance Criteria**:
  - `getCurrentUser()` returns `{ uid, orgId, role }` for a valid, unrevoked session and `null`
    otherwise (expired, tampered, or missing cookie).
  - `requireCurrentUser()` redirects to `/login` when there is no valid session.
  - Importing `lib/auth/get-current-user.ts` from a Client Component fails the build.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/architecture.md` updated to mark session verification as implemented (per its
        "Status note")
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../architecture.md](../architecture.md) §4 before
  starting; must update it as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: call
  `requireCurrentUser()` from a throwaway Server Component with no session cookie and confirm the
  redirect fires; sign in, reload, and confirm `{ uid, orgId, role }` resolves correctly; manually
  delete the cookie value's signature (corrupt it) and confirm it resolves to `null`, not a crash.

### INFRA-004: Minimal CI pipeline (typecheck, lint, build)

- **Task ID**: `INFRA-004`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Add a minimal GitHub Actions CI workflow (typecheck, lint, build)
- **Objective**: Catch broken builds and lint/type regressions on every PR before they land, given
  three parallel contributors touching shared files — no CI exists yet (see
  [../risks.md](../risks.md) R1).
- **Business Value**: With three developers (and possibly AI agents) shipping in parallel, an
  unchecked broken build on `main` blocks everyone else's next PR right before a hackathon demo —
  cheap insurance for a high-cost failure mode.
- **Dependencies**: `INFRA-001` (soft — CI can be authored in parallel and only needs a working
  env schema to pass its build step, so it can be built against `.env.example` placeholders and
  verified for real once `INFRA-001` lands).
- **Target Files**:
  - `.github/workflows/ci.yml` (new)
- **Technical Instructions**:
  1. Add a workflow triggered on `pull_request` (and `push` to `main`) that runs
     `npm ci`, `npm run lint`, `tsc --noEmit`, and `npm run build` on Node 20.
  2. Use repository/GitHub Actions secrets for any build-time env vars `config/env.ts` requires
     (placeholder values are acceptable for `getClientEnv()` — the build must not need live
     Firebase credentials to compile).
  3. Keep the workflow to a single job for Sprint 1; do not add deploy steps here (Vercel handles
     deploys via its own GitHub integration, out of scope for this task).
- **Acceptance Criteria**:
  - Opening a PR triggers the workflow and reports pass/fail as a GitHub status check.
  - A deliberately broken lint rule or type error in a test branch causes the workflow to fail.
  - The workflow completes in under 5 minutes on a clean cache.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../risks.md](../risks.md) R1 updated to note the CI portion of the mitigation as landed
        (test framework remains open, tracked separately for Sprint 2)
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: S
- **Estimated Hours**: 2-3
- **Documentation References**: Must read [../risks.md](../risks.md) R1 before starting; must
  update it as part of the same change.
- **Testing Notes**: This task _is_ the testing infrastructure task for builds; verify manually by
  opening a scratch PR with an intentional type error and confirming the check fails, then
  reverting it.

---

## Developer 2 — Shell, Design System & Navigation

### SHELL-001: Login page UI

- **Task ID**: `SHELL-001`
- **Epic**: Design System — Auth Surface
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: Build the `/login` page UI and wire it to the sign-in Server Action
- **Objective**: Build the only unauthenticated page in the app — a centered, minimal sign-in form
  using `components/ui/field.tsx`, `input.tsx`, and `button.tsx` — and call `INFRA-002`'s sign-in
  Server Action from it.
- **Business Value**: This is the first screen every user (and every judge) sees; it is also the
  entry point that makes the rest of the demo possible.
- **Dependencies**: `INFRA-002` (soft — the form and validation can be built against a typed stub
  action returning `{ ok: false, error: "not implemented" }` and swapped for the real import once
  `INFRA-002` merges, since both land in the same sprint in parallel).
- **Target Files**:
  - `app/login/page.tsx` (new)
  - `features/auth/components/login-form.tsx` (new)
- **Technical Instructions**:
  1. `app/login/page.tsx` is a Server Component shell (metadata, layout) that renders the
     `login-form.tsx` Client Component (it needs `react-hook-form` state and an `onSubmit`
     handler, so it must be a Client Component per the decision rule in
     [../architecture.md](../architecture.md) §2).
  2. `login-form.tsx` uses `react-hook-form` + `@hookform/resolvers/zod` with
     `features/auth/schemas/sign-in-schema.ts` (from `INFRA-002`) for validation, and
     `components/ui/field.tsx` primitives (`FieldSet`/`FieldGroup`/`FieldLabel`) per
     [../coding-standards.md](../coding-standards.md) — there is no legacy `Form`/`FormField`
     wrapper in this shadcn version.
  3. On submit, first sign in on the client with `lib/firebase/client.ts`'s Auth instance to get
     an ID token, then call the `sign-in` Server Action with that token to establish the session
     cookie; on success, redirect to `/dashboard`.
  4. Surface field-level and top-level errors using `components/ui/field.tsx`'s error slot and a
     `sonner` toast for unexpected failures.
- **Acceptance Criteria**:
  - `/login` renders a functioning email/password form with client-side Zod validation.
  - A successful sign-in redirects to `/dashboard`.
  - An invalid credential attempt shows an inline error without a full page reload or unhandled
    exception.
  - The page is keyboard-navigable and passes a basic screen-reader label check (every input has
    an associated `FieldLabel`).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../routes.md](../routes.md) updated to mark `/login` as implemented
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../ui-design-system.md](../ui-design-system.md) and
  [../coding-standards.md](../coding-standards.md) before starting; must update
  [../routes.md](../routes.md) as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: submit empty form
  (expect inline validation errors, no network call), submit wrong password (expect inline
  server-side error), submit correct credentials (expect redirect to `/dashboard`); tab through
  the form with keyboard only and confirm visible focus states.

### SHELL-002: Dashboard shell layout and sidebar navigation

- **Task ID**: `SHELL-002`
- **Epic**: Design System — App Shell
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: Build the authenticated dashboard shell layout and sidebar wired to `primaryNav`
- **Objective**: Build the route-group layout every authenticated page renders inside
  (`app/(dashboard)/layout.tsx`) and the sidebar component that renders `config/site.ts`'s
  `primaryNav`, which today exists only as config with no UI consuming it.
- **Business Value**: This is the visual backbone of the entire product — without it there is no
  "app," only isolated pages. It's also the layout every other feature screen (Accounts,
  Contacts, Opportunities, ...) depends on for a consistent frame.
- **Dependencies**: `INFRA-003` (soft — the layout can render with a temporary
  "assume authenticated" stub during development and switch to `requireCurrentUser()` once
  `INFRA-003` merges, since redirect-on-missing-session is the only integration point).
- **Target Files**:
  - `app/(dashboard)/layout.tsx` (new)
  - `components/shared/sidebar.tsx` (new)
  - `components/shared/nav-item.tsx` (new)
- **Technical Instructions**:
  1. `app/(dashboard)/layout.tsx` is a Server Component: calls `requireCurrentUser()` (from
     `INFRA-003`) to gate the route group, then renders `<Sidebar />` alongside `{children}` in a
     flex/grid shell.
  2. `sidebar.tsx` maps `config/site.ts`'s `primaryNav` array into `nav-item.tsx` entries; active
     route highlighting uses `usePathname()` (Client Component boundary pushed down to just the
     nav list, not the whole sidebar).
  3. Wire the sidebar's collapsed/expanded state to the existing `store/slices/ui-slice.ts`
     `sidebarCollapsed` Redux state (already scaffolded) via `store/hooks.ts` — do not add new
     Redux state for this; reuse what exists.
  4. Use `lucide-react` icons per `siteConfig`'s nav item `icon` field (add icon names to
     `config/site.ts`'s `primaryNav` entries if missing — this is a shared file, keep the diff to
     icon-name additions only to avoid colliding with other tracks' reads of that file).
- **Acceptance Criteria**:
  - Visiting any `app/(dashboard)/...` route without a valid session redirects to `/login`.
  - The sidebar renders all eight `primaryNav` items with working links and correct active-item
    highlighting.
  - Collapsing the sidebar persists across a client-side navigation (Redux state, not local
    per-page state).
  - Layout is responsive: sidebar collapses to icons-only or a sheet/drawer below a tablet
    breakpoint.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../routes.md](../routes.md) and [../ui-design-system.md](../ui-design-system.md) updated
        to describe the shipped shell
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: L
- **Estimated Hours**: 6-8
- **Documentation References**: Must read [../ui-design-system.md](../ui-design-system.md),
  [../architecture.md](../architecture.md) §4, and [config/site.ts's README](../../config/README.md)
  before starting; must update [../routes.md](../routes.md) as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: sign in, confirm the
  shell renders with sidebar + content area; sign out (clear cookie) and hit a dashboard URL
  directly, confirm redirect to `/login`; resize the viewport to a mobile width and confirm the
  sidebar degrades to a usable mobile pattern instead of overflowing.

### SHELL-003: Topbar, breadcrumbs, user menu, and theme toggle

- **Task ID**: `SHELL-003`
- **Epic**: Design System — App Shell
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: Build the dashboard topbar with breadcrumbs, user menu, and theme toggle
- **Objective**: Complete the dashboard shell's header row — breadcrumbs derived from the current
  route, a user menu (avatar, sign-out), and a light/dark theme toggle using the already-wired
  `next-themes` provider.
- **Business Value**: Breadcrumbs and a visible sign-out affordance are baseline enterprise-SaaS
  expectations (per [../vision.md](../vision.md) UI direction: Linear/Stripe/Vercel Dashboard
  inspiration) — their absence would read as an unfinished shell to judges.
- **Dependencies**: `SHELL-002`.
- **Target Files**:
  - `components/shared/topbar.tsx` (new)
  - `components/shared/breadcrumbs.tsx` (new)
  - `components/shared/user-menu.tsx` (new)
  - `components/shared/theme-toggle.tsx` (new)
  - `app/(dashboard)/layout.tsx` (modify — render `<Topbar />`)
- **Technical Instructions**:
  1. `breadcrumbs.tsx` derives segments from `usePathname()`, mapped against `primaryNav` labels
     where a segment matches a known route, falling back to a title-cased raw segment (e.g. a
     future `/accounts/[id]` detail page) — uses `components/ui/breadcrumb.tsx`.
  2. `user-menu.tsx` is a `components/ui/dropdown-menu.tsx` wrapping `components/ui/avatar.tsx`,
     showing the signed-in user's email (from `requireCurrentUser()`'s result, passed down from
     the layout) and a "Sign out" item calling the `sign-out` Server Action (`INFRA-002`).
  3. `theme-toggle.tsx` uses `next-themes`' `useTheme()` (already wired in
     `providers/app-providers.tsx`) to cycle light/dark/system, rendering as an icon button.
  4. Keep `topbar.tsx` a thin composition of the three above plus the sidebar-collapse trigger.
- **Acceptance Criteria**:
  - Breadcrumbs update correctly when navigating between `primaryNav` routes.
  - The user menu shows the correct signed-in email and successfully signs the user out (redirect
    to `/login`, cookie cleared).
  - The theme toggle switches the whole app between light and dark without a page reload.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../ui-design-system.md](../ui-design-system.md) updated with the topbar pattern
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../ui-design-system.md](../ui-design-system.md) before
  starting; must update it as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: navigate across nav
  items and confirm breadcrumb accuracy; click sign out and confirm cookie removal + redirect;
  toggle theme and confirm persistence across a reload (via `next-themes`' storage).

### SHELL-004: Shared data table and empty-state primitives

- **Task ID**: `SHELL-004`
- **Epic**: Design System — Shared Components
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: Build shared data table and empty-state components for list views
- **Objective**: Wrap `components/ui/table.tsx` in a reusable `components/shared/data-table.tsx`
  (column defs, pagination footer using `components/ui/pagination.tsx`, loading + empty states)
  so every future list screen (Accounts now, Contacts/Opportunities/Contracts later) shares one
  table convention instead of each feature inventing its own.
- **Business Value**: Every CRM entity in the product mission is fundamentally "a list of records
  with a form to create/edit one" — a shared, accessible table primitive built once here is
  reused across the rest of Sprint 1, 2, and 3, directly reducing per-feature build time.
- **Dependencies**: none (built as a standalone shared component; consumed by `CRM-003`).
- **Target Files**:
  - `components/shared/data-table.tsx` (new)
  - `components/shared/data-table-pagination.tsx` (new)
  - `components/shared/empty-state.tsx` (new)
- **Technical Instructions**:
  1. `data-table.tsx` takes generic `columns` and `data` props (a thin wrapper, not a
     full TanStack Table integration for Sprint 1 — keep it a simple typed prop-driven table over
     `components/ui/table.tsx`; a full `@tanstack/react-table` integration is an acceptable
     Sprint 2 upgrade if list complexity grows, tracked as a backlog note rather than scope creep
     here).
  2. Support a `loading` prop rendering `components/ui/skeleton.tsx` rows, and an `isEmpty` state
     rendering `empty-state.tsx` (icon, title, description, optional CTA button) instead of a
     header-only empty table.
  3. `data-table-pagination.tsx` wraps `components/ui/pagination.tsx` with page-size and
     page-index props, framework-agnostic of how the caller sources its data (works for both a
     TanStack Query list and a plain array).
  4. Ensure table semantics are accessible: proper `<th scope="col">`, a visible focus ring on
     sortable header buttons if sorting is included, and an `aria-live` region for
     loading/empty-state transitions.
- **Acceptance Criteria**:
  - `data-table.tsx` renders a typed set of columns/rows with no `any` usage.
  - Loading state renders skeleton rows matching the configured column count.
  - Empty state renders the `empty-state.tsx` component with a customizable message and CTA.
  - Component is usable with no dependency on any specific feature (no `Account`-specific types
    leak into `components/shared/`).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../ui-design-system.md](../ui-design-system.md) updated with the data table and
        empty-state patterns
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Must read [../ui-design-system.md](../ui-design-system.md) and
  [../coding-standards.md](../coding-standards.md) before starting; must update
  [../ui-design-system.md](../ui-design-system.md) as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: render the component
  in a throwaway Storybook-less test route with mock rows, mock loading, and mock empty data to
  visually confirm all three states before `CRM-003` adopts it.

---

## Developer 3 — Core CRM Domain

### CRM-001: Account schema and repository

- **Task ID**: `CRM-001`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Define the Account Zod schema and Firestore repository
- **Objective**: Define the single source of truth for an Account's shape and the only module
  allowed to read/write `organizations/{orgId}/accounts` in Firestore, establishing the pattern
  every later entity (Contacts, Opportunities, Contracts) will follow.
- **Business Value**: This is the data-model foundation for the Sprint 1 demo's proof point
  ("one CRM entity has working Create/Read against Firestore") and the template the team reuses
  for every subsequent entity, so getting the shape and layering right here pays off across the
  whole hackathon.
- **Dependencies**: none (schema/type work has no runtime dependency; soft dependency on
  `INFRA-001` only to verify repository calls against a real Firestore instance rather than
  types alone).
- **Target Files**:
  - `features/accounts/schemas/account-schema.ts` (new)
  - `features/accounts/types.ts` (new)
  - `repositories/accounts-repository.ts` (new)
- **Technical Instructions**:
  1. `account-schema.ts` defines `accountSchema` (Zod) with at minimum: `id`, `orgId`, `name`
     (required, min length 1), `website` (optional URL), `industryVertical` (optional string —
     reserved for Sprint 3's Vertical Sales Indexing work, so the field exists early rather than
     requiring a later migration), `healthScore` (optional number 0-100 — the externally-supplied
     BalloAds enrichment field per [../integrations.md](../integrations.md), not computed by
     BalloCRM), `lifecycleStage` (enum: `lead`, `qualified`, `onboarding`, `active`, `at_risk`,
     `churned` — the CRM-native "Customer Journey" concept, never named `journey` per the naming
     rule in [../integrations.md](../integrations.md)), `ownerId`, `createdBy`, `createdAt`,
     `updatedAt`. Export `type Account = z.infer<typeof accountSchema>` per the naming convention
     in `schemas/README.md`.
  2. Add a separate `createAccountInputSchema` (omits `id`/`createdAt`/`updatedAt`/`healthScore` —
     fields the server or an external system sets, never the create form) for use by `CRM-002`.
  3. `accounts-repository.ts` exports plain functions taking/returning `Account`-typed data:
     `createAccount(orgId, input)`, `getAccountById(orgId, accountId)`,
     `listAccounts(orgId, { limit, cursor })`. This file is the only place `firebase-admin/firestore`
     is imported for accounts — no validation beyond shape (Zod parse on read/write), no business
     rules (those live in `CRM-002`'s service).
  4. Use the Admin SDK (`lib/firebase/admin.ts`) since all repository access in this architecture
     is server-side; do not import the client SDK here.
- **Acceptance Criteria**:
  - `accountSchema` and `createAccountInputSchema` exist with no `any` and cover the fields
    listed above.
  - `accounts-repository.ts` exports `createAccount`, `getAccountById`, `listAccounts`, each
    parsing Firestore data through `accountSchema` before returning it.
  - Repository functions are org-scoped by parameter (`orgId` is always required, never inferred
    from anywhere but the caller).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../database-schema.md](../database-schema.md) updated with the `accounts` collection's
        documented shape
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../architecture.md](../architecture.md) §2 (layering)
  and [../glossary.md](../glossary.md) (Customer Journey vs. BalloAds Journey) before starting;
  must update [../database-schema.md](../database-schema.md) as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: write a throwaway
  script or Route Handler that calls `createAccount` then `getAccountById`/`listAccounts` against
  a real (or emulator) Firestore instance once `INFRA-001` lands, confirm round-tripped data
  matches the schema, then remove the throwaway code.

### CRM-002: Accounts service and create-account Server Action

- **Task ID**: `CRM-002`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Implement the Accounts service and `create-account` Server Action
- **Objective**: Add the business-logic layer between the repository and the UI — validating
  input, deriving `orgId`/`createdBy` from the verified session (never client input), and
  exposing a thin Server Action the create-account form calls.
- **Business Value**: This is the write half of the Sprint 1 demo's "Accounts CRUD proving the
  stack end to end" proof point.
- **Dependencies**: `CRM-001`; `INFRA-003` (soft — until it lands, derive `orgId` from a hardcoded
  development constant clearly marked `// TODO(INFRA-003): replace with requireCurrentUser()`,
  swapped out once the real session helper exists).
- **Target Files**:
  - `services/accounts-service.ts` (new)
  - `features/accounts/actions/create-account.ts` (new)
- **Technical Instructions**:
  1. `accounts-service.ts` exports `createAccountForOrg(orgId, createdBy, input)`: validates
     `input` against `createAccountInputSchema`, calls `accounts-repository.ts`'s `createAccount`,
     and (once `INFRA-002`'s Activity logging convention exists — otherwise stub with a `// TODO`
     comment referencing the follow-up) is the intended future site of an "Account created"
     Activity log write.
  2. `create-account.ts` is a `"use server"` action: calls `requireCurrentUser()` (`INFRA-003`)
     to get `{ uid, orgId }`, parses `FormData` with `createAccountInputSchema`, calls
     `createAccountForOrg`, and returns `{ ok: true, data: account } | { ok: false, error }` per
     the shared Server Action result convention in `actions/README.md` — never throws to the
     client for expected validation errors.
  3. Revalidate the accounts list path (`revalidatePath("/accounts")`) on success so `CRM-003`'s
     list reflects the new record without a manual refetch.
- **Acceptance Criteria**:
  - Calling the action with valid `FormData` creates a Firestore document under the caller's
    `orgId` and returns `{ ok: true, data }`.
  - Calling it with invalid input (e.g. empty `name`) returns `{ ok: false, error }` without
    writing to Firestore.
  - `orgId` and `createdBy` are always derived server-side from the verified session, never
    accepted as form fields.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../api.md](../api.md) updated with the `create-account` Server Action entry
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../architecture.md](../architecture.md) §2-3 and
  `actions/README.md` before starting; must update [../api.md](../api.md) as part of the same
  change.
- **Testing Notes**: No test framework installed yet. Manual verification: submit valid and
  invalid `FormData` payloads against the action from a throwaway form, confirm Firestore writes
  and error shapes match the acceptance criteria.

### CRM-003: Accounts list page (read)

- **Task ID**: `CRM-003`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Build the Accounts list page reading from Firestore via TanStack Query
- **Objective**: Build the read half of the Sprint 1 demo's proof point — a real page at
  `/accounts` listing every Account in the caller's org, backed by a `list-accounts` Server
  Action and a TanStack Query hook.
- **Business Value**: This is the page a judge sees to confirm the stack works end to end:
  sign in, see the shell, see real Firestore data rendered in a table.
- **Dependencies**: `CRM-001`, `CRM-002`; soft dependency on `SHELL-004` (shared data table) and
  `SHELL-002` (dashboard shell) — see [Cross-track dependencies](#cross-track-dependencies).
- **Target Files**:
  - `features/accounts/actions/list-accounts.ts` (new)
  - `features/accounts/hooks/use-accounts.ts` (new)
  - `features/accounts/components/accounts-table.tsx` (new)
  - `app/accounts/page.tsx` (new — temporary location; re-parented to
    `app/(dashboard)/accounts/page.tsx` once `SHELL-002` lands, see cross-track note)
- **Technical Instructions**:
  1. `list-accounts.ts` is a `"use server"` action wrapping `accounts-repository.ts`'s
     `listAccounts`, scoped to `requireCurrentUser()`'s `orgId` (same soft-dependency stub as
     `CRM-002` until `INFRA-003` lands).
  2. `use-accounts.ts` is a TanStack Query hook (`useQuery`) calling `list-accounts.ts`, keyed on
     `["accounts", orgId]`, invalidated by `CRM-002`'s `revalidatePath`/mutation success.
  3. `accounts-table.tsx` renders the list using `components/shared/data-table.tsx` once
     `SHELL-004` lands; until then, render against the raw `components/ui/table.tsx` primitive
     directly so this task is not blocked, and swap the import once the shared component ships
     (see cross-track note).
  4. `app/accounts/page.tsx` is a Server Component that prefetches the accounts list (via the
     TanStack Query server-prefetch pattern with `HydrationBoundary`) and renders
     `accounts-table.tsx`; render it standalone (no shell layout) until `SHELL-002` lands, then
     move the file under `app/(dashboard)/` so it inherits the real shell instead of rendering
     bare.
- **Acceptance Criteria**:
  - `/accounts` renders every Account belonging to the signed-in user's `orgId`, and none from
    any other org.
  - Creating an account via `CRM-002`'s action updates this list without a manual page reload.
  - Loading and empty states render correctly (empty state on a brand-new org with zero
    accounts).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../routes.md](../routes.md) and [../api.md](../api.md) updated
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
  - [ ] Follow-up note added to [../roadmap.md](../roadmap.md) or a task in
        [backlog.md](./backlog.md) to re-parent `app/accounts/page.tsx` under
        `app/(dashboard)/` once `SHELL-002` merges, if not already done in this PR
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: Must read [../architecture.md](../architecture.md) §3
  and [../database-schema.md](../database-schema.md) before starting; must update
  [../routes.md](../routes.md) as part of the same change.
- **Testing Notes**: No test framework installed yet. Manual verification: create two orgs
  (via two test sign-ins), confirm each only ever sees its own accounts; create several accounts
  and confirm pagination/list correctness; simulate a slow network (browser devtools throttling)
  to visually confirm the loading state.

### CRM-004: Create Account form UI

- **Task ID**: `CRM-004`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Build the Create Account form dialog wired to the create-account action
- **Objective**: Give users a way to trigger `CRM-002`'s Server Action from the UI — a dialog/sheet
  form on the Accounts list page using React Hook Form + Zod, matching the form conventions
  `SHELL-001` establishes for `/login`.
- **Business Value**: Completes the Sprint 1 "Create" half of "Accounts has working Create/Read"
  — without this task, `CRM-002`'s action has no UI entry point and the demo has no way to add
  data live.
- **Dependencies**: `CRM-002`, `CRM-003`.
- **Target Files**:
  - `features/accounts/components/create-account-dialog.tsx` (new)
  - `features/accounts/components/create-account-form.tsx` (new)
- **Technical Instructions**:
  1. `create-account-dialog.tsx` uses `components/ui/dialog.tsx`, triggered by a "New Account"
     button placed in `accounts-table.tsx`'s toolbar area (or the page header if `SHELL-004`'s
     table toolbar convention isn't ready yet).
  2. `create-account-form.tsx` uses `react-hook-form` + `@hookform/resolvers/zod` against
     `createAccountInputSchema` (from `CRM-001`), rendered with `components/ui/field.tsx`
     primitives, matching the pattern `SHELL-001` uses for the login form so the codebase has one
     form convention, not two.
  3. On submit, call `create-account.ts` (as a Server Action bound directly to the form via the
     `action` prop, or invoked imperatively with `useTransition` if inline field-level error
     mapping is needed); on `{ ok: true }`, close the dialog and show a `sonner` success toast; on
     `{ ok: false, error }`, surface the error inline.
- **Acceptance Criteria**:
  - Clicking "New Account" opens a dialog with a validated form.
  - Submitting valid data creates the account, closes the dialog, shows a success toast, and the
    new row appears in the list (via `CRM-003`'s query invalidation) without a manual refresh.
  - Submitting invalid data (empty required field) shows inline validation errors and does not
    call the server action.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../routes.md](../routes.md) updated if this changes the Accounts page's documented
        capabilities
  - [ ] Project-wide DoD met (lint/typecheck/build, docs, PR review)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../ui-design-system.md](../ui-design-system.md) and
  [../coding-standards.md](../coding-standards.md) (form conventions) before starting.
- **Testing Notes**: No test framework installed yet. Manual verification: full create flow from
  an empty accounts list to a populated one, including the empty-required-field validation path
  and a simulated server error (temporarily throw in the action) to confirm the error surfaces
  correctly and the dialog doesn't silently close.

---

## Cross-track dependencies

- **Auth is the hard root of the critical path.** `INFRA-001` blocks `INFRA-002`, which blocks
  `INFRA-003`, `SHELL-001`, and (via the `orgId`/session contract) every write in `CRM-002`
  through `CRM-004`. Start `INFRA-001` first, on day one, ahead of everything else.
- **`CRM-003`'s Accounts list page needs `SHELL-004`'s shared data table and `SHELL-002`'s
  dashboard shell, but neither is a hard blocker.** Developer 3 builds `CRM-003` against the bare
  `components/ui/table.tsx` primitive and a standalone `app/accounts/page.tsx` (no shell layout)
  from day one, then re-parents the page under `app/(dashboard)/accounts/page.tsx` and swaps in
  `components/shared/data-table.tsx` once `SHELL-002`/`SHELL-004` land — tracked explicitly as a
  Definition of Done follow-up on `CRM-003` rather than left implicit.
- **`SHELL-002`'s auth gate and `SHELL-001`'s login form both soft-depend on `INFRA-002`/
  `INFRA-003`.** Both build against typed stubs (`requireCurrentUser()` returning a hardcoded
  dev user; the sign-in action returning a typed failure) so Developer 2 is never blocked waiting
  on Developer 1, and swap the stub for the real import as soon as the corresponding `INFRA-*`
  task merges.
- **`config/site.ts` is a shared file** touched by `SHELL-002` (icon names on `primaryNav`) and
  read (not written) by `CRM-003`/`CRM-004` indirectly via the shell. Keep any edits to it
  small and called out explicitly in the PR description to avoid silent merge collisions, per
  [../risks.md](../risks.md) R8.
- See [sprint-2.md](./sprint-2.md) for how Contacts, Opportunities, and Contracts extend this same
  repository → service → action → UI pattern once Sprint 1 proves it end to end.
