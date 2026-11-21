# Phase 1 - Shell & Design System foundation

Phase 1 is the Sprint 1 "deployable skeleton" work for Developer 2: the app has to _look like a
product_ before any feature does. It delivers the `/login` page UI, the sidebar/topbar app shell
wired to `config/site.ts`'s `primaryNav`, the dashboard shell with KPI placeholders, the extra
`shadcn/ui` primitives CRM list/detail views need, the first `components/shared/` composed
primitives Developer 3 will consume, and the command menu wired to Redux. Landing SHELL-002 and
SHELL-005 **early** is the single biggest de-risking move in Sprint 1 - it shrinks the window in
which Developer 3 is building Accounts against a throwaway unstyled layout (see the soft-dependency
note in [../../sprint-plan.md](../../sprint-plan.md#the-developer-2--developer-3-soft-dependency)).

Task IDs/titles below match the Sprint 1 table in [../developer-2.md](../developer-2.md) exactly.
Fields follow [../task-template.md](../task-template.md).

---

### SHELL-001: Build `/login` page UI (email/password + Google button, error states)

- **Task ID**: `SHELL-001`
- **Epic**: Design System & Shell
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: Build `/login` page UI (email/password + Google button, error states)
- **Objective**: Build the public `/login` page's presentation and client-side interaction layer -
  the auth card, email/password fields, a "Continue with Google" button, submit/loading state, and
  inline + toast error surfaces - wired to a stubbed sign-in handler so the screen is fully
  demoable before Developer 1's real Firebase Auth flow (INFRA-002/003) lands.
- **Business Value**: `/login` is the first screen a judge sees; a polished, on-brand sign-in that
  visibly handles errors sets the quality bar for the whole product and unblocks the "sign in →
  land on dashboard" demo narrative the moment real auth is wired behind it.
- **Dependencies**: `INFRA-002` (Firebase Auth sign-in) and `INFRA-003` (session cookie issuance)
  - **soft**: build against a stubbed `signIn`/`create-session` handler with the signature Dev 1
    confirms (even a stub is enough for Definition of Ready per [../developer-2.md](../developer-2.md));
    swap the stub for the real client SDK call + `create-session` Server Action once they land.
- **Target Files**:
  - `app/login/page.tsx` (Server Component route shell - page metadata, centered layout)
  - `features/auth/components/login-form.tsx` (new - the `"use client"` form; coordinate the
    `features/auth/` folder name with Developer 1 so the auth feature isn't double-created)
  - `components/ui/*` - add `alert` if not already present (it is, per the installed inventory)
  - Do **not** create `actions/auth/create-session.ts` here - that is INFRA-002/003; import its
    typed signature only.
- **Technical Instructions**:
  1. `app/login/page.tsx` is a Server Component: no auth data, just a centered full-height layout
     (`min-h-svh grid place-items-center px-4`) rendering the `LoginForm` client component inside a
     `card.tsx` (`Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`).
     Set page `metadata` from `siteConfig` (`config/site.ts`).
  2. Use the shadcn **Forms** stack from [../../ui-design-system.md](../../ui-design-system.md):
     React Hook Form + `zodResolver`, composing `FieldSet`/`FieldGroup`/`Field`/`FieldLabel`/
     `FieldContent`/`FieldError` from `components/ui/field.tsx` with `input.tsx` for email/password.
     Define a local `loginSchema` (email `z.string().email()`, password `z.string().min(1)`) in
     `features/auth/schemas/login-schema.ts` (or reuse Dev 1's if it already exists - check first).
  3. Primary submit is a `button.tsx` `default` variant, full-width, showing a loading label
     (`isSubmitting ? "Signing in…" : "Sign in"`) and `disabled` while submitting. The
     "Continue with Google" button is an `outline` variant with a `lucide` icon, in `CardFooter`
     (or below a `separator.tsx` labeled "or").
  4. Auth failures render in an `alert.tsx` (`variant="destructive"`) at the top of the card
     (e.g. "Invalid email or password") **and** a `sonner` toast for transient/network errors,
     per the toast convention (formalized in SHELL-012). Field-shape errors render via `FieldError`
     with `aria-invalid` + `data-invalid` on the `Field`.
  5. The submit handler calls an injected/stubbed async `onSubmit(values)` that resolves
     `{ ok: true }` or `{ ok: false, error }`. On `ok`, `router.push("/dashboard")` (redirect
     wiring is finalized by INFRA-003). Keep the stub in one place so the real swap is a one-liner.
  6. Follow [../../naming-conventions.md](../../naming-conventions.md) (kebab-case files, PascalCase
     exports) and the Server/Client split rule in [../../architecture.md](../../architecture.md)
     (only the form is `"use client"`).
- **Acceptance Criteria**:
  - Visiting `/login` renders a centered auth card with email, password, a primary "Sign in"
    button, and a "Continue with Google" button.
  - Submitting empty/invalid fields shows inline `FieldError` messages and does not call the
    submit handler.
  - A simulated failed sign-in (stub returns `{ ok: false }`) shows a destructive `alert` in the
    card and/or a `sonner` toast; a simulated success routes to `/dashboard`.
  - The submit button shows a loading state and is disabled while the handler is pending.
  - The page renders correctly in both light and dark mode using semantic tokens only (no raw hex).
  - Keyboard-only: tab order reaches email → password → sign in → Google; Enter submits.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Stub handler isolated with a `// TODO(INFRA-002/003)` marker for the real swap
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
        (lint/typecheck/build, docs updated, PR reviewed, `../progress.md` + `../changelog.md`
        updated, task moved to [../completed.md](../completed.md))
  - [ ] [../../routes.md](../../routes.md) `/login` row updated to note the UI is built (flag the
        auth-logic portion still owned by INFRA-002/003)
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Forms,
  Buttons, Colors), [../../routes.md](../../routes.md) (`/login` row), and
  [../../architecture.md](../../architecture.md) (auth flow, Server/Client split) before starting;
  update [../../routes.md](../../routes.md) as part of the change.
- **Testing Notes**: No automated test framework is installed yet (arrives via `INFRA-012`; see
  [../../risks.md](../../risks.md)). Manual: run `npm run dev`, open `/login`; submit blank →
  confirm inline errors; drive the stub to return `{ ok: false }` → confirm alert/toast; drive it
  to `{ ok: true }` → confirm `/dashboard` navigation; toggle the theme and re-verify contrast;
  tab through with keyboard only.

---

### SHELL-002: App shell layout - sidebar + topbar wired to `primaryNav`, responsive collapse

- **Task ID**: `SHELL-002`
- **Epic**: Design System & Shell
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: App shell layout - sidebar + topbar wired to `config/site.ts` `primaryNav`, responsive collapse
- **Objective**: Introduce the `(dashboard)` route-group layout that renders the persistent left
  sidebar (nav from `config/site.ts`'s `primaryNav`) and the topbar, with the desktop rail collapse
  driven by `ui-slice`'s `sidebarCollapsed` and a mobile `sheet.tsx` drawer below `md`. This is the
  chrome every authenticated route renders inside.
- **Business Value**: Nothing looks like a product until the shell renders. This is the frame the
  whole demo lives in and the layout Developer 3's Accounts screens re-parent into - landing it
  early collapses the Dev 2/Dev 3 soft dependency.
- **Dependencies**: none (build against `primaryNav` and `ui-slice`, both already present). Session-
  backed topbar user data is deferred to SHELL-007; render a placeholder avatar/name here.
- **Target Files**:
  - `app/(dashboard)/layout.tsx` (new route-group layout - the shell)
  - `components/shared/app-sidebar.tsx` (new)
  - `components/shared/app-topbar.tsx` (new)
  - `components/shared/nav-item.tsx` (new - a single active-aware nav link)
  - `config/site.ts` (may extend `NavItem` with an `icon` key - coordinate/flag per
    [../../routes.md](../../routes.md) if labels/hrefs change; do not change existing hrefs)
  - `store/slices/ui-slice.ts` (consume existing `sidebarCollapsed`/`toggleSidebar`; add state only
    if a genuinely new UI flag is needed)
- **Technical Instructions**:
  1. Create the `app/(dashboard)/` route group so `/dashboard`, `/accounts`, etc. share this
     layout. `layout.tsx` is a Server Component that composes `AppSidebar` + `AppTopbar` around
     `{children}`, with the main content area using the page padding from the design system
     (`px-4 py-6 md:px-6`) and `max-w-screen-2xl mx-auto` for list pages.
  2. `AppSidebar` maps over `primaryNav` from `config/site.ts`, rendering each item via `NavItem`.
     Optionally extend `NavItem` in `config/site.ts` with a `lucide` icon name and resolve it to a
     component in `app-sidebar.tsx` (keep `config/site.ts` free of JSX imports - store the icon key
     as a string and map to the component in the client layer).
  3. `NavItem` is a `"use client"` leaf using `usePathname()` to compute active state
     (`pathname === href || pathname.startsWith(href + "/")`) and applying `bg-accent`/
     `text-accent-foreground` (or the reserved `sidebar-*` tokens) when active, `hover:bg-muted/50`
     otherwise. Icon-only mode (collapsed rail) must keep an accessible name (`aria-label` or a
     `tooltip.tsx`).
  4. Desktop collapse: read `sidebarCollapsed` from `store/hooks.ts`'s typed `useAppSelector`; the
     topbar hamburger dispatches `toggleSidebar`. Collapsed = icon-only rail (`w-16`), expanded =
     labeled (`w-64`). Per the design system, this collapse governs **`md` and above**.
  5. Mobile (`below md`): the sidebar is hidden; the topbar hamburger opens a `sheet.tsx` drawer
     (left side) containing the same `primaryNav`. Use the `hooks/use-media-query` helper (or add
     it under `hooks/` per [../../folder-structure.md](../../folder-structure.md)) to branch.
  6. `AppTopbar` holds: hamburger (`Button variant="ghost" size="icon"` + `aria-label`), a
     placeholder command-menu trigger (SHELL-006 wires it), a theme toggle (`next-themes`), and a
     placeholder user avatar (SHELL-007 backs it with session data). Breadcrumbs are SHELL-008.
  7. `app/page.tsx` may be updated to redirect authenticated users to `/dashboard` later (coordinate
     with Dev 1); in this task it is enough that the `(dashboard)` shell renders.
- **Acceptance Criteria**:
  - Every route under `app/(dashboard)/` renders inside a persistent sidebar + topbar.
  - The sidebar lists exactly the eight `primaryNav` items in order, each linking to its `href`.
  - The nav item matching the current route is visually marked active.
  - The topbar hamburger toggles the desktop rail between labeled and icon-only, and the state
    persists across client-side navigations (Redux-backed).
  - Below `md`, the sidebar collapses into a `sheet.tsx` drawer opened from the topbar; above `md`
    it is persistent.
  - Icon-only nav items expose an accessible name (verified via tooltip/`aria-label`).
  - Shell renders correctly in light and dark mode with no raw hex values.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] If `config/site.ts` `NavItem` was extended, [../../routes.md](../../routes.md) note added
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 6-8
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md)
  (Responsive rules, Spacing & grid, Colors) and [../../routes.md](../../routes.md) and
  [../../folder-structure.md](../../folder-structure.md) before starting; update
  [../../routes.md](../../routes.md) only if nav metadata/paths change.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: `npm run dev`, load
  `/dashboard`; click each nav item and confirm active styling + correct route; toggle the rail and
  navigate to confirm persistence; resize below 768px and confirm the drawer; toggle theme.

---

### SHELL-003: Dashboard shell page with KPI card placeholders

- **Task ID**: `SHELL-003`
- **Epic**: Design System & Shell
- **Priority**: P0
- **Owner**: Developer 2
- **Title**: Dashboard shell page with KPI card placeholders
- **Objective**: Build the `/dashboard` page inside the app shell - a responsive KPI-tile row plus
  chart/list placeholders - using skeleton/placeholder content so the post-login landing page is
  demoable before Developer 3's `getDashboardSummary` data action exists.
- **Business Value**: `/dashboard` is where the user lands after login; a populated-looking
  overview (even with placeholder numbers) proves the shell + navigation loop and gives the demo a
  credible "home base" to return to.
- **Dependencies**: `SHELL-002` (must render inside the shell). Real data via
  `getDashboardSummary` (Developer 3, `features/dashboard/`) is a **soft** dependency - build with
  hardcoded KPI values + `skeleton.tsx` and swap in the TanStack Query hook when it lands.
- **Target Files**:
  - `app/(dashboard)/dashboard/page.tsx` (new - or `app/(dashboard)/page.tsx` if `/dashboard` is
    the group index; match the path declared in [../../routes.md](../../routes.md))
  - `components/shared/kpi-card.tsx` (new - reusable KPI tile)
  - `features/dashboard/components/*` may be introduced for dashboard-specific composition
    (coordinate the `features/dashboard/` folder with Developer 3)
- **Technical Instructions**:
  1. Build the KPI row as a responsive grid (`grid gap-4 sm:grid-cols-2 xl:grid-cols-4`) of
     `KpiCard`s. `KpiCard` uses `card.tsx` per the "Cards" section of
     [../../ui-design-system.md](../../ui-design-system.md): `CardHeader` with `CardTitle`
     (`text-sm text-muted-foreground` label) and a `CardContent` with the large value
     (`text-2xl font-semibold`), plus an optional trend delta and a `lucide` icon in `CardAction`.
  2. Seed the four KPIs from the `/dashboard` spec in [../../routes.md](../../routes.md): open
     pipeline value, accounts at risk (by health score), contracts up for renewal, recent activity
     count. Use placeholder values now; render a `Skeleton` of the same footprint as the loading
     state so there is no layout shift when real data arrives.
  3. Below the KPI row, lay out placeholders for the future dashboard content: a pipeline-trend
     chart card (a `Skeleton` sized like the Recharts container that ANLY tasks fill) and an
     "at-risk accounts" mini-`table.tsx` (or an `EmptyState` from SHELL-005). Optionally split
     "My work" / "Team" with `tabs.tsx` per the routes spec.
  4. Keep the page a Server Component; push any interactive leaf (tab switch) into a small client
     component. When real data lands, fetch via a TanStack Query hook in `features/dashboard/hooks/`
     calling the read-only `getDashboardSummary` action - never call a repository from the page.
- **Acceptance Criteria**:
  - `/dashboard` renders inside the app shell with a responsive row of four KPI cards.
  - Each KPI card shows a label, a value, and (where relevant) a trend indicator using semantic
    tokens/`Badge`, not raw colored text.
  - Chart and list areas render sized placeholders/skeletons that do not shift layout.
  - The grid reflows to 2-up then 1-up as the viewport narrows.
  - Renders correctly in light and dark mode.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] `KpiCard` is generic enough to reuse on `/analytics` (no dashboard-only assumptions baked in)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Cards,
  Charts, Typography) and [../../routes.md](../../routes.md) (`/dashboard`) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: load `/dashboard`; confirm four
  KPI cards + placeholders; resize to confirm reflow; toggle theme; confirm the skeleton footprint
  matches the eventual content size (no jump when placeholders are swapped for real values).

---

### SHELL-004: Add/configure `shadcn/ui` components needed for CRM list/detail views

- **Task ID**: `SHELL-004`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Add/configure `shadcn/ui` components needed for CRM list/detail views (data-table deps, combobox)
- **Objective**: Add and verify the `shadcn/ui` primitives (and their underlying deps) that the
  CRM list/detail views and the shared `DataTable`/combobox will build on, so SHELL-005/013 and
  Developer 3's feature UI are not blocked waiting on a component to be generated.
- **Business Value**: Removes a silent blocker: the shared data-table and owner-picker combobox
  can't be built until their primitives exist. Doing this once, correctly (respecting the
  `radix-nova` style), keeps the whole component layer consistent for judges' eyes.
- **Dependencies**: none.
- **Target Files**:
  - `components/ui/*` (newly generated primitives - e.g. `command` already present for combobox;
    add `dropdown-menu` if missing (present), and any not-yet-installed primitive a data-table/
    combobox needs)
  - `components.json` (unchanged - the generator reads it; do not hand-edit style/base color)
  - `package.json` / `package-lock.json` (TanStack Table dependency if the data table is built on
    `@tanstack/react-table` - decide and record in [../../decisions.md](../../decisions.md))
- **Technical Instructions**:
  1. Cross-check the installed inventory in [../../ui-design-system.md](../../ui-design-system.md)
     (it lists exactly what exists). For the CRM list/detail work the shared layer needs:
     `command` (combobox base - present), `popover` (present), `dropdown-menu` (present, row
     actions), `checkbox` (present, row select), `pagination` (present). Add any that are genuinely
     missing with `npx shadcn@latest add <name>` so they inherit the `radix-nova`/`neutral` tokens.
  2. The combobox (owner/account picker Developer 3 needs) is composed from `command.tsx` +
     `popover.tsx` per the standard shadcn combobox recipe - build it as a reusable
     `components/shared/combobox.tsx` (or defer the composed component to SHELL-010's form kit and
     only ensure the primitives exist here). State clearly which is done here vs SHELL-010.
  3. If the `DataTable` wrapper (SHELL-005/013) will use TanStack Table, add
     `@tanstack/react-table` now and record the choice in [../../decisions.md](../../decisions.md)
     (headless table lib vs hand-rolled on `table.tsx`). Do not build the wrapper here - just make
     the dependency available and note the decision.
  4. Do not hand-edit generated files beyond what the generator produces; if a primitive needs a
     project tweak, keep it minimal and note it, since these are regenerable.
- **Acceptance Criteria**:
  - Every primitive the shared `DataTable` and combobox depend on exists in `components/ui/` and
    imports/renders without error.
  - Newly added components use the `radix-nova` style / `neutral` base color (visually consistent
    with existing primitives in both themes).
  - If TanStack Table is adopted, it is installed and the choice is recorded in
    [../../decisions.md](../../decisions.md).
  - `npm run build` and `tsc --noEmit` pass with the new deps.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] [../../ui-design-system.md](../../ui-design-system.md) component inventory updated to list
        any newly added primitives
  - [ ] Any dependency/architecture choice recorded in [../../decisions.md](../../decisions.md)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: S
- **Estimated Hours**: 1-2
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md)
  (Component inventory) and [../../decisions.md](../../decisions.md) before starting; update the
  component inventory in [../../ui-design-system.md](../../ui-design-system.md) and record any
  dependency decision in [../../decisions.md](../../decisions.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: render each newly added primitive
  on a throwaway page, confirm it styles correctly in both themes, then remove the throwaway page;
  run `npm run build`.

---

### SHELL-005: `components/shared/` primitives - `PageHeader`, `EmptyState`, `DataTable` wrapper, `ConfirmDialog`

- **Task ID**: `SHELL-005`
- **Epic**: Design System & Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: `components/shared/` primitives - `PageHeader`, `EmptyState`, `DataTable` wrapper, `ConfirmDialog`
- **Objective**: Build the first tranche of reusable, cross-feature composed components every CRM
  screen needs - `PageHeader` (title + actions + breadcrumb slot), `EmptyState`, a `DataTable`
  wrapper (sort/paginate/select over `table.tsx`), and `ConfirmDialog` (destructive confirmation) -
  so Developer 3's Accounts screens compose them instead of duplicating layout.
- **Business Value**: This is the shared vocabulary that makes every feature screen look like one
  product rather than three. Landing it early lets Developer 3 re-parent their unstyled Accounts
  UI into real components with a small mechanical merge instead of a rebuild - the core Sprint 1
  de-risking move.
- **Dependencies**: `SHELL-002` (shell context for layout assumptions); `SHELL-004` (data-table
  primitives/deps available). Soft: none beyond those.
- **Target Files**:
  - `components/shared/page-header.tsx` (new)
  - `components/shared/empty-state.tsx` (new)
  - `components/shared/data-table.tsx` (new - the wrapper)
  - `components/shared/confirm-dialog.tsx` (new)
  - `components/shared/README.md` may be updated to index these (per the per-folder README
    convention in [../../folder-structure.md](../../folder-structure.md))
- **Technical Instructions**:
  1. **`PageHeader`**: props `{ title, description?, actions?, breadcrumb? }`. Title uses the H1
     token (`text-2xl font-semibold tracking-tight`), description is `text-sm text-muted-foreground`,
     `actions` is a right-aligned slot (typically a `default` primary + `outline` secondary button).
     Leave a `breadcrumb` slot that SHELL-008 fills. Match the "Typography" + "Buttons" sections of
     [../../ui-design-system.md](../../ui-design-system.md).
  2. **`EmptyState`**: props `{ icon?, title, description?, action? }`. Centered, muted, used both
     standalone and inside a table's empty `TableRow` (`colSpan`) per the "Tables → Empty states"
     rule - never a bare empty `<TableBody>`.
  3. **`DataTable`**: a generic wrapper over `table.tsx` (`Table`/`TableHeader`/`TableBody`/
     `TableRow`/`TableHead`/`TableCell`) implementing the "Tables" conventions: sticky header,
     `text-sm`/`py-2` density, sortable headers (click toggles asc/desc with a `lucide` chevron),
     row select via `checkbox.tsx`, whole-row click to a detail route (`cursor-pointer` +
     `hover:bg-muted/50`), a trailing actions `TableCell` using `dropdown-menu.tsx`, and
     server-driven `pagination.tsx` below (accepts page/cursor props - no client-side slicing).
     If SHELL-004 adopted `@tanstack/react-table`, model columns as its `ColumnDef`; otherwise a
     typed `columns` prop. Advanced faceting/column-visibility is explicitly SHELL-013 - keep this
     wrapper focused on sort/paginate/select + row actions + empty state.
  4. **`ConfirmDialog`**: built on `alert-dialog.tsx` (forces explicit acknowledge) for destructive
     confirmations (delete account, remove member). Props `{ open, onOpenChange, title, description,
confirmLabel, onConfirm, variant?: "destructive" }`; confirm button uses the `destructive`
     variant when appropriate.
  5. Keep every component fully generic (no feature-specific imports), accessible (icon-only
     buttons carry `aria-label`; row actions keyboard-operable via Radix `dropdown-menu`), and
     theme-safe (semantic tokens only). Follow [../../naming-conventions.md](../../naming-conventions.md).
- **Acceptance Criteria**:
  - A demo/story page renders `PageHeader` with a title, description, and two action buttons
    correctly aligned.
  - `EmptyState` renders standalone and inside a `DataTable` with zero rows (spanning all columns).
  - `DataTable` renders typed rows, sorts on header click (chevron flips), selects rows via
    checkbox, routes on row click, exposes row actions via a keyboard-operable dropdown, and
    paginates via `pagination.tsx`.
  - `ConfirmDialog` opens, requires an explicit confirm to fire `onConfirm`, and cancel dismisses
    without firing.
  - All four render correctly in light and dark mode; icon-only controls have accessible names.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Components are feature-agnostic (no import from `features/*`)
  - [ ] `components/shared/README.md` indexes the new primitives
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 6-9
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md)
  (Tables, Buttons, Typography, Dialogs vs. sheets, Accessibility) and
  [../../folder-structure.md](../../folder-structure.md) (`components/` convention) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: build a throwaway
  `/dashboard`-adjacent demo page mounting all four with sample data; verify sort/select/paginate/
  row-click/row-actions on `DataTable`; verify `ConfirmDialog` gating; verify empty state; toggle
  theme; keyboard-traverse the table and dropdown. Remove the demo page before the PR (or keep it
  behind a dev-only route if the team prefers a living component gallery).

---

### SHELL-006: Wire command menu (`cmdk`) to `commandMenuOpen` Redux state

- **Task ID**: `SHELL-006`
- **Epic**: Design System & Shell
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Wire command menu (`cmdk`) to `commandMenuOpen` Redux state
- **Objective**: Wire the shadcn `command.tsx` (cmdk) into a global command palette controlled by
  `ui-slice`'s `commandMenuOpen`, opened by a keyboard shortcut (⌘K / Ctrl-K) and a topbar trigger,
  offering navigation to every `primaryNav` route.
- **Business Value**: A ⌘K palette reads as "power-user product" to judges and is the fastest way
  to move around during a live demo - it turns the nav into something that feels fast and modern.
- **Dependencies**: `SHELL-002` (topbar trigger + `primaryNav` source). `command.tsx` is already
  installed.
- **Target Files**:
  - `components/shared/command-menu.tsx` (new - the palette, `"use client"`)
  - `app/(dashboard)/layout.tsx` (mount the palette once at shell level)
  - `components/shared/app-topbar.tsx` (the trigger button dispatches `setCommandMenuOpen(true)`)
  - `store/slices/ui-slice.ts` (consume existing `commandMenuOpen`/`setCommandMenuOpen`)
  - `hooks/use-command-shortcut.ts` (new - optional; global ⌘K listener)
- **Technical Instructions**:
  1. Build `CommandMenu` using `command.tsx`'s `CommandDialog` (or `Command` inside `dialog.tsx`),
     reading `open` from `useAppSelector((s) => s.ui.commandMenuOpen)` and dispatching
     `setCommandMenuOpen(false)` on close (`onOpenChange`).
  2. Register a global keydown listener (a `hooks/use-command-shortcut.ts` hook mounted in the
     shell) for `(e.metaKey || e.ctrlKey) && e.key === "k"`, `preventDefault`, dispatch
     `setCommandMenuOpen(true)`. Ensure it doesn't fire while typing in an input unless intended.
  3. Populate a "Navigation" `CommandGroup` by mapping `primaryNav` from `config/site.ts`; selecting
     an item closes the menu and `router.push(href)`. Leave room for future groups (recent records,
     actions) but scope this task to navigation.
  4. Mount `CommandMenu` exactly once in `app/(dashboard)/layout.tsx` (not per page) so state isn't
     fragmented. The topbar trigger is a `ghost` button showing a `⌘K` `kbd`-style hint.
  5. Keep it keyboard-first (cmdk handles arrow/enter/filtering) per the Accessibility section of
     [../../ui-design-system.md](../../ui-design-system.md) - the palette must remain reachable via
     the documented shortcut once the shell ships.
- **Acceptance Criteria**:
  - ⌘K (macOS) / Ctrl-K (Windows/Linux) opens the command menu from anywhere in the dashboard shell.
  - The topbar trigger opens the same menu; both paths flip `commandMenuOpen` in Redux.
  - The menu lists all `primaryNav` routes; typing filters them; selecting one navigates and closes.
  - Escape / clicking outside closes the menu and resets `commandMenuOpen` to `false`.
  - The palette is fully keyboard-operable (arrow keys move selection, Enter activates).
  - Renders correctly in light and dark mode.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified
  - [ ] Palette mounted once at shell level (no duplicate mounts)
  - [ ] The keyboard shortcut is documented (README/`../../ui-design-system.md` note) so the
        Accessibility requirement "reachable via a documented shortcut" is satisfiable
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 2-4
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md)
  (Accessibility - command menu) and [../../folder-structure.md](../../folder-structure.md)
  (`store/`, `hooks/`) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: from several routes press ⌘K/
  Ctrl-K → menu opens; type a route name → list filters; Enter → navigates + closes; press the
  topbar trigger → same; Escape → closes and Redux `commandMenuOpen` is `false` (verify via Redux
  devtools); toggle theme.
