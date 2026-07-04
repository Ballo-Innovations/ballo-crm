# Task Template

Every task tracked in `docs/tasks/` (backlog, sprint files, or per-developer files) must follow
this template. Copy the block below verbatim when authoring a new task, keep field order stable
so tasks are scannable/diffable across files, and never remove a field - write `none` or `n/a`
rather than dropping it. See [sprint-plan.md](../sprint-plan.md) for the Definition of Ready and
Definition of Done referenced below, and [backlog.md](./backlog.md) for where unscheduled tasks
live before they're pulled into a sprint.

## Copyable template

```markdown
### <AREA>-<number>: <Short imperative title>

- **Task ID**: `<AREA>-<number>` - stable identifier, never reused even if a task is cancelled.
  `<AREA>` is one of `INFRA` (infra/auth), `SHELL` (design system/nav/app shell), `CRM` (core CRM
  domain: accounts/contacts/opportunities/contracts), `ABM` (campaigns/ABM), `AI` (Brutus AI /
  commercial intelligence), `ANLY` (analytics), `VSI` (vertical sales indexing), `COMM` (automated
  communications via BalloAds), `DOCS` (documentation-only tasks).
- **Epic**: The larger capability this task ladders up to (e.g. "Accounts", "Design System",
  "AI Commercial Intelligence") - matches an epic heading in `backlog.md`.
- **Priority**: `P0` / `P1` / `P2` / `P3` - see priority definitions below.
- **Owner**: Developer 1, 2, or 3 (or a name, once assigned) - must match the owner in the
  relevant `docs/tasks/developer-<n>.md` file.
- **Title**: One line, imperative mood, specific enough to be a commit-message subject.
- **Objective**: 1-2 sentences on what this task achieves and why it exists now.
- **Business Value**: 1 sentence on the user/demo/judging impact - why this matters for the
  hackathon outcome, not just "because it's on the plan."
- **Dependencies**: Other Task IDs that must land first, or `none`. If a dependency is a _soft_
  dependency (unblockable via a stub/mock), say so explicitly.
- **Target Files**: Exact paths (or glob patterns) expected to be created or modified. Keeps two
  developers from silently touching the same file in the same sprint.
- **Technical Instructions**: Concrete implementation guidance - which layer(s) to touch
  (`repositories/` → `services/` → `actions/` → UI per ADR-002), which schema/type to define or
  reuse, which existing convention doc governs the pattern.
- **Acceptance Criteria**: Bulleted, testable, observable outcomes - not implementation steps.
  Someone other than the author should be able to verify each bullet without reading the code.
- **Definition of Done**: Checklist for closing the task out. Must reference (not restate) the
  project-wide Definition of Done in [sprint-plan.md](../sprint-plan.md).
- **Estimated Complexity**: `S` / `M` / `L` / `XL` - see complexity definitions below.
- **Estimated Hours**: A number or range, calibrated to hackathon-compressed sprints (see
  [sprint-plan.md](../sprint-plan.md) for sprint length).
- **Documentation References**: Which `docs/*.md` files this task must read before starting and
  must update as part of the same change (per the docs-driven-development principle in
  [../vision.md](../vision.md) / the project brief).
- **Testing Notes**: What manual/automated verification applies. No test framework is installed
  yet (see [../risks.md](../risks.md)) - until one lands, state the manual verification steps
  explicitly (e.g. "sign in as `rep` role, confirm redirect").
```

### Priority definitions

| Priority | Meaning                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0**   | Blocks the Sprint 1 "deployable skeleton" demo (auth, shell render, or Accounts CRUD end-to-end). Sprint cannot be called done without it. |
| **P1**   | Required for a coherent, judge-facing product experience this hackathon, but doesn't block the core skeleton.                              |
| **P2**   | Valuable, strengthens the pitch (AI insights, analytics, ABM), but can slip a sprint without breaking the demo.                            |
| **P3**   | Nice-to-have polish, edge-case handling, or hardening - pick up only if time remains.                                                      |

### Complexity definitions

| Complexity | Rough size | Typical shape                                                                                                                                      |
| ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**      | < 2 hrs    | Single file change, config value, or a small schema/type addition.                                                                                 |
| **M**      | 2-5 hrs    | One feature slice (e.g. a repository + service + one Server Action).                                                                               |
| **L**      | 5-10 hrs   | A full vertical slice (schema → repository → service → actions → UI screen).                                                                       |
| **XL**     | > 10 hrs   | Spans multiple features or requires a new architectural pattern; should usually be broken into smaller tasks before being scheduled into a sprint. |

---

## Worked example

### INFRA-001: Configure Firebase project and wire environment variables

- **Task ID**: `INFRA-001`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Configure Firebase project and wire environment variables
- **Objective**: Stand up the actual Firebase project (Auth + Firestore) behind the already-scaffolded
  `lib/firebase/client.ts` and `lib/firebase/admin.ts`, and populate real credentials through
  `config/env.ts` so every later task (auth, Firestore reads/writes) has a working backend to
  target instead of placeholder env values.
- **Business Value**: Nothing else in the app - login, Accounts CRUD, AI jobs - can run against
  real data until this lands. It is the single hardest blocker for the Sprint 1 demo.
- **Dependencies**: none (this is the root of the critical path - see
  [sprint-plan.md](../sprint-plan.md#critical-path)).
- **Target Files**:
  - `.env.local` (untracked, created locally from `.env.example`)
  - `.env.example` (add any newly-required key names, no real values)
  - `config/env.ts` (extend Zod schema only if a new required key is introduced)
  - `firebase.json`, `firestore.rules`, `firestore.indexes.json` (deploy target project ID only -
    do not change rule logic in this task)
- **Technical Instructions**:
  1. Create the Firebase project (or confirm the hackathon-provided one) with Authentication
     (Email/Password + Google provider) and Firestore (production mode, `us-central` or nearest
     region) enabled.
  2. Generate a Web App config for the client SDK and a Service Account key for the Admin SDK;
     populate `.env.local` per the keys already read by `config/env.ts` (`getClientEnv()` /
     `getServerEnv()`) - do not invent new env var names without updating `.env.example` and the
     Zod schema together.
  3. Run `firebase use --add` to bind the CLI to the project and confirm
     `firebase deploy --only firestore:rules,firestore:indexes` succeeds against it.
  4. Verify `lib/firebase/client.ts` and `lib/firebase/admin.ts` both initialize without throwing
     by hitting a throwaway Server Component/Route Handler that calls each.
- **Acceptance Criteria**:
  - A real Firebase project exists with Auth (Email/Password, Google) and Firestore enabled.
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
  - [ ] Lint/typecheck/build pass (see project-wide DoD in [sprint-plan.md](../sprint-plan.md))
  - [ ] PR opened and reviewed per [CONTRIBUTING.md](../../CONTRIBUTING.md)
  - [ ] `docs/progress.md` and `docs/changelog.md` updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../tech-stack.md](../tech-stack.md) and
  [../environment.md](../environment.md) before starting; must update
  [../environment.md](../environment.md) and [../deployment.md](../deployment.md) as part of the
  same change.
- **Testing Notes**: No automated test framework is installed yet (see [../risks.md](../risks.md)).
  Manual verification: run `npm run dev`, confirm no env validation crash; add a temporary
  `console.log` in a Server Component calling `getAdminAuth()`/`getAdminFirestore()` to confirm
  the Admin SDK connects, then remove it before opening the PR.
