# Developer 3 - Core CRM Domain (Accounts, Opportunities, Contracts)

Welcome. You own the actual product: the CRM data model and its first working CRUD surface.
Sprint 1's whole "deployable skeleton" claim rests on one thing you deliver - Accounts with
working Create/Read against Firestore, built through the repository → service → action → UI
layering described in [architecture.md](../architecture.md). Opportunities and Contracts are your
domain too, but they are Sprint 2 scope; Sprint 1 is Accounts-only so the full stack gets proven
end to end before the surface area grows. Full task detail (objective, target files, acceptance
criteria, Definition of Done per task) lives in [sprint-1.md](./sprint-1.md); this page is your
filtered, developer-facing view of it.

## Owned folders and files

Work freely in these without checking in with the other two tracks:

- `features/accounts/` - components, hooks, schemas, and Server Actions for the Accounts slice
  (this is your Sprint 1 focus)
- `features/opportunities/`, `features/contracts/` - scaffolding only in Sprint 1 (schema shape
  and folder structure may start here per [database-schema.md](../database-schema.md)), full CRUD
  is Sprint 2
- `repositories/` - Firestore access for `accounts` (and later `opportunities`, `contracts`)
  subcollections under `organizations/{orgId}/...`; this is the only layer allowed to import
  `firebase/firestore` directly, per [decisions.md](../decisions.md)
- `services/` - business logic composing your repositories (e.g., validating an Account isn't a
  duplicate before create)
- `schemas/` - Zod schemas for `Account`, `Opportunity`, `Contract` shapes; types are inferred
  (`z.infer<...>`), never hand-written in parallel with the schema
- `actions/` - the thin Server Action entry points your feature UI calls into `services/`

If a change outside this list is required (e.g., a new Firestore role permission your Accounts
service needs, or a shared table component your list view needs), raise it with the owning
developer rather than editing `firestore.rules` or `components/shared/` yourself.

## Sprint 1 tasks

| Task ID | Title                                                                                 | Priority | Depends on                                               |
| ------- | ------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| CRM-001 | Define `Account` Zod schema and Firestore repository (`repositories/accounts.ts`)     | P0       | INFRA-004 (soft - can stub rules-agnostic reads locally) |
| CRM-002 | Accounts service + Server Actions: `createAccount`, `listAccounts`                    | P0       | CRM-001                                                  |
| CRM-003 | Accounts list view (table of accounts, empty state)                                   | P0       | CRM-002; SHELL-005 (soft - see workaround below)         |
| CRM-004 | Account create form (React Hook Form + Zod resolver, dialog or route)                 | P0       | CRM-002                                                  |
| CRM-005 | Account detail view (read-only, single record)                                        | P1       | CRM-002; SHELL-005 (soft)                                |
| CRM-006 | Scaffold `features/opportunities/` and `features/contracts/` schemas only (no UI yet) | P2       | CRM-001 (pattern reference)                              |

See [sprint-1.md](./sprint-1.md) for full task detail on each row above (objective, target files,
acceptance criteria, technical instructions, Definition of Done). A Sprint 2 preview - full
Opportunity pipeline (stages, Kanban/list views, qualification fields) and Contracts (creation,
renewal tracking, association to won Opportunities) per [roadmap.md](../roadmap.md) Phase 2 -
will land in [sprint-2.md](./sprint-2.md) once Sprint 1 is scoped as complete.

## Definition of Ready before you start

Before picking up any task above, confirm it meets the Definition of Ready in
[sprint-plan.md](../sprint-plan.md) - in particular, don't start CRM-001 until the `Account`
Firestore document shape is agreed against [database-schema.md](../database-schema.md), and don't
start CRM-003/CRM-005 UI work assuming a specific shared component exists until you've checked
with Developer 2 (see workaround below). The same file holds the project-wide Definition of Done
every task above must satisfy alongside its own acceptance criteria.

## Who to coordinate with, and why

- **Developer 1 (Infrastructure & Auth)** - two hard dependencies here. First, your
  `repositories/` writes are only as correct as the Firestore rules Developer 1 owns
  (`firestore.rules`, INFRA-004) - if `rep` vs `manager` write permissions on `accounts` aren't
  finalized, your Server Actions can't be verified as actually enforcing anything. Second, every
  Server Action you write needs to know the current org/role to scope its query
  (`organizations/{orgId}/accounts`) - that comes from the session helper in `lib/auth/`
  (INFRA-003). Confirm both are stable before you treat CRM-002 as done, not just "compiles."
- **Developer 2 (Shell, Design System & Navigation)** - your Accounts list/detail screens are
  meant to be built on their `DataTable` wrapper, `PageHeader`, and card/layout conventions
  (SHELL-005), and to render inside their app shell (SHELL-002). This is a known critical-path
  risk: if the shared shell/components aren't ready when you are, don't block. **Workaround**:
  build CRM-003/CRM-005 against a minimal, unstyled layout first (plain HTML table, no shared
  components, rendered directly under `app/`) so the repository → service → action → UI slice is
  provably working end to end for the demo, then re-parent the UI into the real shared shell and
  `DataTable` once SHELL-002/SHELL-005 ship. Communicate early which of the two you're doing so
  the reconciliation pass is a known, scheduled task rather than a surprise late in the sprint.
