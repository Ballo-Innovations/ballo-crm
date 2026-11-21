# Sprint Plan

This is the overarching planning doc for BalloCRM's hackathon build. It is read heavily by files
inside [`tasks/`](./tasks/) - `sprint-1.md`, `sprint-2.md`, `sprint-3.md`, and each
`developer-<n>.md` file link back here for the Definition of Ready, Definition of Done, and
critical-path reasoning rather than restating them. If you're looking for the actual task list for
a given sprint, go to [tasks/sprint-1.md](./tasks/sprint-1.md),
[tasks/sprint-2.md](./tasks/sprint-2.md), or [tasks/sprint-3.md](./tasks/sprint-3.md). If you're
looking for tasks not yet scheduled into a sprint, see [tasks/backlog.md](./tasks/backlog.md).

## Sprint cadence

BalloCRM is built for the 2026 iHub Innovation Hackathon under **hackathon-compressed sprints**,
not calendar-week sprints. Each sprint is a self-contained build phase of roughly **1-2 days of
focused build time**, sized to what three developers can complete in parallel without blocking
each other, ending in a working, demoable increment rather than a partial feature. There is no
sprint ceremony overhead (no formal standup/retro cadence documented here) - coordination happens
through the docs themselves: a developer picks up a task from their `developer-<n>.md` file, checks
its Definition of Ready, builds it, and moves it to [tasks/completed.md](./tasks/completed.md) or
[tasks/blocked.md](./tasks/blocked.md) as status changes, updating
[progress.md](./progress.md) and [changelog.md](./changelog.md) in the same change.

## Team shape (Sprint 1)

Three developers (human or AI coding agents) work in parallel for the duration of the hackathon,
each owning a distinct layer of the stack to minimize file-level and dependency-level collisions:

| Developer                                           | Owns                                                                                            | Primary folders                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Developer 1 - Infrastructure & Auth**             | Repo tooling, Firebase project setup, Firebase Auth, environment/config, CI basics              | `lib/firebase/`, `config/`, `middleware.ts`, `app/(auth)/`, `.github/workflows/`      |
| **Developer 2 - Shell, Design System & Navigation** | App shell, layout, nav, shadcn/ui component library setup, dashboard shell, reusable components | `components/`, `app/(dashboard)/layout.tsx`, `providers/`, `store/slices/ui-slice.ts` |
| **Developer 3 - Core CRM Domain**                   | Accounts, Opportunities, Contracts data model + first CRUD screens                              | `features/accounts/`, `repositories/`, `services/`, `schemas/`                        |

This split follows the **feature-based, layered architecture** established in
[decisions.md ADR-002](./decisions.md#adr-002-strict-feature-based-layering--ui--actions--services--repositories--firestore):
each developer owns a vertical slice of the stack whose interfaces to the others are narrow and
mostly one-directional. Concretely, why it minimizes blocking:

- Developer 1's output (a working Firebase project, a valid session, `getServerEnv()`/
  `getClientEnv()`) is a **dependency other developers consume but never edit** - Developer 2 and
  3 don't touch `lib/firebase/` or `middleware.ts`, so there's no merge contention there.
- Developer 2's output (the app shell, `components/ui/*` extensions, the data table primitive) is
  **consumed via import, not by editing shared layout files** - Developer 3 imports
  `components/` into `features/accounts/` screens without needing write access to
  `app/(dashboard)/layout.tsx`.
- Developer 3's output (`features/accounts/`, `repositories/`, `services/`) is **self-contained
  per ADR-002** - Developer 1 and 2 never need to open `features/` to do their jobs.
- The one real cross-cutting resource is `config/site.ts`'s `primaryNav` and the Redux
  `ui-slice.ts` - both already exist and are stable, so Developer 2 building the shell against
  them and Developer 3 building screens that will later appear in that nav don't need to
  coordinate live.

## Sprint summary

| Sprint       | Goal                                                                                                                                                                                                 | Detail                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Sprint 1** | Ship a deployable skeleton: Firebase Auth login works, the dashboard shell renders with real navigation, and Accounts has working Create/Read against Firestore - proving the full stack end to end. | [tasks/sprint-1.md](./tasks/sprint-1.md) |
| **Sprint 2** | Complete core CRM CRUD (Accounts update/delete, Contacts, Opportunities, Contracts) on top of the Sprint 1 skeleton, and round out the design system with the patterns those screens need.           | [tasks/sprint-2.md](./tasks/sprint-2.md) |
| **Sprint 3** | Layer on differentiators: Brutus AI commercial intelligence jobs, analytics dashboards, vertical sales indexing, and the first live BalloAds-triggered communication.                                | [tasks/sprint-3.md](./tasks/sprint-3.md) |

## Definition of Ready

A task may only be picked up by a developer once it satisfies all of the following. If any box is
unchecked, resolve it first (in [tasks/backlog.md](./tasks/backlog.md) or by editing the task) -
don't start building against an underspecified task.

- [ ] Task has a Task ID in the `<AREA>-<number>` format (see [tasks/task-template.md](./tasks/task-template.md))
- [ ] Task has a clear Objective and Business Value
- [ ] Task has bulleted, testable Acceptance Criteria
- [ ] Target Files are identified (so two developers don't unknowingly plan to touch the same file)
- [ ] Dependencies are either resolved (the dependency task is in [tasks/completed.md](./tasks/completed.md))
      or explicitly noted as a soft dependency the owner can work around (e.g. a stub/mock)
- [ ] Owner is assigned in the relevant `tasks/developer-<n>.md` file

## Definition of Done

A task is only moved to [tasks/completed.md](./tasks/completed.md) once **all** of the following
are true. This is the canonical Definition of Done referenced by
[tasks/task-template.md](./tasks/task-template.md) and every sprint/developer file - don't restate
it elsewhere, link here.

- [ ] All Acceptance Criteria from the task are met and manually verified
- [ ] Relevant `docs/*.md` files are updated in the same change (schema, API, route, or decision
      changes must not land undocumented - see the docs-driven-development principle in
      [vision.md](./vision.md))
- [ ] Lint, typecheck, and build all pass locally (`npm run lint`, `npm run typecheck` /
      `tsc --noEmit`, `npm run build`) - no automated test suite exists yet
      (tracked as a gap in [risks.md](./risks.md)), so these three checks are the current quality gate
- [ ] Pull request opened and reviewed per [../CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] [progress.md](./progress.md) and [changelog.md](./changelog.md) updated to reflect what
      shipped
- [ ] Task moved from its sprint file into [tasks/completed.md](./tasks/completed.md) (or into
      [tasks/blocked.md](./tasks/blocked.md) with a blocker note if it could not be finished)

## Critical path (Sprint 1)

The real dependency chain that determines what must land first, so no developer burns time
building against a foundation that doesn't exist yet:

1. **Firebase project + env config** (`INFRA-001`, Developer 1) - nothing that touches Firestore
   or Firebase Auth can be verified against a real backend until this lands. This is the true
   root of the critical path.
2. **Firebase Auth + session verification** (`INFRA-002`, `INFRA-003`, Developer 1) - depends on
   (1). Any _protected_ route (i.e., anything inside the dashboard shell that needs to know who's
   logged in) depends on this, because `middleware.ts` only checks cookie _presence_, not
   validity - real verification happens in the Server Component/Action behind the gate.
3. **Design system primitives + app shell** (`SHELL-001` through `SHELL-004`, Developer 2) -
   should land **early and in parallel** with (1)/(2), not after, because Developer 3's CRM
   screens consume the data table primitive and shell layout directly.
4. **Accounts schema, repository, and CRUD screens** (`CRM-001` through `CRM-003`, Developer 3) -
   the data-layer parts (schema, repository, service, Server Action) have **no dependency** on
   Developer 1 or 2 and can start immediately. Only the _page_ that renders inside the dashboard
   shell and sits behind the auth gate has a dependency on (2) and (3).

### The Developer 2 / Developer 3 soft dependency

Developer 3's Accounts screens visually depend on Developer 2's shell (layout, nav, data table
primitive) and functionally depend on Developer 1's auth (to know which org's data to show). In
Sprint 1 this must **not** become a serial handoff. To avoid it blocking:

- Developer 3 builds the Accounts **schema, repository, service, and Server Actions** first -
  these have zero UI dependency and can be fully done and unit-verifiable (via a temporary script
  or a bare unstyled page) before the shell exists.
- Developer 3 builds the Accounts **list/create UI against plain, unstyled `components/ui/table`
  and `components/ui/*` primitives** (already installed, per the brief's ground-truth state) or a
  minimal local stub layout, rather than waiting on Developer 2's finished shell. Once Developer
  2's `app/(dashboard)/layout.tsx` and data table primitive land, Developer 3 does a short
  integration pass to move the Accounts pages under the real shell and swap in the shared data
  table component - this is a small, mechanical merge, not a rebuild.
- Similarly, Developer 3 can develop against a **hardcoded or session-stubbed `orgId`/`uid`**
  until Developer 1's real auth/session verification lands, then swap the stub for the real
  session read in one small change.
- Both integration passes are tracked as their own short follow-up tasks in
  [tasks/sprint-1.md](./tasks/sprint-1.md) (not silently absorbed into the original task) so the
  cost of the soft dependency is visible and estimated rather than hidden.
