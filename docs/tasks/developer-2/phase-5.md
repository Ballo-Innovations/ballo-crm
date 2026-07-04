# Phase 5 — Polish, accessibility & performance

Phase 5 is Developer 2's hardening pass over everything the shell and feature UI shipped in Phases
1–4. Nothing here adds a new screen; each task is a **cross-cutting quality gate** applied to the
existing surface — dark-mode fidelity, WCAG 2.1 AA accessibility, power-user keyboard navigation,
responsive/mobile behavior, and route-transition/bundle performance. These map to the
enterprise-hardening goals in [../../roadmap.md](../../roadmap.md#phase-5--scale--enterprise-hardening)
and the accessibility direction in [../../ui-design-system.md](../../ui-design-system.md). They are
generally `P2`/`P3` — pick them up once the Phase 1–4 product surface is demoable, not before.

Because these tasks touch many files that Developer 3's feature UI also lives in, coordinate timing:
run each audit **after** the feature screens for a given entity have stabilized, and file any
non-shell defects (a feature component's contrast, a missing label inside `features/*`) back to the
owning developer rather than editing their feature code directly. Fields follow
[../task-template.md](../task-template.md); the project-wide Definition of Done referenced below lives
in [../../sprint-plan.md](../../sprint-plan.md#definition-of-done).

---

### SHELL-016: Dark mode visual QA across all shadcn components in use

- **Task ID**: `SHELL-016` (reconciles to [../backlog.md](../backlog.md) **SHELL-009**, "Dark mode
  visual QA pass" — see [README.md](./README.md#id-reconciliation-note))
- **Epic**: Design System & Shell
- **Priority**: P3
- **Owner**: Developer 2
- **Title**: Audit and fix dark-mode rendering across every shadcn/ui component and shared primitive in use
- **Objective**: Systematically walk every screen and every `components/ui/*` + `components/shared/*`
  primitive in both `light` and `dark` themes (toggled via `next-themes`) and fix any hardcoded color,
  low-contrast surface, invisible border, or unreadable state so the app is fully usable in dark mode.
- **Business Value**: Judges frequently demo in dark mode; a single broken-contrast panel or an
  invisible input border reads as an unfinished product, undercutting an otherwise complete build.
- **Dependencies**: `SHELL-002`, `SHELL-003`, `SHELL-005`, `SHELL-010`, `SHELL-011`, `SHELL-013`,
  `SHELL-014`, `SHELL-015` (all the shell/design-system surfaces to audit); ideally after Developer
  3's feature screens are stable so their views are in scope too. **Soft**: can run against whatever
  screens exist and be re-run as new ones land.
- **Target Files**:
  - `styles/globals.css` (fix any `--color-*` token that resolves wrong in the `.dark` scope)
  - `components/ui/*` and `components/shared/*` (remove hardcoded hex/`text-white`/`bg-black`; use
    semantic tokens `bg-background`, `text-foreground`, `border-border`, `bg-muted`, etc.)
  - No new files expected — this is a fix-in-place audit.
- **Technical Instructions**:
  1. Build a checklist of every route from [../../routes.md](../../routes.md) and every primitive
     from [../../ui-design-system.md](../../ui-design-system.md); visit each in `light` then `dark`
     via the theme toggle.
  2. Replace any hardcoded color with the semantic Tailwind v4 token mapped in `styles/globals.css`
     (never raw hex in component classNames). Chart colors must use `var(--color-chart-n)` per the
     Charts conventions.
  3. Pay special attention to: input/table borders, `Skeleton` shimmer, `Badge` variants, disabled
     states, focus rings, `sonner` toasts, `popover`/`dialog` overlays, and the sidebar active-item
     highlight.
  4. Confirm the theme choice persists across reload and respects system preference on first load.
- **Acceptance Criteria**:
  - Every route and primitive renders legibly in both themes with no hardcoded-color regressions.
  - No text/background pair on a primary surface falls below WCAG AA contrast in either theme (spot-
    checked; the full audit is SHELL-017).
  - Theme selection persists across reload and honors system preference on first visit.
  - No component uses a raw hex or non-semantic color class after the pass.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../ui-design-system.md](../../ui-design-system.md) updated if any token mapping changed
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: S
- **Estimated Hours**: 2-3
- **Documentation References**: Must read [../../ui-design-system.md](../../ui-design-system.md)
  (tokens + theming) before starting; update it if a token mapping changes.
- **Testing Notes**: No automated test framework until `INFRA-012`. Manual: toggle theme on every
  route, screenshot before/after any fix; verify persistence across reload; verify first-load respects
  the OS `prefers-color-scheme`.

---

### SHELL-017: WCAG 2.1 AA accessibility audit pass

- **Task ID**: `SHELL-017` (new — see [README.md](./README.md#id-reconciliation-note))
- **Epic**: Design System & Shell
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Run and remediate a WCAG 2.1 AA accessibility audit across the shell and all screens
- **Objective**: Bring the app to WCAG 2.1 AA on the load-bearing flows (login, navigation, list/
  detail/create, dialogs, tables, charts) — focus order, visible focus, color contrast, semantic
  landmarks, form labels, aria state, and keyboard operability of every interactive control.
- **Business Value**: Accessibility is an explicit enterprise-hardening goal
  ([../../roadmap.md](../../roadmap.md#phase-5--scale--enterprise-hardening)); a demonstrably
  keyboard-and-screen-reader-usable CRM is a credible differentiator against generic tools and a
  concrete answer if a judge asks about enterprise readiness.
- **Dependencies**: `SHELL-016` (do the contrast-fix pass first so the audit isn't fighting theming);
  benefits from all feature screens being stable. **Soft**: run per-flow as each stabilizes.
- **Target Files**:
  - `components/ui/*`, `components/shared/*` (add missing `aria-*`, labels, roles, focus management)
  - `app/(dashboard)/layout.tsx`, `app/login/page.tsx` (landmarks: `<nav>`, `<main>`, skip-link)
  - `components/shared/skip-to-content.tsx` (new — skip-navigation link)
- **Technical Instructions**:
  1. Audit each core flow with keyboard only (Tab/Shift-Tab/Enter/Escape/Arrow) and with an automated
     checker (axe DevTools / Lighthouse a11y). Record findings against the WCAG 2.1 AA checklist.
  2. Ensure semantic landmarks (`<nav>`, `<main>`, `<header>`), a skip-to-content link, correct
     heading hierarchy, and an accessible name on every icon-only button (`aria-label`).
  3. Every form field (from the `SHELL-010` form kit) must have an associated `<label>`, error text
     linked via `aria-describedby`, and `aria-invalid` on error. Dialogs (`SHELL-005`) must trap
     focus, restore focus on close, and be labelled (`aria-labelledby`).
  4. Tables (`SHELL-013`) need proper header semantics and row-selection announced; the kanban
     (`SHELL-015`) needs a keyboard alternative to drag-drop (move-to-stage via menu).
  5. Non-text status must never be color-only — pair every color signal (health band, stage,
     job status) with text/icon (coordinate any feature-side fixes with Developer 3).
- **Acceptance Criteria**:
  - Every core flow (login → dashboard → accounts list → detail → create dialog → pipeline) is fully
    operable with keyboard only, with a visible focus indicator at every step.
  - Automated axe/Lighthouse scan reports zero serious/critical violations on those routes.
  - All form fields have programmatic labels and linked error messaging; dialogs trap and restore focus.
  - Kanban provides a non-drag keyboard path to change an item's stage.
  - No interactive control conveys state through color alone.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met and captured in an audit note in the PR
  - [ ] [../../ui-design-system.md](../../ui-design-system.md) accessibility section updated with the
        conventions applied
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../ui-design-system.md](../../ui-design-system.md)
  (accessibility direction) before starting; must update its accessibility section as part of the change.
- **Testing Notes**: No automated a11y test in CI until `INFRA-012` adds one (add an axe/Playwright
  check then). Manual: keyboard-only walkthrough of each core flow + an axe DevTools and Lighthouse
  a11y run per route; verify with VoiceOver (macOS) on login and the accounts list at minimum.

---

### SHELL-018: Keyboard shortcut system (power-user navigation)

- **Task ID**: `SHELL-018` (reconciles to [../backlog.md](../backlog.md) **SHELL-007**, "Keyboard
  shortcut system" — see [README.md](./README.md#id-reconciliation-note))
- **Epic**: Design System & Shell
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Add a global keyboard-shortcut system for power-user navigation and actions
- **Objective**: Layer a discoverable, non-conflicting keyboard-shortcut system over the shell —
  `⌘K`/`Ctrl-K` for the command menu (already wired in `SHELL-006`), plus `g` then a key for "go to"
  navigation (`g a` accounts, `g o` opportunities, `g d` dashboard), `c` to create in the current
  context, and `?` for a shortcut cheat-sheet dialog.
- **Business Value**: Power-user keyboard nav signals a product built for daily operators (the RevOps/
  rep personas in [../../vision.md](../../vision.md)), and makes a live demo notably faster and slicker.
- **Dependencies**: `SHELL-002` (shell + nav), `SHELL-006` (command menu + `commandMenuOpen` Redux
  state). **Soft**: shortcuts that navigate depend only on routes existing (`../../routes.md`).
- **Target Files**:
  - `hooks/use-keyboard-shortcuts.ts` (new — global listener, respects input focus)
  - `components/shared/shortcuts-dialog.tsx` (new — the `?` cheat sheet)
  - `store/slices/ui-slice.ts` (extend: `shortcutsDialogOpen` if a Redux-driven dialog is preferred)
  - `app/(dashboard)/layout.tsx` (mount the global listener + cheat-sheet)
- **Technical Instructions**:
  1. Implement a single global `keydown` listener in `use-keyboard-shortcuts.ts` that is **suppressed
     while an editable element is focused** (input/textarea/`contenteditable`) so typing never triggers
     nav. Support the `g`-then-key chord with a short timeout.
  2. Route via the Next.js router to paths from [../../routes.md](../../routes.md); do not hardcode
     paths that diverge from `config/site.ts` `primaryNav`.
  3. `⌘K`/`Ctrl-K` must toggle `commandMenuOpen` (reuse `SHELL-006`), not a second menu. `?` opens the
     cheat-sheet dialog listing every shortcut, grouped.
  4. Ensure no shortcut collides with browser/OS reserved combos or with the a11y keyboard nav from
     `SHELL-017`; the cheat sheet is the single source of truth for the bindings.
- **Acceptance Criteria**:
  - `⌘K`/`Ctrl-K` opens the command menu from anywhere; `?` opens a cheat-sheet listing all shortcuts.
  - `g a`/`g o`/`g d` (and any other defined "go to" chords) navigate to the correct routes.
  - Shortcuts do **not** fire while a text input/textarea is focused.
  - No shortcut conflicts with the command menu or with keyboard a11y navigation.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) cross-checked (shortcut targets match real routes); shortcut
        list documented in [../../ui-design-system.md](../../ui-design-system.md)
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../routes.md](../../routes.md) and
  [../../ui-design-system.md](../../ui-design-system.md) before starting; document the binding list in
  the design system doc.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: trigger each shortcut from multiple
  routes; focus an input and confirm nav shortcuts are suppressed; open the cheat sheet and confirm it
  matches actual behavior; verify no browser-combo collisions.

---

### SHELL-019: Responsive / mobile QA pass

- **Task ID**: `SHELL-019` (new — see [README.md](./README.md#id-reconciliation-note))
- **Epic**: Design System & Shell
- **Priority**: P3
- **Owner**: Developer 2
- **Title**: Audit and fix responsive behavior of the shell and feature screens down to mobile widths
- **Objective**: Ensure the shell (sidebar/topbar) and every list/detail/form/kanban screen degrade
  gracefully from desktop to tablet to mobile — the sidebar collapses to a drawer (`sheet`), tables
  scroll or reflow, dialogs fit small viewports, and no horizontal overflow appears at 375px.
- **Business Value**: Judges may open the deployed Vercel URL on a phone; a shell that breaks below a
  laptop width undermines the "production-ready" claim even if the desktop experience is complete.
- **Dependencies**: `SHELL-002` (responsive collapse already scoped there — this verifies + extends
  it), `SHELL-013` (tables), `SHELL-014` (detail layout), `SHELL-015` (kanban). **Soft**: run per
  screen as they stabilize.
- **Target Files**:
  - `app/(dashboard)/layout.tsx` (sidebar → `sheet` drawer at mobile breakpoint)
  - `components/shared/*` and `components/ui/table` wrapper (horizontal scroll containers)
  - Feature screens are Developer 3's — file responsive defects to them; fix only shared primitives here.
- **Technical Instructions**:
  1. Test at 375px, 768px, and 1280px. Confirm the sidebar collapses into a `sheet`/drawer toggle on
     mobile (driven by `sidebarCollapsed` in `store/slices/ui-slice.ts`) and the topbar stays usable.
  2. Wrap wide content (data tables, kanban) in an `overflow-x: auto` container so the page body never
     scrolls horizontally; ensure dialogs/sheets are height-capped and internally scrollable on small
     screens.
  3. Verify tap targets meet a comfortable minimum size and that hover-only affordances have a
     tap/focus equivalent.
- **Acceptance Criteria**:
  - At 375px, no screen produces horizontal body scroll; wide tables/kanban scroll inside their own
    container.
  - The sidebar collapses to a drawer on mobile and can be opened/closed; the topbar remains usable.
  - Dialogs and sheets fit the viewport and scroll internally when content overflows.
  - All primary actions remain reachable at every tested width.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] Any non-shell defects filed to Developer 3 with the screen + width noted
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: S
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../ui-design-system.md](../../ui-design-system.md)
  (breakpoints/layout) before starting; update it if a breakpoint convention changes.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: use browser device emulation at
  375/768/1280px on every route; verify on a real phone against the Vercel Preview URL for at least
  login + accounts list + a detail page.

---

### SHELL-020: Route transition / loading + bundle & performance polish

- **Task ID**: `SHELL-020` (new — see [README.md](./README.md#id-reconciliation-note))
- **Epic**: Design System & Shell
- **Priority**: P3
- **Owner**: Developer 2
- **Title**: Polish route transitions, loading states, and client bundle/performance
- **Objective**: Make navigation feel instant and the app light — consistent route-level `loading.tsx`
  skeletons, no layout shift on data arrival, prefetched primary-nav routes, and a client bundle
  trimmed of accidental heavy imports (e.g. Recharts/`cmdk` code-split, not in the shell's first load).
- **Business Value**: Perceived speed is a large part of "this feels finished"; a snappy demo with no
  janky spinners or content-jump reads as polished to judges.
- **Dependencies**: `SHELL-011` (skeleton/loading library), `SHELL-002`/`SHELL-003` (shell + dashboard),
  `ANLY-002`/`ANLY-004` (chart-heavy routes to code-split). **Soft**: can run against whatever routes exist.
- **Target Files**:
  - `app/(dashboard)/**/loading.tsx` (add/standardize route-level loading skeletons)
  - `components/shared/*` (lazy-load heavy widgets: charts, command menu, kanban via `next/dynamic`)
  - `next.config.ts` (only if a supported optimization flag is needed — keep minimal)
- **Technical Instructions**:
  1. Ensure every data-backed route has a `loading.tsx` using the `SHELL-011` skeletons that matches
     the final layout dimensions (no cumulative layout shift when data arrives).
  2. Code-split heavy, below-the-fold, or route-specific widgets (Recharts dashboards, `cmdk` command
     menu, the kanban board) with `next/dynamic` so they are not in the dashboard shell's initial
     bundle.
  3. Prefetch `primaryNav` destinations (Next.js `<Link>` default prefetch) and confirm no
     unnecessary client component boundaries pull server-only work to the client.
  4. Run a production build and inspect route bundle sizes; record before/after in the PR.
- **Acceptance Criteria**:
  - Every data-backed route shows a layout-matched skeleton on navigation and produces no visible
    layout shift when content loads.
  - Recharts/`cmdk`/kanban are code-split and absent from the dashboard shell's first-load JS
    (verifiable in the `next build` route output).
  - Navigating between primary-nav routes feels instant (prefetched); no full-page white flash.
  - Production build succeeds and route first-load JS is reduced versus the pre-task baseline (numbers
    in the PR).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met, with before/after bundle numbers in the PR
  - [ ] [../../architecture.md](../../architecture.md) / [../../ui-design-system.md](../../ui-design-system.md)
        updated if a loading/code-split convention is established
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../architecture.md](../../architecture.md) (server/client
  boundaries) and [../../ui-design-system.md](../../ui-design-system.md) before starting; document any
  loading/code-split convention introduced.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: `npm run build` and read the route
  first-load JS table before/after; navigate the app on a throttled connection (DevTools) and confirm
  skeletons appear and no layout shift occurs; confirm charts/menu load on demand, not up front.
