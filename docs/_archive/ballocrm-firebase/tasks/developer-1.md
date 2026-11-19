# Developer 1 - Infrastructure, Authentication & Configuration

Welcome. You own the foundation everyone else builds on: the real Firebase project behind the
already-scaffolded `lib/firebase/client.ts` / `lib/firebase/admin.ts`, the Firebase Auth sign-in
flow and session-cookie issuance, environment/config validation, Firestore security rules for the
multi-tenant `organizations/{orgId}` model, and (as a stretch goal) a basic CI pipeline. Nothing in
BalloCRM - not the dashboard shell, not Accounts CRUD - can run against real data or a real user
until your Sprint 1 work lands. Full task detail (objective, target files, acceptance criteria,
Definition of Done per task) lives in [sprint-1.md](./sprint-1.md); this page is your filtered,
developer-facing view of it.

## Owned folders and files

Work freely in these without checking in with the other two tracks:

- `lib/firebase/` - client and admin SDK initialization (`client.ts`, `admin.ts`)
- `lib/auth/` - session/token verification helpers you will create (Server Component /
  Server Action-side token verification; `middleware.ts` cannot do this on the Edge runtime)
- `config/` - `env.ts` (Zod-validated env schemas), and any new config module Auth needs
- `middleware.ts` - the existing `__session` cookie presence check; do not add token
  verification here (Edge runtime limitation), only redirect logic
- `.env.local` / `.env.example` - real provisioning is yours; keep `.env.example` in sync with
  any new key you add to `config/env.ts`
- `firestore.rules`, `firestore.indexes.json`, `firebase.json` - the org/role security model
- The Firebase Console project itself (Auth providers, Firestore instance, Web App + Service
  Account credentials) - this is real console setup work, not just code
- `.github/workflows/` - CI (stretch goal; see Priority note below)

If a change outside this list is required (e.g., a new field on the `users/{uid}` document shape
that Developer 3's role checks depend on), raise it in the shared task-tracking doc rather than
editing another developer's owned area directly.

## Sprint 1 tasks

| Task ID   | Title                                                                                                                | Priority     | Depends on           |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------- |
| INFRA-001 | Configure Firebase project and wire environment variables                                                            | P0           | none                 |
| INFRA-002 | Implement Firebase Auth sign-in Server Actions and `__session` cookie issuance                                       | P0           | INFRA-001            |
| INFRA-003 | Build server-side session/token verification helper (`lib/auth/`) for protected Server Components                    | P0           | INFRA-002            |
| INFRA-004 | Finalize Firestore security rules for `users/{uid}` + `organizations/{orgId}` roles (owner/admin/manager/rep/viewer) | P0           | INFRA-001            |
| INFRA-005 | Bootstrap script: create first organization + owner user for local/demo use                                          | P1           | INFRA-002, INFRA-004 |
| INFRA-006 | GitHub Actions CI workflow (lint, typecheck, build)                                                                  | P3 (stretch) | none                 |

INFRA-006 is explicitly flagged as a stretch goal - the project brief's ground-truth section notes
no CI exists yet and tracks it as an open item in [risks.md](../risks.md) and
[roadmap.md](../roadmap.md), not a Sprint 1 blocker. Pick it up only after INFRA-001 through
INFRA-004 are done and demo-ready.

See [sprint-1.md](./sprint-1.md) for full task detail on each row above (objective, target files,
acceptance criteria, technical instructions, Definition of Done). A Sprint 2 preview (BalloAds
integration credential storage under `organizations/{orgId}/integrations/balloAds`, introducing a
test framework per the [roadmap.md](../roadmap.md) Known Gaps section) will land in
[sprint-2.md](./sprint-2.md) once Sprint 1 is scoped as complete.

## Definition of Ready before you start

Before picking up any task above, confirm it meets the Definition of Ready in
[sprint-plan.md](../sprint-plan.md) - do not start implementation against a task that hasn't
cleared that bar (e.g., INFRA-004's role list must be confirmed against
[decisions.md](../decisions.md) before you write rule logic against it). The same file also holds
the project-wide Definition of Done every task in the table above must satisfy on top of its own
task-specific acceptance criteria.

## Who to coordinate with, and why

- **Developer 2 (Shell, Design System & Navigation)** - their `/login` page (UI, form, redirect
  handling) is built against _your_ auth flow. They can lay out the page shell early, but the
  sign-in Server Action it calls, and the session cookie it depends on for a successful redirect,
  are INFRA-002/INFRA-003. Tell them as soon as `signIn`/`signOut` actions are stable enough to
  wire a UI to, even before every edge case (error messages, rate limiting) is finished - don't
  make them wait for a fully polished auth flow to start integrating.
- **Developer 3 (Core CRM Domain)** - every Firestore write their `repositories/` layer makes
  (Accounts first, then Opportunities/Contracts) is authorized by the rules you own in
  `firestore.rules` (INFRA-004). If their Accounts repository needs a role/permission shape you
  haven't modeled yet (e.g., a `rep` can create but not delete an Account), that's a rules change
  you make, not a workaround they invent client-side. Land INFRA-004 early and flag its rule
  shape in [decisions.md](../decisions.md) so Developer 3 can design their Server Actions against
  a known, stable authorization model instead of guessing.
