# Developer 2 - Dashboard, Navigation, Layout & Design System

Welcome. You own the app's visual skeleton: the shell (sidebar, topbar, breadcrumbs) wired to the
already-defined `config/site.ts` `primaryNav`, the `/login` page UI, the dashboard shell with its
KPI placeholders, and the shared/reusable component layer everyone else's feature UI will sit
inside - including the `shadcn/ui` component library setup itself. Sprint 1's "deployable
skeleton" demo needs the shell to actually render before anything else looks like a product. Full
task detail (objective, target files, acceptance criteria, Definition of Done per task) lives in
[sprint-1.md](./sprint-1.md); this page is your filtered, developer-facing view of it.

## Owned folders and files

Work freely in these without checking in with the other two tracks:

- `app/` layout and shell routes - `app/layout.tsx` (already wired to `AppProviders`),
  `app/(dashboard)/layout.tsx` or equivalent route-group layout you introduce for the
  sidebar/topbar shell, `app/login/page.tsx`, `app/page.tsx` (replacing the current foundation
  placeholder once the real shell exists)
- `components/shared/` - reusable, cross-feature UI (`PageHeader`, `EmptyState`, a `DataTable`
  wrapper, `ConfirmDialog`, KPI card, etc.)
- `components/ui/` - the `shadcn/ui` primitives; add new ones with `npx shadcn@latest add <name>`
  as features need them (e.g., a combobox for account owner selection)
- `config/site.ts` - you are the primary consumer of `primaryNav`; you may extend it (new nav
  metadata like icons or badges) but changing item labels/routes should be flagged in
  [routes.md](../routes.md) since Developer 3's features depend on those paths matching
- `store/slices/ui-slice.ts` - `sidebarCollapsed`, `commandMenuOpen`, and any new client UI state
  the shell needs

If a change outside this list is required (e.g., a new field needed on the session/user object
for the topbar's user menu), raise it with Developer 1 rather than reaching into `lib/auth/`
yourself.

## Sprint 1 tasks

| Task ID   | Title                                                                                             | Priority | Depends on                                              |
| --------- | ------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------- |
| SHELL-001 | Build `/login` page UI (email/password + Google button, error states)                             | P0       | INFRA-002 (soft - build against a stubbed action first) |
| SHELL-002 | App shell layout: sidebar + topbar wired to `primaryNav`, responsive collapse                     | P0       | none                                                    |
| SHELL-003 | Dashboard shell page with KPI card placeholders                                                   | P0       | SHELL-002                                               |
| SHELL-004 | Add/configure `shadcn/ui` components needed for CRM list/detail views (data table, combobox)      | P1       | none                                                    |
| SHELL-005 | `components/shared/` primitives: `PageHeader`, `EmptyState`, `DataTable` wrapper, `ConfirmDialog` | P1       | SHELL-002                                               |
| SHELL-006 | Wire command menu (`cmdk`) to `commandMenuOpen` Redux state                                       | P2       | SHELL-002                                               |

See [sprint-1.md](./sprint-1.md) for full task detail on each row above (objective, target files,
acceptance criteria, technical instructions, Definition of Done). A Sprint 2 preview - topbar user
menu backed by real session data, breadcrumb generation from route segments, and a dark-mode/AA
contrast pass - will land in [sprint-2.md](./sprint-2.md) once Sprint 1 is scoped as complete.

## Definition of Ready before you start

Before picking up any task above, confirm it meets the Definition of Ready in
[sprint-plan.md](../sprint-plan.md) - in particular, don't start SHELL-001 until Developer 1 has
confirmed the shape of the sign-in Server Action (even a stub signature is enough to satisfy
readiness; you don't need the full auth flow working). The same file holds the project-wide
Definition of Done every task above must satisfy alongside its own acceptance criteria.

## Who to coordinate with, and why

- **Developer 1 (Infrastructure & Auth)** - your shell's topbar needs to render the current
  user's name/role/org, which means it needs the session shape Developer 1 defines in
  `lib/auth/`. Don't invent your own placeholder session type and wire it through the whole
  shell - ask Developer 1 for the real shape (even before the flow is fully working) so you build
  against it once. Similarly, `/login`'s redirect-on-success behavior only actually works once
  INFRA-002/INFRA-003 land; build the page and stub the submit handler in the meantime rather than
  blocking on it.
- **Developer 3 (Core CRM Domain)** - this is the critical-path risk to actively manage.
  Developer 3's Accounts list/detail screens are meant to consume your `DataTable` wrapper,
  `PageHeader`, and card/layout conventions (SHELL-005) - if that lands late, they either block or
  duplicate layout work you'll have to reconcile later. **Workaround**: tell Developer 3 to build
  their Accounts UI against a minimal, unstyled layout (plain `<table>`/native HTML, no shared
  components) first so their repository → service → action → UI slice is provably working end to
  end, then re-parent it into your real shared components once SHELL-005 ships. Land SHELL-002 and
  SHELL-005 as early in the sprint as you can specifically to shrink this window - this is the
  single biggest de-risking move available in Sprint 1.
