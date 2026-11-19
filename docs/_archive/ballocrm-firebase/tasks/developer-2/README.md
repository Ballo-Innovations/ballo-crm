# Developer 2 - Dashboard, Navigation, Layout, Design System & Data-Viz UI

This folder is the full, gap-free task backlog for **Developer 2**, the owner of BalloCRM's visual
skeleton: the app shell (sidebar, topbar, breadcrumbs, command menu) wired to `config/site.ts`'s
`primaryNav`, the `/login` page UI, the dashboard shell and its KPI tiles, the shared/reusable
component layer every other developer's feature UI sits inside (including the `shadcn/ui`
component-library setup itself), and the analytics/AI presentation surfaces (Recharts dashboards,
AI insight panels). Each task here is written IN FULL against the
[task template](../task-template.md) - every field, worked-example depth - so any of the three
developers can pick a task up cold and satisfy its Definition of Ready without chasing context.

## Ownership recap (from [developer-2.md](../developer-2.md))

Work freely in these folders/files without checking in with the other two tracks:

- **`app/`** shell + shell routes - `app/layout.tsx` (already wired to `AppProviders`),
  `app/(dashboard)/layout.tsx` (the route-group shell layout you introduce for sidebar/topbar),
  `app/login/page.tsx`, `app/page.tsx`, and route-level `loading.tsx`/`error.tsx` boundaries.
- **`components/shared/`** - reusable, cross-feature composed UI (`PageHeader`, `EmptyState`,
  `DataTable` wrapper, `ConfirmDialog`, KPI card, form-field wrappers, detail-layout, kanban,
  AI/analytics panels).
- **`components/ui/`** - the `shadcn/ui` primitives (style `radix-nova`, base color `neutral`,
  icons `lucide`); add new ones with `npx shadcn@latest add <name>` as features need them.
- **`config/site.ts`** - primary consumer of `primaryNav`; may extend nav metadata (icons,
  badges). Changing item labels/routes must be flagged in [routes.md](../../routes.md) because
  Developer 3's features depend on those paths matching.
- **`store/slices/ui-slice.ts`** - `sidebarCollapsed`, `commandMenuOpen`, and any new client UI
  state the shell needs.

Anything outside this list (e.g. a new field on the session/user object for the topbar user menu)
is raised with **Developer 1** rather than reaching into `lib/auth/` directly. Server data
(accounts, aiJobs, notifications, analyticsCache) is owned by TanStack Query / repositories, never
Redux - the shell only owns client UI state.

## Phase → Task-ID map

| Phase                                                    | File                           | Task IDs                                                                                          |
| -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Phase 1 - Shell & Design System foundation**           | [phase-1.md](./phase-1.md)     | SHELL-001, SHELL-002, SHELL-003, SHELL-004, SHELL-005, SHELL-006                                  |
| **Phase 2 - Design system depth & app-shell completion** | [phase-2.md](./phase-2.md)     | SHELL-007, SHELL-008, SHELL-009, SHELL-010, SHELL-011, SHELL-012, SHELL-013, SHELL-014, SHELL-015 |
| **Phase 3–4 - Analytics & AI presentation**              | [phase-3-4.md](./phase-3-4.md) | AI-010, AI-011, ANLY-002, ANLY-003, ANLY-004, VSI-004                                             |
| **Phase 5 - Polish, accessibility & performance**        | [phase-5.md](./phase-5.md)     | SHELL-016, SHELL-017, SHELL-018, SHELL-019, SHELL-020                                             |

Total: **26 tasks** across four phase files.

## How to use this folder

1. Pick the phase file for the sprint you're in; each task inside is self-contained and template-complete.
2. Before starting a task, confirm it meets the **Definition of Ready** in
   [../../sprint-plan.md](../../sprint-plan.md) - in particular that any hard dependency is in
   [../completed.md](../completed.md), or that a soft dependency has a documented stub/mock path.
3. Build the task, meeting every Acceptance Criterion.
4. Close it out against the project-wide **Definition of Done** in
   [../../sprint-plan.md](../../sprint-plan.md) (lint/typecheck/build gate, docs updated,
   `../progress.md` + `../changelog.md` updated, PR per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md),
   task moved into [../completed.md](../completed.md)).
5. **Priorities:** `P0` blocks the Sprint-1 deployable-skeleton demo; `P1` is required for a
   coherent judge-facing product; `P2` strengthens the pitch (AI, analytics) but can slip a sprint;
   `P3` is polish. Phase 5 is generally `P2`/`P3`.

### Building against not-yet-built data (soft dependencies)

Several Phase 3–4 tasks are UI over another developer's data - AI panels read `aiJobs` produced by
Developer 1/3 (AI-003/004/005), analytics reads `analyticsCache` from ANLY-001 (Developer 3), the
notifications dropdown reads the `notifications` subcollection. **Never serialize on that data
landing.** Each such task's Technical Instructions describe a typed mock/stub (a local fixture
matching the real Firestore document shape from [../../database-schema.md](../../database-schema.md))
to build and demo against first, then a one-line swap to the real read hook once the producer task
completes. This keeps the presentation layer off the critical path.

## ID reconciliation (vs. [../backlog.md](../backlog.md))

Phase 1 task IDs/titles match the **Sprint 1 table in [../developer-2.md](../developer-2.md)**
exactly (that file is authoritative for Dev 2's in-flight IDs). Those IDs do **not** all line up
with the epic-level `SHELL-*` numbering in [../backlog.md](../backlog.md), which was minted before
the per-developer split. Where an ID here differs from its backlog equivalent, it is listed below so
the two can be cross-walked without ambiguity. Continuing IDs (AI-010/011, ANLY-004, VSI-004) are
minted here because no backlog row covers them yet.

| ID here   | Title here                                                       | Backlog equivalent                                                                       | Note                                                                                                     |
| --------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| SHELL-001 | Build `/login` page UI                                           | `INFRA-002` (login page, Dev 1's auth) - no `SHELL-*` backlog row for the UI             | UI-only slice of the login page; auth logic stays INFRA-002/003.                                         |
| SHELL-002 | App shell layout (sidebar + topbar)                              | `SHELL-001` (App shell: sidebar + topbar wired to `primaryNav`)                          | Same work, renumbered under the Dev 2 split.                                                             |
| SHELL-003 | Dashboard shell page with KPI placeholders                       | `SHELL-002` (Dashboard shell layout) - partial                                           | Backlog SHELL-002 bundles breadcrumbs; here breadcrumbs are split out to SHELL-008.                      |
| SHELL-004 | Add/configure `shadcn/ui` components (data-table deps, combobox) | `SHELL-004` (Data table primitive) - related setup step                                  | This installs the deps/primitives the data-table + combobox build on; DataTable itself is SHELL-005/013. |
| SHELL-005 | `components/shared/` primitives                                  | `SHELL-005` (page-header pattern) + `SHELL-004` (data table) + `SHELL-008` (empty-state) | Consolidates several backlog rows into one shared-primitives task.                                       |
| SHELL-006 | Wire command menu (`cmdk`)                                       | `SHELL-003` (Command menu wired to `commandMenuOpen`)                                    | Same work, renumbered.                                                                                   |
| SHELL-007 | Topbar user menu (real session data)                             | none (new)                                                                               | Split out of the shell for Phase 2; depends on Dev 1's session shape.                                    |
| SHELL-008 | Breadcrumb generation from route segments                        | subsumed in backlog `SHELL-002`                                                          | Broken out as its own task here.                                                                         |
| SHELL-009 | Notifications dropdown UI                                        | `SHELL-006` (Notifications dropdown UI)                                                  | Same work, renumbered.                                                                                   |
| SHELL-010 | Form kit (RHF + Zod field wrappers, combobox, etc.)              | none (new)                                                                               | Minted here; formalizes the Forms conventions in [../../ui-design-system.md](../../ui-design-system.md). |
| SHELL-011 | Empty/error/loading state library + boundaries                   | `SHELL-008` (Empty-state / error-state component library)                                | Extended to include route-level `error.tsx`/`loading.tsx` + skeletons.                                   |
| SHELL-012 | Toast/feedback conventions (`sonner`)                            | none (new)                                                                               | Minted here; formalizes the toast convention referenced in `api.md`/design system.                       |
| SHELL-013 | DataTable enhancements (filtering, faceting, etc.)               | `SHELL-004` (Data table primitive) - enhancement pass                                    | Builds on the SHELL-005 wrapper.                                                                         |
| SHELL-014 | Reusable detail-page layout pattern                              | none (new)                                                                               | Minted here for the entity-detail screens (`/accounts/[id]`, etc.).                                      |
| SHELL-015 | Kanban board primitive                                           | none (new; consumed by backlog `CRM-021`)                                                | Minted here; CRM-021 (Dev 3) consumes it.                                                                |
| AI-010    | AI insight panel component                                       | closest: `AI-004` / `AI-005` (panels) - but those are the _jobs_, Dev 1/3                | Minted continuing ID; this is the presentation layer over `aiJobs` output.                               |
| AI-011    | AI job trigger button + progress UX                              | none (new; pairs with `AI-003` job)                                                      | Minted continuing ID; UI that invokes an AI-job Server Action.                                           |
| ANLY-002  | Pipeline/forecast analytics dashboard                            | `ANLY-002` (exact match)                                                                 | Same ID/title.                                                                                           |
| ANLY-003  | Natural-language pipeline Q&A panel UI                           | `ANLY-003` (exact match)                                                                 | Same ID/title.                                                                                           |
| ANLY-004  | Account health distribution + vertical charts                    | none (new)                                                                               | Minted continuing ID; wired to `analyticsCache`.                                                         |
| VSI-004   | Vertical segmentation filter controls                            | closest: `VSI-002` (segmentation view)                                                   | Minted continuing ID; the shared filter bar VSI-002 and analytics reuse.                                 |
| SHELL-016 | Dark mode visual QA                                              | `SHELL-009` (Dark mode visual QA pass)                                                   | Same work, renumbered.                                                                                   |
| SHELL-017 | WCAG 2.1 AA accessibility audit                                  | none (new)                                                                               | Minted here.                                                                                             |
| SHELL-018 | Keyboard shortcut system                                         | `SHELL-007` (Keyboard shortcut system)                                                   | Same work, renumbered.                                                                                   |
| SHELL-019 | Responsive/mobile QA pass                                        | none (new)                                                                               | Minted here.                                                                                             |
| SHELL-020 | Route transition + bundle/performance polish                     | none (new)                                                                               | Minted here.                                                                                             |

## Links

- Project sprint plan (Definition of Ready / Done, critical path): [../../sprint-plan.md](../../sprint-plan.md)
- Task template (field order + worked example): [../task-template.md](../task-template.md)
- Design system (tokens, components, conventions): [../../ui-design-system.md](../../ui-design-system.md)
- Routes: [../../routes.md](../../routes.md) · Backlog: [../backlog.md](../backlog.md)
