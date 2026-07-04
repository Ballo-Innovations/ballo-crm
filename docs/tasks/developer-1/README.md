# Developer 1 — Task Folder (Infrastructure, Authentication & Platform Services)

This folder is the full, gap-free task backlog for **Developer 1**, expanding the developer-facing
overview in [../developer-1.md](../developer-1.md) into per-phase task files, each task written out
in full against [../task-template.md](../task-template.md). Developer 1 owns the foundation every
other track builds on — the Firebase backend, auth/session, the multi-tenant security model, the
integration/AI platform services, and deploy/CI discipline.

## Ownership recap

Work freely in these areas without checking in with the other tracks (from
[../developer-1.md](../developer-1.md)):

- `lib/firebase/` — client + admin SDK init (`client.ts`, `admin.ts`)
- `lib/auth/` — server-side session/token verification + RBAC helpers (created in Phase 1-2)
- `lib/crypto/`, `lib/balloads/`, `lib/ai/`, `lib/errors/`, `lib/resilience/`, `lib/rate-limit/` —
  platform-service modules created in Phases 2-5
- `config/` — `env.ts` (Zod-validated env schemas) and any new config module auth/platform needs
- `middleware.ts` — the `__session` presence gate (redirect logic only; no token verification —
  Edge runtime can't run the Admin SDK)
- `.env.local` / `.env.example` — provisioning + keeping the template in sync with `config/env.ts`
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc` — the org/role
  security model + composite indexes
- The Firebase Console project(s) — Auth providers, Firestore, Web App + Service Account creds
- `.github/workflows/` — CI
- `actions/auth.ts`, `actions/invites.ts`, `actions/integrations.ts`, and the `repositories/` +
  `services/` for platform concerns (audit logs, ai-jobs, integrations, balloads-sync)
- `scripts/` — the org/owner bootstrap script

If a change outside this list is required (e.g. a new field on `users/{uid}` that Developer 3's
role checks depend on), raise it in the shared task-tracking docs rather than editing another
developer's area directly.

## Phase → Task-ID map

| Phase                                      | File                       | Task IDs                                                                    |
| ------------------------------------------ | -------------------------- | --------------------------------------------------------------------------- |
| **Phase 1 — Foundation**                   | [phase-1.md](./phase-1.md) | INFRA-001, INFRA-002, INFRA-003, INFRA-004, INFRA-005, INFRA-006            |
| **Phase 2 — Platform Services & Security** | [phase-2.md](./phase-2.md) | INFRA-007, INFRA-008, INFRA-009, INFRA-010, INFRA-011, INFRA-012, INFRA-013 |
| **Phase 3 — Integrations & AI Job Infra**  | [phase-3.md](./phase-3.md) | COMM-002, COMM-001, INFRA-014, AI-001, AI-002                               |
| **Phase 5 — Hardening & Scale**            | [phase-5.md](./phase-5.md) | INFRA-015, INFRA-016, INFRA-017, INFRA-018, INFRA-019                       |

24 tasks total. (Phase 4 is not a Developer 1 phase — product/feature phasing owned elsewhere — so
there is no `phase-4.md` here.)

### Per-task quick index

| Task ID   | Title                                                              | Priority     | Phase |
| --------- | ------------------------------------------------------------------ | ------------ | ----- |
| INFRA-001 | Configure Firebase project and wire environment variables          | P0           | 1     |
| INFRA-002 | Firebase Auth sign-in Server Actions + `__session` cookie issuance | P0           | 1     |
| INFRA-003 | Server-side session/token verification helper (`lib/auth/`)        | P0           | 1     |
| INFRA-004 | Finalize Firestore rules for `users` + `organizations` roles       | P0           | 1     |
| INFRA-005 | Bootstrap script — first org + owner user                          | P1           | 1     |
| INFRA-006 | GitHub Actions CI (lint, typecheck, build)                         | P3 (stretch) | 1     |
| INFRA-007 | RBAC helpers (`requireRole`, permission matrix) in `lib/auth/`     | P1           | 2     |
| INFRA-008 | Organization + user invite flow                                    | P1           | 2     |
| INFRA-009 | Password reset + email verification flows                          | P1           | 2     |
| INFRA-010 | Rules + composite indexes for all business subcollections          | P1           | 2     |
| INFRA-011 | Centralized audit logging service (`auditLogs`)                    | P1           | 2     |
| INFRA-012 | Testing framework (Vitest + Playwright) + test step in CI          | P1           | 2     |
| INFRA-013 | Server error handling + structured logging + result envelope       | P1           | 2     |
| COMM-002  | Encrypted integration credential storage + crypto helper           | P1           | 3     |
| COMM-001  | BalloAds developer-portal API client (`lib/balloads/client.ts`)    | P1           | 3     |
| INFRA-014 | BalloAds health-score & delivery-status sync job                   | P2           | 3     |
| AI-001    | `aiJobs` state machine repository + transition helpers             | P1           | 3     |
| AI-002    | Brutus AI client wrapper (`lib/ai/brutus.ts`)                      | P1           | 3     |
| INFRA-015 | API rate limiting / abuse guard on Server Actions                  | P2           | 5     |
| INFRA-016 | Retry/backoff + circuit-breaker for BalloAds/Brutus calls          | P2           | 5     |
| INFRA-017 | Firestore index & query cost review at scale                       | P3           | 5     |
| INFRA-018 | Security hardening pass                                            | P2           | 5     |
| INFRA-019 | Per-environment deployment config                                  | P3           | 5     |

## How to use this folder

1. **Start at your phase file** ([phase-1.md](./phase-1.md) → [phase-5.md](./phase-5.md)) — tasks
   are ordered within each file the way they should generally be picked up.
2. **Before starting a task**, check it meets the **Definition of Ready** in
   [../../sprint-plan.md](../../sprint-plan.md), and confirm its dependencies are in
   [../completed.md](../completed.md) (or are explicitly soft/mockable).
3. **While building**, follow the docs each task lists under "Documentation References" — read them
   first, update them in the same change (docs-driven development).
4. **To close a task**, satisfy its Acceptance Criteria **and** the project-wide **Definition of
   Done** in [../../sprint-plan.md](../../sprint-plan.md), then move it to
   [../completed.md](../completed.md) (or [../blocked.md](../blocked.md) with a note).
5. Cross-track dependencies reference real Task IDs: **SHELL-001** (app shell / login UI, Developer 2) and **CRM-001** (Account schema + repository, Developer 3) are the two you'll coordinate with
   most; see [../backlog.md](../backlog.md).

## ID reconciliation (vs. `backlog.md`)

The phase files use the IDs and titles from [../developer-1.md](../developer-1.md)'s Sprint 1 table
and the task inventory for later phases. Several IDs **differ from** the epic-level inventory in
[../backlog.md](../backlog.md) (the sprint files and the backlog diverged as scope was refined).
Where an ID here matches `backlog.md`, no note is needed; the table below lists only the
divergences and their backlog equivalents so nothing is silently double-numbered.

| ID here   | Title here                                      | `backlog.md` equivalent                                                                                                                       |
| --------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| INFRA-002 | Firebase Auth sign-in Server Actions + cookie   | Part of `backlog.md` INFRA-003 (session cookie issuance); `backlog.md` INFRA-002 is the `/login` page UI (a Developer 2 / SHELL surface here) |
| INFRA-003 | Session/token verification helper (`lib/auth/`) | `backlog.md` INFRA-003 (Admin SDK verification in protected layouts)                                                                          |
| INFRA-004 | Finalize Firestore security rules (core)        | **No direct backlog entry** (rules were folded into INFRA-001's area); `backlog.md` INFRA-004 is the CI workflow (= INFRA-006 here)           |
| INFRA-005 | Bootstrap script — first org + owner            | **New** (no backlog entry); `backlog.md` INFRA-005 is RBAC helpers (= INFRA-007 here)                                                         |
| INFRA-006 | GitHub Actions CI                               | `backlog.md` INFRA-004 (GitHub Actions CI)                                                                                                    |
| INFRA-007 | RBAC helpers (`requireRole`, matrix)            | `backlog.md` INFRA-005 (RBAC helpers)                                                                                                         |
| INFRA-008 | Organization + user invite flow                 | `backlog.md` INFRA-006 (org + user invite flow)                                                                                               |
| INFRA-009 | Password reset + email verification             | `backlog.md` INFRA-009 (same ID + title — matches)                                                                                            |
| INFRA-010 | Rules + indexes for all business subcollections | **New** (no backlog entry — completes the model beyond the Sprint 1 core)                                                                     |
| INFRA-011 | Centralized audit logging service               | `backlog.md` INFRA-008 (audit logging to `auditLogs`)                                                                                         |
| INFRA-012 | Testing framework + CI test step                | **New continuing ID** (tracked as the R1 gap in `risks.md`; sprint-2 numbers it `INFRA-005`)                                                  |
| INFRA-013 | Error handling + structured logging + envelope  | **New** (no backlog entry — formalizes the `api.md` result-shape contract)                                                                    |
| INFRA-014 | BalloAds health-score/delivery sync job         | **New continuing ID** (relates to `backlog.md` CRM-006 / COMM-004)                                                                            |
| INFRA-015 | API rate limiting / abuse guard                 | `backlog.md` INFRA-007 (API rate limiting)                                                                                                    |
| INFRA-016 | Retry/backoff + circuit breaker                 | **New** (no backlog entry — hardening of the integration clients)                                                                             |
| INFRA-017 | Firestore index & query cost review             | **New** (no backlog entry — the `indexes.md` sprint-planning review)                                                                          |
| INFRA-018 | Security hardening pass                         | **New** (no backlog entry)                                                                                                                    |
| INFRA-019 | Per-environment deployment config               | **New** (no backlog entry — operationalizes `deployment.md`)                                                                                  |
| COMM-001  | BalloAds developer-portal API client            | `backlog.md` COMM-001 (matches)                                                                                                               |
| COMM-002  | Encrypted integration credential storage        | `backlog.md` COMM-002 (matches — generalized from `balloAds` to all providers)                                                                |
| AI-001    | `aiJobs` state machine repository               | `backlog.md` AI-001 (matches)                                                                                                                 |
| AI-002    | Brutus AI client wrapper                        | `backlog.md` AI-002 (matches)                                                                                                                 |

INFRA-001 also matches `backlog.md` INFRA-001 exactly and needs no reconciliation.

## Reference links

- **Definition of Ready / Definition of Done + critical path** — [../../sprint-plan.md](../../sprint-plan.md)
- **Task template (field order + worked example)** — [../task-template.md](../task-template.md)
- **Epic-level inventory** — [../backlog.md](../backlog.md)
- **Developer 1 overview** — [../developer-1.md](../developer-1.md)
- **Schema / rules / indexes** — [../../database-schema.md](../../database-schema.md),
  [../../firestore-rules.md](../../firestore-rules.md), [../../indexes.md](../../indexes.md)
- **Architecture / integrations / env / deploy** — [../../architecture.md](../../architecture.md),
  [../../integrations.md](../../integrations.md), [../../environment.md](../../environment.md),
  [../../deployment.md](../../deployment.md)
