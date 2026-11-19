# Developer 3 - Core CRM Domain & Commercial Intelligence: Task Backlog

This folder is the complete, phased task backlog for **Developer 3**, who owns the CRM data model
and every commercial-domain feature that sits on top of it: Accounts, Contacts, Opportunities,
Contracts, Tasks, Activities/Customer-Journey, Campaigns/ABM, Vertical Sales Indexing, the Brutus
AI commercial-intelligence jobs, the BalloAds-triggered communications, and the analytics
aggregation that feeds the dashboards.

Every task below is written in full against the [task template](../task-template.md) - same field
order, same worked-example depth as `INFRA-001`. Read this README first for the map, then open the
phase file for the task you're picking up.

## Ownership recap (from [../developer-3.md](../developer-3.md))

Work freely in these without checking in with the other two tracks:

- `features/accounts/`, `features/contacts/`, `features/opportunities/`, `features/contracts/`,
  `features/tasks/`, `features/campaigns/`, `features/customer-journey/`, `features/analytics/`
  (domain data + hooks + feature-scoped Server Actions; UI panels that Developer 2 owns are called
  out per-task)
- `repositories/` - the **only** layer allowed to import `firebase-admin/firestore` directly, per
  [ADR-002](../../decisions.md#adr-002-strict-feature-based-layering--ui--actions--services--repositories--firestore).
  One file per collection Developer 3 touches (`repositories/accounts.ts`, `contacts.ts`,
  `opportunities.ts`, `contracts.ts`, `tasks.ts`, `activities.ts`, `campaigns.ts`,
  `notifications.ts`, `templates.ts`, `settings.ts`, `analytics-cache.ts`, `ai-jobs.ts`).
- `services/` - business logic composing repositories + referential-integrity checks (Firestore
  has no joins; the referenced doc's existence is verified here at write time).
- `schemas/` and `features/<feature>/schemas/` - Zod schemas; **types are always `z.infer<...>`**,
  never hand-written in parallel ([ADR-009](../../decisions.md#adr-009-zod-as-the-single-source-of-truth-for-data-shapes-with-inferred-typescript-types)).
- `actions/` and `features/<feature>/actions/` - thin `"use server"` entry points returning the
  shared `{ ok: true, data } | { ok: false, error }` result shape.

If a change outside this list is required (a new Firestore role permission, a shared shell/table
component), raise it with the owning developer rather than editing `firestore.rules`,
`components/`, or `app/(dashboard)/layout.tsx` yourself.

## Phase → Task-ID map

| Phase                   | Theme                                                                                                                            | Task IDs                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Phase 1](./phase-1.md) | Accounts vertical slice (proves repo→service→action→UI end to end)                                                               | CRM-001, CRM-002, CRM-003, CRM-004, CRM-005, CRM-006                                                                                                             |
| [Phase 2](./phase-2.md) | Core CRM CRUD (Accounts U/D, Activities, Contacts, Opportunities, Contracts, Tasks, Journey, Notifications, Templates, Settings) | CRM-007, CRM-008, CRM-009, CRM-010, CRM-011, CRM-012, CRM-013, CRM-020, CRM-021, CRM-022, CRM-030, CRM-031, CRM-032, CRM-040, CRM-041, CRM-042, CRM-043, CRM-044 |
| [Phase 3](./phase-3.md) | Commercial Intelligence (Brutus AI) & automated communications                                                                   | CRM-050, AI-003, AI-004, AI-005, AI-006, CRM-023, COMM-003, COMM-004                                                                                             |
| [Phase 4](./phase-4.md) | ABM, Vertical Sales Indexing & analytics data                                                                                    | VSI-001, VSI-002, VSI-003, ABM-001, ABM-002, ABM-003, ABM-004, ANLY-001, CRM-060                                                                                 |

Total: **41 tasks** across 4 phases.

## How to use this folder

1. Pick the next task from your current phase (phases are roughly sequential; within a phase, honor
   each task's **Dependencies** field).
2. Confirm the task meets the **Definition of Ready** in [../../sprint-plan.md](../../sprint-plan.md)
   before starting - in particular that its cross-track dependencies are either resolved or have a
   documented stub/mock workaround.
3. Build it top-to-bottom through the layers named in **Technical Instructions**
   (`repositories/` → `services/` → `actions/` → `features/*`), never skipping a layer.
4. Verify against the **Acceptance Criteria** (a non-author must be able to check each bullet),
   then close it out per the **Definition of Done**, which references - does not restate - the
   project-wide DoD in [../../sprint-plan.md](../../sprint-plan.md).
5. Move the task's status per the sprint-plan cadence (into [../completed.md](../completed.md) or
   [../blocked.md](../blocked.md)) and update [../../progress.md](../../progress.md) +
   [../../changelog.md](../../changelog.md) in the same change.

Canonical references cited throughout: [../../database-schema.md](../../database-schema.md) (exact
collection paths, field names, and relationships), [../../indexes.md](../../indexes.md) (composite
indexes), [../../firestore-rules.md](../../firestore-rules.md) (per-role permissions),
[../../architecture.md](../../architecture.md) (layering), [../../decisions.md](../../decisions.md)
(ADRs), [../../integrations.md](../../integrations.md) (BalloAds + Brutus AI contracts),
[../../glossary.md](../../glossary.md) (the Customer Journey vs. BalloAds Journey distinction),
[../../routes.md](../../routes.md), and [../../coding-standards.md](../../coding-standards.md).

## ID reconciliation note

The pre-existing task files disagree on a few CRM IDs. This folder is authoritative for Developer
3's scope and resolves them as follows - **follow [../developer-3.md](../developer-3.md) for
CRM-006**, and use the newly-minted IDs below for the two backlog tasks that would otherwise
collide.

| This folder                                                                                           | Backlog ([../backlog.md](../backlog.md)) entry                              | Resolution                                                                                                                               |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **CRM-006** = _Scaffold `features/opportunities/` + `features/contracts/` schemas only_               | Backlog CRM-006 = _Surface BalloAds HealthScore_                            | We follow `developer-3.md`: CRM-006 is the schema-scaffold task. The health-score task is re-minted as **CRM-050**.                      |
| **CRM-050** = _Surface BalloAds `healthScore` as read-only enrichment_                                | Backlog **CRM-006** (health score badge)                                    | Same task, new non-colliding ID.                                                                                                         |
| **CRM-060** = _Account bulk import (CSV)_                                                             | Backlog **CRM-007** (CSV import)                                            | Same task, re-minted so it doesn't collide with any Phase-1 continuation.                                                                |
| **CRM-007** = _Account edit + soft-delete (Update/Delete)_                                            | Backlog CRM-004 (_Account edit + soft-delete_)                              | `developer-3.md` uses CRM-004 for the **create form**; the edit/soft-delete work therefore continues as **CRM-007** here.                |
| **CRM-005** = _Account detail view (read-only)_ + **CRM-009** = _Account detail activity timeline UI_ | Backlog CRM-005 (_Account detail page with activity timeline_)              | The single backlog task is split: read-only detail is CRM-005 (Phase 1), the `activities`-backed timeline UI is CRM-009 (Phase 2).       |
| **CRM-004** = _Account create form_                                                                   | Backlog CRM-002 (_Create Account form_)                                     | Renumbered per `developer-3.md`'s Sprint 1 table; our CRM-002 is the service + Server Actions.                                           |
| **AI-004** = _Next-best-action job (data/service side)_                                               | Backlog AI-004 (_Next-best-action **panel** on Account/Opportunity detail_) | The data/service half stays AI-004 here; the UI panel is Developer 2's **AI-010** (referenced as a downstream consumer, not owned here). |
| **AI-005** = _Account/Contact AI summarization job (data/service side)_                               | Backlog AI-005 (_summarization **panel**_)                                  | Same split: Developer 3 owns the job/service; Developer 2 owns the panel UI.                                                             |

All other IDs (CRM-001/002/003, CRM-008/010/011/012/013, CRM-020/021/022, CRM-030/031/032,
CRM-040/041/042/043/044, CRM-023, VSI-001/002/003, ABM-001/002/003/004, ANLY-001, AI-003/006,
COMM-003/004) are used as-is, matching [../backlog.md](../backlog.md) and
[../developer-3.md](../developer-3.md) where they appear.

## Links

- Project-wide **Definition of Ready / Definition of Done** and critical path:
  [../../sprint-plan.md](../../sprint-plan.md)
- **Task template** (field order + worked example): [../task-template.md](../task-template.md)
- Epic inventory: [../backlog.md](../backlog.md)
- Per-developer overview: [../developer-3.md](../developer-3.md)
