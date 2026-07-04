# Product Backlog

> **Sprint 1 is the immediate priority.** Everything in this backlog is what comes _after_ the
> Sprint 1 deployable skeleton (auth works, shell renders, Accounts has working Create/Read). See
> [../sprint-plan.md](../sprint-plan.md) for the sprint cadence and goals, and
> [./sprint-1.md](./sprint-1.md) for the exact Sprint 1 task breakdown per developer. Tasks below
> that are already pulled into Sprint 1 are listed here for epic-level completeness but owned in
> detail by [./sprint-1.md](./sprint-1.md) and the relevant `./developer-<n>.md` file — do not
> duplicate-edit them here once they're in flight; update status in [./completed.md](./completed.md)
> or [./blocked.md](./blocked.md) instead.

Every task below follows the [task template](./task-template.md) when it is written up in full
(full detail lives in the sprint file it's scheduled into, not here). This file exists to make
prioritization decisions, not to carry full acceptance criteria.

## Infrastructure & Auth

| Task ID   | Title                                                                        | Priority | Complexity | Sprint      |
| --------- | ---------------------------------------------------------------------------- | -------- | ---------- | ----------- |
| INFRA-001 | Configure Firebase project and wire environment variables                    | P0       | M          | Sprint 1    |
| INFRA-002 | Build `/login` page (Firebase Auth email/password + Google)                  | P0       | M          | Sprint 1    |
| INFRA-003 | Session cookie issuance + Admin SDK verification in protected layouts        | P0       | M          | Sprint 1    |
| INFRA-004 | GitHub Actions CI: lint, typecheck, build on PR                              | P1       | S          | Sprint 1    |
| INFRA-005 | Role-based access control helpers (`owner`/`admin`/`manager`/`rep`/`viewer`) | P1       | M          | Sprint 2    |
| INFRA-006 | Organization + user invite flow (add a teammate to an org)                   | P1       | L          | Sprint 2    |
| INFRA-007 | API rate limiting / abuse guard on Server Actions                            | P2       | M          | Unscheduled |
| INFRA-008 | Centralized audit logging service writing to `auditLogs`                     | P2       | M          | Unscheduled |
| INFRA-009 | Password reset + email verification flows                                    | P2       | S          | Unscheduled |

## Design System & Shell

| Task ID   | Title                                                                       | Priority | Complexity | Sprint      |
| --------- | --------------------------------------------------------------------------- | -------- | ---------- | ----------- |
| SHELL-001 | App shell: sidebar + topbar wired to `config/site.ts` `primaryNav`          | P0       | L          | Sprint 1    |
| SHELL-002 | Dashboard shell layout (`app/(dashboard)/layout.tsx`) with breadcrumbs      | P0       | M          | Sprint 1    |
| SHELL-003 | Command menu (`cmdk`) wired to `commandMenuOpen` Redux slice                | P1       | M          | Sprint 1    |
| SHELL-004 | Data table primitive (sort/paginate/select) on top of `components/ui/table` | P0       | L          | Sprint 1    |
| SHELL-005 | Shared page-header pattern (title, actions, breadcrumb slot)                | P1       | S          | Sprint 2    |
| SHELL-006 | Notifications dropdown UI (reads `notifications` subcollection)             | P2       | M          | Sprint 2    |
| SHELL-007 | Keyboard shortcut system (power-user nav, per UI direction in brief)        | P2       | M          | Unscheduled |
| SHELL-008 | Empty-state / error-state component library                                 | P2       | S          | Unscheduled |
| SHELL-009 | Dark mode visual QA pass across all shadcn components in use                | P3       | S          | Unscheduled |

## Accounts

| Task ID | Title                                                                  | Priority | Complexity | Sprint      |
| ------- | ---------------------------------------------------------------------- | -------- | ---------- | ----------- |
| CRM-001 | Account Zod schema + Firestore repository (`repositories/accounts.ts`) | P0       | M          | Sprint 1    |
| CRM-002 | Create Account form (React Hook Form + Server Action)                  | P0       | M          | Sprint 1    |
| CRM-003 | Accounts list screen (Read) using the SHELL-004 data table primitive   | P0       | M          | Sprint 1    |
| CRM-004 | Account edit + soft-delete (Update/Delete)                             | P1       | M          | Sprint 2    |
| CRM-005 | Account detail page with activity timeline (queries `activities`)      | P1       | L          | Sprint 2    |
| CRM-006 | Surface BalloAds `HealthScore` as a read-only enrichment field         | P2       | S          | Unscheduled |
| CRM-007 | Account bulk import (CSV)                                              | P3       | M          | Unscheduled |

## Contacts

| Task ID | Title                                                             | Priority | Complexity | Sprint      |
| ------- | ----------------------------------------------------------------- | -------- | ---------- | ----------- |
| CRM-010 | Contact Zod schema + repository, linked to `accounts/{accountId}` | P1       | M          | Sprint 2    |
| CRM-011 | Contact CRUD screens (list, create, edit)                         | P1       | L          | Sprint 2    |
| CRM-012 | Contact-to-Account relationship UI (primary contact, roles)       | P2       | S          | Sprint 2    |
| CRM-013 | Contact timeline: surface BalloAds opt-out/delivery status        | P2       | M          | Unscheduled |

## Opportunities

| Task ID | Title                                                      | Priority | Complexity | Sprint   |
| ------- | ---------------------------------------------------------- | -------- | ---------- | -------- |
| CRM-020 | Opportunity schema + pipeline stage model                  | P1       | M          | Sprint 2 |
| CRM-021 | Opportunity list + kanban-by-stage view                    | P1       | L          | Sprint 2 |
| CRM-022 | BANT/MEDDIC-style qualification fields on Opportunity form | P1       | M          | Sprint 3 |
| CRM-023 | Pipeline velocity rollups (stage duration, win rate)       | P2       | M          | Sprint 3 |

## Contracts

| Task ID | Title                                                                  | Priority | Complexity | Sprint      |
| ------- | ---------------------------------------------------------------------- | -------- | ---------- | ----------- |
| CRM-030 | Contract schema + repository, linked to Account/Opportunity            | P1       | M          | Sprint 2    |
| CRM-031 | Contract CRUD screens (list, create, edit, status)                     | P1       | L          | Sprint 3    |
| CRM-032 | Contract renewal reminders (logged as `activities`, no new collection) | P2       | M          | Unscheduled |

## Campaigns / ABM

| Task ID | Title                                                                       | Priority | Complexity | Sprint      |
| ------- | --------------------------------------------------------------------------- | -------- | ---------- | ----------- |
| ABM-001 | Campaign schema + repository (`organizations/{orgId}/campaigns`)            | P2       | M          | Sprint 3    |
| ABM-002 | Target account list builder (filter Accounts by vertical/segment)           | P2       | M          | Unscheduled |
| ABM-003 | Trigger a BalloAds journey/campaign from a CRM campaign (via developer API) | P2       | L          | Unscheduled |
| ABM-004 | ABM campaign performance view (opens/clicks read back from BalloAds)        | P3       | M          | Unscheduled |

## AI Commercial Intelligence

| Task ID | Title                                                                 | Priority | Complexity | Sprint      |
| ------- | --------------------------------------------------------------------- | -------- | ---------- | ----------- |
| AI-001  | `aiJobs` collection + `queued/running/completed/failed` state machine | P1       | M          | Sprint 3    |
| AI-002  | Brutus AI client wrapper in `lib/ai/brutus.ts` (server-only)          | P1       | M          | Sprint 3    |
| AI-003  | Opportunity qualification scoring AI job                              | P2       | L          | Unscheduled |
| AI-004  | Next-best-action recommendation panel on Account/Opportunity detail   | P2       | L          | Unscheduled |
| AI-005  | Account/Contact AI summarization panel                                | P2       | M          | Unscheduled |
| AI-006  | Cross-sell / upsell signal detection job                              | P3       | L          | Unscheduled |

## Analytics

| Task ID  | Title                                                        | Priority | Complexity | Sprint      |
| -------- | ------------------------------------------------------------ | -------- | ---------- | ----------- |
| ANLY-001 | Analytics data aggregation service (writes `analyticsCache`) | P2       | L          | Sprint 3    |
| ANLY-002 | Pipeline/forecast dashboard (Recharts) on `/analytics`       | P2       | L          | Unscheduled |
| ANLY-003 | Natural-language pipeline Q&A panel (Brutus AI)              | P3       | L          | Unscheduled |

## Vertical Sales Indexing

| Task ID | Title                                                                 | Priority | Complexity | Sprint      |
| ------- | --------------------------------------------------------------------- | -------- | ---------- | ----------- |
| VSI-001 | Industry vertical taxonomy field on Account schema                    | P2       | S          | Sprint 2    |
| VSI-002 | Vertical-based segmentation view (filter Accounts/Opportunities)      | P2       | M          | Unscheduled |
| VSI-003 | Vertical benchmarking analytics (compare pipeline health by vertical) | P3       | M          | Unscheduled |

## Automated Customer Communications

| Task ID  | Title                                                                             | Priority | Complexity | Sprint      |
| -------- | --------------------------------------------------------------------------------- | -------- | ---------- | ----------- |
| COMM-001 | BalloAds developer-portal API client (`lib/balloads/client.ts`, server-only)      | P1       | M          | Sprint 3    |
| COMM-002 | Encrypted developer API key storage (`integrations/balloAds`) + admin-only access | P1       | M          | Sprint 3    |
| COMM-003 | Trigger onboarding sequence from Opportunity stage change, logged as Activity     | P2       | M          | Unscheduled |
| COMM-004 | Read delivery/opt-out status back into Contact/Account timeline                   | P2       | M          | Unscheduled |

## Priority Matrix (Impact vs. Effort)

Use this to decide what to pull into Sprint 2/3 planning once Sprint 1 closes. "Impact" is
judging/demo impact for the hackathon; "Effort" is calibrated to hackathon-compressed sprints
(see [../sprint-plan.md](../sprint-plan.md)), not calendar time.

| Quadrant                                                | Item                                                     | Why it lands here                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **High impact / Low effort — do next**                  | Surface BalloAds `HealthScore` (CRM-006)                 | Existing external field, just needs a UI badge — cheap, visibly "AI-ish" for judges                                       |
| **High impact / Low effort — do next**                  | Contacts CRUD (CRM-010/011)                              | Directly extends the Sprint 1 Accounts pattern, low novelty risk                                                          |
| **High impact / Low effort — do next**                  | Vertical taxonomy field (VSI-001)                        | One schema field unlocks segmentation demos later for near-zero cost                                                      |
| **High impact / High effort — plan carefully**          | Opportunity pipeline + kanban (CRM-020/021)              | Core "CRM" narrative for judges, but a full pipeline UI is a multi-day slice                                              |
| **High impact / High effort — plan carefully**          | AI qualification scoring + next-best-action (AI-003/004) | The headline differentiator ("AI Commercial Intelligence") but depends on AI-001/002 landing first                        |
| **High impact / High effort — plan carefully**          | Automated communications trigger (COMM-003)              | Strong demo moment ("CRM stage change fires a real BalloAds message") but needs the API client + credential storage first |
| **Medium impact / Low effort — fill-in**                | Contract CRUD (CRM-030/031)                              | Expected CRM feature, straightforward CRUD, not a differentiator                                                          |
| **Medium impact / Medium effort — fill-in**             | Analytics dashboard (ANLY-001/002)                       | Good visual payoff with Recharts already installed, but needs aggregation plumbing first                                  |
| **Low impact / High effort — avoid until core is done** | Natural-language pipeline Q&A (ANLY-003)                 | Impressive but high-risk/high-effort; only attempt if AI-001-005 and analytics are already solid                          |
| **Low impact / High effort — avoid until core is done** | Full ABM campaign performance loop (ABM-002/003/004)     | Depends on BalloAds integration _and_ a campaign data model — defer past Sprint 3 unless time allows                      |
