# Phase 2 — Design system depth & app-shell completion

Phase 2 finishes the app shell (real user menu, breadcrumbs, notifications dropdown) and deepens
the design system into the patterns the Sprint 2 feature screens need: a full form kit, a
consistent empty/error/loading + skeleton library with route boundaries, the `sonner` toast
convention for Server Action results, DataTable enhancements (filtering/faceting/column-visibility),
a reusable detail-page layout, and the kanban primitive the opportunity pipeline consumes. These
turn the Sprint 1 skeleton into a system Developer 3 can build Contacts/Opportunities/Contracts on
without inventing layout each time.

Fields follow [../task-template.md](../task-template.md). Definition of Done references
[../../sprint-plan.md](../../sprint-plan.md).

---

### SHELL-007: Topbar user menu backed by real session data

- **Task ID**: `SHELL-007`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Topbar user menu backed by real session data (name/role/org avatar, sign-out action)
- **Objective**: Replace the SHELL-002 placeholder avatar with a real topbar user menu driven by
  the verified session — display name, role, org, an `avatar.tsx` (photo or initials fallback) —
  and a sign-out action that clears the `__session` cookie.
- **Business Value**: Shows the product knows who is logged in (name, role, org), which reads as
  "real multi-tenant SaaS" to judges, and completes the login → work → sign-out loop for the demo.
- **Dependencies**: `SHELL-002` (topbar). `INFRA-003` (session verification) — **soft**: build
  against the session shape Developer 1 defines in `lib/auth/` (ask for the type even before the
  flow works, per [../developer-2.md](../developer-2.md)); render from a typed session mock until it
  lands. Sign-out calls a Dev 1 `signOut`/`clear-session` action — stub it with the confirmed
  signature.
- **Target Files**:
  - `components/shared/user-menu.tsx` (new, `"use client"`)
  - `components/shared/app-topbar.tsx` (mount the user menu)
  - `app/(dashboard)/layout.tsx` (read the verified session server-side and pass a serializable
    session view-model down as a prop — never pass secrets/tokens)
  - `types/session.ts` (only if Dev 1 hasn't already defined the session type; otherwise import it)
- **Technical Instructions**:
  1. The `(dashboard)` layout (Server Component) reads the verified session via Dev 1's
     `lib/auth/` helper and passes a **serializable** `{ displayName, email, role, orgName,
photoURL }` view-model to the topbar/user-menu — do not pass the raw token or Admin SDK
     objects across the Server→Client boundary (per [../../architecture.md](../../architecture.md)
     and the credential rule in [../../integrations.md](../../integrations.md)).
  2. `UserMenu` uses `dropdown-menu.tsx` triggered by an `avatar.tsx` (image with initials
     fallback). The menu shows name + email (label), the `role` as a `Badge` (map the five roles
     `owner/admin/manager/rep/viewer` to labels), the org name, a theme toggle entry, and a
     `Sign out` item.
  3. Sign-out calls the injected `signOut` action (Dev 1's `clear-session` Server Action), then
     `router.push("/login")`. Keep the stub isolated with a `// TODO(INFRA-003)` marker.
  4. Role/org text must never be conveyed by color alone (Accessibility rule); pair the role badge
     with its text label.
- **Acceptance Criteria**:
  - The topbar shows an avatar; opening it reveals the user's name, email, role, and org.
  - Avatar falls back to initials when no `photoURL` is present.
  - "Sign out" invokes the sign-out action and redirects to `/login`.
  - No token/secret is serialized into client props (verify: the client bundle/props contain only
    the display view-model).
  - Renders correctly in light and dark mode; the menu is keyboard-operable.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Session shape imported from Dev 1's definition (not a duplicate local type) once available
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Read [../../architecture.md](../../architecture.md) (Authentication,
  Server/Client split), [../../ui-design-system.md](../../ui-design-system.md) (Accessibility,
  Buttons), and [../../integrations.md](../../integrations.md) (credential boundary) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: with a mocked session, confirm
  name/role/org render and initials fallback works; trigger sign-out → stub called + `/login`
  redirect; inspect client props to confirm no token leaks; keyboard-open the menu; toggle theme.

---

### SHELL-008: Breadcrumb generation from route segments

- **Task ID**: `SHELL-008`
- **Epic**: Design System & Shell
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Breadcrumb generation from route segments
- **Objective**: Generate breadcrumbs automatically from the active route's path segments, rendered
  via `breadcrumb.tsx` in the `PageHeader` breadcrumb slot, with human-friendly labels sourced from
  `primaryNav` and an override hook for dynamic segments (e.g. an account name on `/accounts/[id]`).
- **Business Value**: Breadcrumbs give judges (and users) a constant sense of place and a one-click
  path back up the hierarchy, making deep detail pages feel navigable rather than dead-ends.
- **Dependencies**: `SHELL-002` (shell/topbar), `SHELL-005` (`PageHeader` breadcrumb slot).
  `breadcrumb.tsx` is already installed.
- **Target Files**:
  - `components/shared/breadcrumbs.tsx` (new, `"use client"` — uses `usePathname()`)
  - `hooks/use-breadcrumbs.ts` (new — derives the trail from segments)
  - `config/site.ts` (read `primaryNav` for top-level labels; may add a label lookup map)
  - `components/shared/page-header.tsx` (render `Breadcrumbs` in its breadcrumb slot)
- **Technical Instructions**:
  1. `use-breadcrumbs.ts` splits `usePathname()` into segments, maps each to `{ label, href }`.
     Top-level segments (`/accounts`, `/opportunities`) get their label from `primaryNav`; unknown
     segments fall back to a title-cased version of the segment.
  2. Dynamic segments (`[id]`) can't be labeled from the path alone — accept an optional
     `labelOverrides` prop (e.g. `{ [accountId]: "Kestrel Freight Co." }`) so a detail page can
     pass the entity name. The last crumb renders as the current page (non-link, `aria-current`).
  3. Render with `breadcrumb.tsx` (`Breadcrumb`/`BreadcrumbList`/`BreadcrumbItem`/`BreadcrumbLink`/
     `BreadcrumbSeparator`/`BreadcrumbPage`). Collapse to an ellipsis (`BreadcrumbEllipsis`) if a
     trail exceeds ~4 crumbs.
  4. Place it in the `PageHeader` breadcrumb slot so every feature screen gets breadcrumbs by
     composing `PageHeader`. Keep the top-level `/dashboard` root implicit or as the first crumb.
- **Acceptance Criteria**:
  - On `/accounts`, the breadcrumb shows a trail ending in "Accounts" (non-link current page).
  - On a nested route (`/accounts/[id]`), the trail shows Accounts → <entity name> when an override
    is passed, or a sensible fallback otherwise.
  - Each non-final crumb links to its ancestor route and navigates correctly.
  - Long trails collapse via an ellipsis without breaking layout.
  - The current page crumb carries `aria-current="page"`; renders correctly in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] `PageHeader` consumers get breadcrumbs for free (no per-page manual assembly for the common case)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: S
- **Estimated Hours**: 2-3
- **Documentation References**: Read [../../routes.md](../../routes.md) (route hierarchy),
  [../../ui-design-system.md](../../ui-design-system.md) (Typography/Accessibility), and
  [../../naming-conventions.md](../../naming-conventions.md) (route segments) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: navigate across top-level and
  nested routes; confirm labels, links, current-page marking, and ellipsis collapse; pass a dynamic
  override and confirm it shows; toggle theme.

---

### SHELL-009: Notifications dropdown UI

- **Task ID**: `SHELL-009`
- **Epic**: Design System & Shell
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Notifications dropdown UI (subscribes to `notifications` subcollection, unread badge, mark-as-read)
- **Objective**: Add a topbar notifications bell that subscribes to the current user's
  `organizations/{orgId}/notifications` documents (their own only), shows an unread count badge,
  lists recent notifications, and lets the user mark items read (the self-serve read-receipt
  pattern) — updating only the `read`/`readAt` fields.
- **Business Value**: In-app notifications ("task assigned to you", "opportunity stalling") make the
  CRM feel alive and collaborative in the demo, and exercise a real Firestore subscription end-to-end.
- **Dependencies**: `SHELL-002` (topbar). The `notifications` collection shape is defined in
  [../../database-schema.md](../../database-schema.md); documents are written server-side (Dev 1/3).
  **Soft**: build against a typed mock array matching the notification shape, then swap to a real
  `onSnapshot`/TanStack Query subscription. Mark-as-read uses the client SDK per the read-receipt
  rule (only `read`/`readAt` are client-writable) — confirm the exact write path with Dev 1.
- **Target Files**:
  - `components/shared/notifications-menu.tsx` (new, `"use client"`)
  - `components/shared/app-topbar.tsx` (mount the bell)
  - `features/notifications/hooks/use-notifications.ts` (new — subscription hook; coordinate the
    `features/notifications/` folder)
  - `schemas/notification-schema.ts` (if not already present — the Zod shape for a notification;
    coordinate ownership with Dev 1/3)
- **Technical Instructions**:
  1. Model the notification shape as a Zod schema matching
     [../../database-schema.md](../../database-schema.md): `notificationId`, `targetUserId`, `type`,
     `title`, `relatedTo { type, id }`, `read`, `readAt`, `createdAt`. Read only the current user's
     notifications (`targetUserId == uid`), unread-first (`read ASC, createdAt DESC`) — the composite
     index already exists per the schema doc.
  2. `use-notifications.ts` subscribes via the client SDK `onSnapshot` (or a polling TanStack Query
     query) scoped to `organizations/{orgId}/notifications` filtered to the user. Firestore reads go
     through the client SDK here (this is a client-side subscription, not a repository/Server Action
     read) — confirm this is acceptable with Dev 1 given the security rules already permit a user to
     read their own notifications.
  3. `NotificationsMenu` is a `dropdown-menu.tsx` (or `popover.tsx` + `scroll-area.tsx`) triggered
     by a bell `Button variant="ghost" size="icon"` with an unread-count `Badge` overlay
     (hidden when zero). List each notification with title, relative time (`text-xs
text-muted-foreground`), and an unread indicator (dot + not-color-only text/weight).
  4. Mark-as-read: clicking a notification (or a "Mark all read" action) updates only `read`/`readAt`
     on that document via the client SDK, per the self-serve read-receipt pattern in
     [../../database-schema.md](../../database-schema.md). Never mutate other fields.
  5. Empty state uses `EmptyState` (SHELL-005). Keyboard-operable via Radix; bell has `aria-label`
     including the unread count for screen readers.
- **Acceptance Criteria**:
  - The topbar bell shows an unread-count badge that reflects unread notifications and disappears at zero.
  - Opening the menu lists recent notifications, unread ones visually distinguished (not by color alone).
  - Marking a notification read updates only `read`/`readAt` and decrements the badge.
  - New notifications appear without a full page reload (subscription or poll).
  - Empty state renders when there are none; renders correctly in both themes; bell is keyboard-reachable.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (against the mock, then real data once available)
  - [ ] Only `read`/`readAt` are written from the client (verified against the security-rule constraint)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Read [../../database-schema.md](../../database-schema.md)
  (`notifications`), [../../architecture.md](../../architecture.md) (Firestore/auth), and
  [../../ui-design-system.md](../../ui-design-system.md) (Accessibility, EmptyState) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: seed mock notifications with mixed
  read/unread → confirm badge count and ordering; mark one read → badge decrements and only
  `read`/`readAt` change; clear all → empty state; add a mock/real doc → appears live; keyboard-open
  the bell; toggle theme.

---

### SHELL-010: Form kit — RHF + Zod field wrappers, combobox, date picker, currency/number, multi-select

- **Task ID**: `SHELL-010`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Form kit — React-Hook-Form + Zod resolver field wrappers, combobox, date picker, currency/number input, multi-select
- **Objective**: Build the reusable form-building kit every CRM create/edit form needs — thin
  wrappers over shadcn `field.tsx` for RHF + Zod, plus composed controls (combobox owner/account
  picker, date picker on `calendar.tsx`+`popover.tsx`, currency/number input, multi-select) — so
  feature forms are consistent and low-boilerplate.
- **Business Value**: Every entity in the CRM is created/edited through a form; a consistent,
  validated, accessible form kit makes all of Developer 3's Sprint 2 CRUD screens look and behave
  identically and cuts their build time.
- **Dependencies**: `SHELL-004` (combobox primitives / any deps installed). Uses the Forms
  convention already documented in [../../ui-design-system.md](../../ui-design-system.md).
- **Target Files**:
  - `components/shared/form/field-wrapper.tsx` (new — `Field`+`FieldLabel`+`FieldContent`+
    `FieldDescription`+`FieldError` composed with RHF error wiring)
  - `components/shared/form/combobox-field.tsx` (new — `command`+`popover`, RHF `Controller`)
  - `components/shared/form/date-picker-field.tsx` (new — `calendar`+`popover`, `Controller`)
  - `components/shared/form/currency-input.tsx` / `number-input.tsx` (new)
  - `components/shared/form/multi-select-field.tsx` (new)
  - `components/shared/form/index.ts` (barrel export)
- **Technical Instructions**:
  1. Follow the Forms section of [../../ui-design-system.md](../../ui-design-system.md) exactly:
     this shadcn version has **no** legacy `Form`/`FormField` context — compose `FieldSet`/
     `FieldGroup`/`Field`/`FieldLabel`/`FieldContent`/`FieldDescription`/`FieldError` from
     `field.tsx`. Native inputs use RHF `register`; non-native shadcn controls (`Select`,
     `Checkbox`, `Switch`, `Calendar`, combobox, multi-select) use `Controller`.
  2. `field-wrapper.tsx` centralizes the `aria-invalid` + `data-invalid` mirroring so the
     destructive styling baked into `field.tsx`/`input.tsx` activates consistently, and renders
     `FieldError` (which already has `role="alert"`). Accept `{ name, label, description?, error,
children }`.
  3. `combobox-field.tsx`: the owner/account picker Developer 3 needs — `command.tsx` inside
     `popover.tsx`, searchable, single-select, `Controller`-bound, with an accessible trigger.
  4. `date-picker-field.tsx`: `calendar.tsx` inside `popover.tsx`, `Controller`-bound, stores an
     ISO date string (matching the Firestore field convention in
     [../../database-schema.md](../../database-schema.md), e.g. `expectedCloseDate`).
  5. `currency-input.tsx` / `number-input.tsx`: numeric input that formats display and stores a
     number; currency variant pairs with a currency code (default from org `settings.defaultCurrency`
     when available). Keep parsing robust (no `NaN` leaking to the schema).
  6. `multi-select-field.tsx`: for array fields (e.g. `optedOutChannels`, campaign
     `targetAccountIds`) — `command.tsx`-based tag/checkbox multiselect, `Controller`-bound to a
     string array.
  7. The Zod schema in `schemas/` (or `features/*/schemas/`) stays the single source of truth for
     both the `z.infer` type and the resolver — these wrappers never define validation.
- **Acceptance Criteria**:
  - A sample form composed only from the kit validates via a Zod resolver, shows inline errors with
    correct `aria-invalid`/`data-invalid`, and blocks submit on invalid input.
  - The combobox filters options as you type and binds the selection to the form value.
  - The date picker stores an ISO date string and displays it formatted.
  - Currency/number inputs store real numbers (never `NaN`/strings) and format the display.
  - Multi-select binds to a string array and renders selected items.
  - All controls are keyboard-operable and render correctly in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Kit is feature-agnostic; validation lives only in `schemas/`, not the wrappers
  - [ ] [../../ui-design-system.md](../../ui-design-system.md) Forms section referenced (add a note
        pointing to the kit if helpful)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 6-9
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Forms),
  [../../database-schema.md](../../database-schema.md) (field types/enums), and
  [../../naming-conventions.md](../../naming-conventions.md) (schema/type naming) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: build a throwaway form using every
  wrapper against a sample Zod schema; submit invalid → inline errors + blocked submit; exercise
  combobox filtering, date selection, currency parsing (try letters, decimals), multi-select;
  keyboard-only pass; toggle theme; remove the throwaway page before PR.

---

### SHELL-011: Empty/error/loading state library + skeletons + route-level boundaries

- **Task ID**: `SHELL-011`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Empty/error/loading state library + skeletons + route-level `error.tsx`/`loading.tsx` boundaries
- **Objective**: Standardize the three non-happy-path states across the app — an error-state
  component, a per-surface skeleton set (table, cards, form, chart), and route-level `loading.tsx` /
  `error.tsx` boundaries under `app/(dashboard)/` — extending the SHELL-005 `EmptyState` into a
  complete state library.
- **Business Value**: Consistent loading/error/empty states are what separate a polished demo from a
  janky one — no flashes of blank screens, no unhandled error white-screens in front of judges.
- **Dependencies**: `SHELL-002` (shell), `SHELL-005` (`EmptyState`). `skeleton.tsx`/`alert.tsx` are
  installed.
- **Target Files**:
  - `components/shared/error-state.tsx` (new — with retry action)
  - `components/shared/skeletons/table-skeleton.tsx`, `card-skeleton.tsx`, `form-skeleton.tsx`,
    `chart-skeleton.tsx` (new)
  - `app/(dashboard)/loading.tsx`, `app/(dashboard)/error.tsx` (new — group-level boundaries;
    `error.tsx` must be a Client Component per Next.js)
  - Per-route `loading.tsx`/`error.tsx` can be added by feature owners; provide the reusable pieces
    they compose
- **Technical Instructions**:
  1. **`ErrorState`**: props `{ title?, description?, onRetry?, error? }`, built on `alert.tsx`
     (`variant="destructive"`) or a centered layout with a retry `Button`. Used by `error.tsx`
     boundaries and inline data-fetch failures.
  2. **Skeletons**: build `skeleton.tsx`-based components whose footprint matches the real content
     (`TableSkeleton` mirrors the `DataTable` header + N rows; `ChartSkeleton` matches the Recharts
     `ResponsiveContainer` fixed height per the Charts convention; `CardSkeleton`/`FormSkeleton`
     likewise) so there is no layout shift when data resolves — a rule already stated for charts in
     [../../ui-design-system.md](../../ui-design-system.md).
  3. **Route boundaries**: `app/(dashboard)/loading.tsx` renders a shell-aware skeleton (so the
     sidebar/topbar stay put while content streams). `app/(dashboard)/error.tsx` is a
     `"use client"` component (Next.js requires it) receiving `{ error, reset }` and rendering
     `ErrorState` with `reset` wired to its retry. Follow the App Router error/loading conventions —
     read the version-specific guide in `node_modules/next/dist/docs/` per
     [../../../AGENTS.md](../../../AGENTS.md) before implementing, since these APIs may differ from
     older Next.js.
  4. Keep everything theme-safe and accessible (errors use `role="alert"` semantics; retry buttons
     are real buttons with labels).
- **Acceptance Criteria**:
  - Navigating to a slow/streaming route shows the shell-aware `loading.tsx` skeleton (sidebar/
    topbar remain), not a blank page.
  - A thrown error inside the dashboard group renders `error.tsx` with a message and a working
    "Try again" (`reset`) button rather than a white screen.
  - Each skeleton visually matches the footprint of the content it replaces (no layout shift on load).
  - `ErrorState` renders standalone for inline fetch failures with an optional retry.
  - All states render correctly in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] `error.tsx` is a Client Component and correctly wires `reset`
  - [ ] Version-specific Next.js error/loading docs were consulted (per AGENTS.md)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Read `node_modules/next/dist/docs/` (App Router error/loading — per
  AGENTS.md), [../../ui-design-system.md](../../ui-design-system.md) (Charts skeleton rule, Tables
  empty state), and [../../folder-structure.md](../../folder-structure.md) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: throttle/delay a route to see the
  loading skeleton; throw a deliberate error in a page to see `error.tsx` + confirm "Try again"
  recovers; visually compare each skeleton against its loaded content for shift; toggle theme.

---

### SHELL-012: Toast/feedback conventions (`sonner`) for Server Action results

- **Task ID**: `SHELL-012`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Toast/feedback conventions (`sonner`) for Server Action success/error results
- **Objective**: Establish a single helper + documented convention for surfacing Server Action
  results (`{ ok: true, data } | { ok: false, error }`) as `sonner` toasts, so every feature reports
  success/error identically instead of each screen hand-rolling toast calls.
- **Business Value**: Consistent, immediate feedback on every save/delete/trigger action is what
  makes the app feel responsive and trustworthy in a live demo — and prevents the "did that
  work?" ambiguity in front of judges.
- **Dependencies**: none hard (`sonner.tsx` is installed and the toaster is mounted in
  `providers/app-providers.tsx`). Pairs with the Server Action result shape defined in `api.md` /
  [../../architecture.md](../../architecture.md).
- **Target Files**:
  - `hooks/use-action-toast.ts` (new — or `utils/action-toast.ts` if framework-agnostic) wrapping
    `sonner`'s `toast`
  - `providers/app-providers.tsx` (confirm the `Toaster` is mounted with sensible defaults/position;
    adjust only if needed — this is the composition root)
  - A short convention note added to the relevant doc (see Documentation References)
- **Technical Instructions**:
  1. Define the canonical result-to-toast mapping keyed on the shared Server Action return shape
     (`{ ok: true, data } | { ok: false, error }` from [../../architecture.md](../../architecture.md)):
     `ok` → `toast.success(message)`, `!ok` → `toast.error(error)`; support an optional loading/
     promise form (`toast.promise`) for longer actions.
  2. Provide `useActionToast()` (or a pure `notifyActionResult(result, { success, error })` helper)
     so a component can do `notifyActionResult(await createAccount(input), { success: "Account
created" })`. Field-specific validation errors still render via `FieldError` (SHELL-010) — the
     toast is for the top-level result/transient errors, matching the Forms guidance in
     [../../ui-design-system.md](../../ui-design-system.md).
  3. Confirm the `Toaster` (from `sonner.tsx`) is mounted once in
     `providers/app-providers.tsx` with a consistent position and theme binding (it should inherit
     `next-themes`). Do not mount additional toasters elsewhere.
  4. Keep it framework-light and typed to the result shape so misuse is caught at compile time.
- **Acceptance Criteria**:
  - Calling the helper with an `{ ok: true }` result shows a success toast; an `{ ok: false, error }`
    shows an error toast with the error message.
  - Toasts render in a consistent position and respect the current theme.
  - The promise/loading form shows a pending toast that resolves to success/error.
  - Only one `Toaster` is mounted (no duplicate stacks).
  - The convention is documented so other developers use the helper rather than raw `toast` calls.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Helper is typed to the shared Server Action result shape
  - [ ] Convention documented in the appropriate doc (see below)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: S
- **Estimated Hours**: 1-2
- **Documentation References**: Read [../../architecture.md](../../architecture.md) (Server Action
  result shape) and [../../ui-design-system.md](../../ui-design-system.md) (Forms → toast on
  `{ ok: false }`) before starting; add the toast convention note to
  [../../ui-design-system.md](../../ui-design-system.md) (or `api.md` if the team prefers it there).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: wire the helper to a stubbed
  action returning `ok`/`!ok`/a rejecting promise; confirm success/error/loading toasts; toggle
  theme mid-toast; confirm only one toaster stack exists.

---

### SHELL-013: DataTable enhancements — column visibility, filtering, faceted filters, pagination, row actions

- **Task ID**: `SHELL-013`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: DataTable enhancements — column visibility, filtering, faceted filters, pagination controls, row actions
- **Objective**: Extend the SHELL-005 `DataTable` wrapper with a toolbar (text search + faceted
  categorical filters), column-visibility toggling, richer pagination controls, and a standardized
  row-actions menu — the full "power-user table" every list view needs.
- **Business Value**: Dense, filterable, configurable tables are the heart of a CRM's daily use and
  a strong "this is a real product" signal to judges when they filter Accounts by vertical or hide
  columns live.
- **Dependencies**: `SHELL-005` (`DataTable` base), `SHELL-004` (primitives/deps). Pairs with the
  Tables conventions in [../../ui-design-system.md](../../ui-design-system.md).
- **Target Files**:
  - `components/shared/data-table.tsx` (extend)
  - `components/shared/data-table-toolbar.tsx` (new — search + faceted filters)
  - `components/shared/data-table-faceted-filter.tsx` (new — `popover`+`command` multi-value filter)
  - `components/shared/data-table-view-options.tsx` (new — column-visibility `dropdown-menu`)
  - `components/shared/data-table-pagination.tsx` (new — page size + page nav on `pagination.tsx`)
- **Technical Instructions**:
  1. **Toolbar**: a text `input.tsx` search (debounced via `hooks/use-debounced-value`) plus one or
     more faceted filters, per the "Sorting/filtering" rule in
     [../../ui-design-system.md](../../ui-design-system.md) — filters live in a toolbar **above** the
     table, not inline per-column rows. Use `select.tsx` for single-value categorical filters and a
     `popover.tsx`+`command.tsx` faceted filter for multi-value (e.g. filter Accounts by multiple
     `vertical`s). Show active-filter chips with a "Reset" button.
  2. **Column visibility**: a `data-table-view-options.tsx` `dropdown-menu.tsx` of toggleable
     columns (only columns marked hideable). If SHELL-004 adopted `@tanstack/react-table`, drive
     this off its column-visibility state; otherwise track a local visibility map.
  3. **Pagination**: `data-table-pagination.tsx` on `pagination.tsx` with page-size select and
     prev/next — remain **server-driven** (accept page/cursor + total/hasNext props; do not slice a
     full client dataset), matching the Firestore query-level pagination rule in
     [../../database-schema.md](../../database-schema.md).
  4. **Row actions**: standardize a trailing actions column using `dropdown-menu.tsx` triggered by
     an icon-only `Button variant="ghost" size="icon"` with `aria-label`, keyboard-operable
     (Radix) — no hover-only affordances (Accessibility rule).
  5. Keep all additions optional/composable so a simple list (SHELL-005 baseline) still works
     without a toolbar. Preserve sticky header + density from SHELL-005.
- **Acceptance Criteria**:
  - The table toolbar filters rows by text search and by one or more faceted categorical values;
    active filters show chips and a working reset.
  - Columns can be shown/hidden via the view-options menu and the table reflows accordingly.
  - Pagination controls change page and page size and drive server-side params (not client slicing).
  - Every row exposes a keyboard-operable actions dropdown with `aria-label`ed trigger.
  - Sticky header and `text-sm`/`py-2` density from SHELL-005 are preserved; renders in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Enhancements are opt-in (baseline `DataTable` still renders without a toolbar)
  - [ ] Pagination stays server-driven (no full-dataset client slicing)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 6-9
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Tables,
  Accessibility), [../../database-schema.md](../../database-schema.md) (pagination at the query
  level), and [../../decisions.md](../../decisions.md) (table lib choice from SHELL-004) before
  starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: mount the enhanced table with
  sample rows; search + apply/clear faceted filters; toggle column visibility; change page/size and
  confirm the server-param callback fires (log it); operate the row-actions menu by keyboard;
  confirm sticky header + density unchanged; toggle theme.

---

### SHELL-014: Reusable detail-page layout pattern (header + tabs + right-rail timeline)

- **Task ID**: `SHELL-014`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Reusable detail-page layout pattern (header + tabs + right-rail timeline) for entity detail screens
- **Objective**: Build a reusable detail-page scaffold — a summary header (name, status badge,
  key metadata, actions), a `tabs.tsx` content area, and an optional right-rail timeline slot — that
  `/accounts/[id]`, `/opportunities/[id]`, `/contacts/[id]`, and `/contracts/[id]` all compose,
  keeping every entity detail screen structurally identical.
- **Business Value**: A single detail layout means every record in the CRM opens to the same
  predictable shape, which reads as a mature, coherent product to judges and lets Developer 3 build
  four detail pages by filling slots instead of designing four layouts.
- **Dependencies**: `SHELL-005` (`PageHeader`/cards), `SHELL-008` (breadcrumbs). `tabs.tsx`,
  `card.tsx`, `avatar.tsx`, `separator.tsx`, `scroll-area.tsx` are installed. The timeline data is
  a query over `activities` (Developer 3) — **soft**: provide the timeline slot + item component and
  build against mock activity items.
- **Target Files**:
  - `components/shared/detail-layout.tsx` (new — the scaffold)
  - `components/shared/detail-header.tsx` (new — summary card header)
  - `components/shared/timeline.tsx` + `components/shared/timeline-item.tsx` (new — right-rail
    activity feed presentation)
- **Technical Instructions**:
  1. `DetailLayout` accepts `{ header, tabs, rail? }` and lays out a responsive two-column grid:
     main content (header + tabbed body) constrained to a readable width and a right rail on `lg+`
     that collapses below the timeline into the main column on narrow viewports. Use the page
     container guidance from [../../ui-design-system.md](../../ui-design-system.md) (detail pages
     can constrain to `max-w-5xl` for form/card-heavy layouts).
  2. `DetailHeader` follows the "Cards → Standard entity summary card anatomy": `CardTitle` = entity
     name, `CardDescription` = classification metadata (vertical/tier/stage), status/score as a
     `Badge` in `CardAction` (never raw colored text), an `avatar.tsx` for owner, and an actions row
     (`default` primary + `outline`/`ghost` secondary). Include a breadcrumb slot (SHELL-008).
  3. Tabs use `tabs.tsx` (e.g. Overview / Contacts / Opportunities / Contracts / Timeline for an
     account, per [../../routes.md](../../routes.md)); the layout provides the tab shell, features
     provide tab content.
  4. `Timeline`/`TimelineItem` render the activity feed: each item shows an icon by activity `type`
     (`note_added`, `stage_changed`, `email_logged`, `balloads_campaign_triggered`,
     `ai_insight_generated`, …), actor, relative `occurredAt` time, and a `type`-specific summary
     line. Build against the `activities` shape in [../../database-schema.md](../../database-schema.md)
     (remember: there is **no `timeline` collection** — it's a query over `activities` filtered by
     `relatedTo`). Wrap the rail in `scroll-area.tsx`.
  5. Keep everything generic and slot-based; no entity-specific logic in the shared layer.
- **Acceptance Criteria**:
  - A demo detail page composes `DetailLayout` with a header, ≥2 tabs, and a right-rail timeline.
  - The summary header shows name, classification, a status/score `Badge` (with text label, not
    color-only), owner avatar, and an actions row.
  - Tabs switch content; the layout is keyboard-operable.
  - The timeline renders mixed activity types with distinct icons, actor, and relative time; it
    scrolls independently and collapses into the main column on narrow viewports.
  - Renders correctly in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (against mock activities, then real once available)
  - [ ] Layout is fully slot-based and feature-agnostic
  - [ ] Timeline built against the `activities` shape (no assumption of a `timeline` collection)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 6-8
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Cards,
  Dialogs vs sheets, Responsive), [../../routes.md](../../routes.md) (detail routes and their tabs),
  [../../database-schema.md](../../database-schema.md) (`activities`), and
  [../../decisions.md](../../decisions.md) (no `timeline` collection) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: mount a demo detail page with mock
  data; switch tabs by mouse and keyboard; scroll the timeline independently; resize to confirm the
  rail collapses; confirm status renders as a labeled badge; toggle theme.

---

### SHELL-015: Kanban board primitive (drag-and-drop columns/cards) for the opportunity pipeline

- **Task ID**: `SHELL-015`
- **Epic**: Design System & Shell
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Kanban board primitive (drag-and-drop columns/cards) for the opportunity pipeline view
- **Objective**: Build a reusable kanban board primitive — stage columns with draggable cards and an
  `onMoveCard(cardId, fromColumn, toColumn)` callback — that the `/opportunities` pipeline view
  (Developer 3, CRM-021) composes to render deals by stage and move them between stages.
- **Business Value**: A drag-and-drop pipeline is the archetypal "sales CRM" visual and one of the
  strongest demo moments — dragging a deal from Negotiation to Closed-Won in front of judges is the
  core Sales Pipelines story.
- **Dependencies**: none hard. Consumed by backlog `CRM-021` (Developer 3). Requires a DnD approach:
  choose a library (e.g. `@dnd-kit/*`) or a minimal HTML5 drag implementation and record the choice
  in [../../decisions.md](../../decisions.md). The stage list comes from
  `organizations/{orgId}/settings/{settingId=pipeline}` (per [../../database-schema.md](../../database-schema.md))
  — **soft**: build against the default stage array (`prospecting`, `qualification`, `proposal`,
  `negotiation`, `closed_won`, `closed_lost`) and mock cards.
- **Target Files**:
  - `components/shared/kanban/kanban-board.tsx` (new)
  - `components/shared/kanban/kanban-column.tsx` (new)
  - `components/shared/kanban/kanban-card.tsx` (new)
  - `package.json` / `package-lock.json` (DnD dependency, if adopted)
  - `constants/` (may reference/import the default pipeline stages if a constant is introduced —
    per [../../folder-structure.md](../../folder-structure.md), e.g. `OPPORTUNITY_STAGES`)
- **Technical Instructions**:
  1. Model the board generically: `KanbanBoard<TCard>` accepts `{ columns: { id, title }[], cards:
TCard[], getColumnId(card), renderCard(card), onMoveCard(cardId, from, to) }`. It knows nothing
     about opportunities specifically — CRM-021 supplies opportunity cards and the move handler
     (which will call `moveOpportunityStage`).
  2. Columns are built from `card.tsx` per [../../ui-design-system.md](../../ui-design-system.md)
     (no dedicated shadcn kanban primitive exists — this is that primitive). Each column shows its
     stage title, a count `Badge`, and a scrollable (`scroll-area.tsx`) card list.
  3. `KanbanCard` follows the entity-card anatomy: name, a stage/qualification-score `Badge` (text-
     labeled, not color-only), amount, and a `dropdown-menu.tsx` for per-card quick actions.
  4. Implement drag-and-drop with the chosen approach; on drop into a different column, call
     `onMoveCard` optimistically (the consumer persists via its Server Action and reconciles).
     **Accessibility is mandatory**: provide a keyboard-operable move path (e.g. a card actions
     menu "Move to stage →" submenu) so the board is not drag-only — per the keyboard-navigation
     requirement in [../../ui-design-system.md](../../ui-design-system.md). Record the DnD library
     decision in [../../decisions.md](../../decisions.md).
  5. Keep the board horizontally scrollable on narrow viewports (`overflow-x-auto`) rather than
     collapsing columns, consistent with the desktop-first Responsive rules.
- **Acceptance Criteria**:
  - The board renders one column per provided stage, each with its cards and a live count badge.
  - A card can be dragged to another column, firing `onMoveCard(cardId, from, to)` and moving
    optimistically.
  - A keyboard-only path can move a card between stages (not drag-only).
  - Cards show name, amount, and a text-labeled status badge (not color alone).
  - The board scrolls horizontally on narrow viewports; renders correctly in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Board is generic (`TCard`) with no opportunity-specific logic baked in
  - [ ] DnD library/approach recorded in [../../decisions.md](../../decisions.md)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 7-10
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Cards,
  Accessibility, Responsive), [../../routes.md](../../routes.md) (`/opportunities`),
  [../../database-schema.md](../../database-schema.md) (`opportunities`/`settings` stages), and
  [../../decisions.md](../../decisions.md) before starting; record the DnD decision there.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: mount the board with mock columns/
  cards; drag a card across columns and confirm `onMoveCard` fires with correct args and the card
  moves; move a card via the keyboard path; resize to confirm horizontal scroll; confirm count
  badges update; toggle theme.
