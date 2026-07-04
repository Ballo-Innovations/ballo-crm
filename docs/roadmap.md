# Roadmap

This is the long-term, high-level roadmap for BalloCRM beyond the hackathon's immediate sprints.
For day-to-day task breakdown and ownership, see [sprint-plan.md](./sprint-plan.md) and
[tasks/backlog.md](./tasks/backlog.md). This document maps the product mission's capability list
(from the project brief) to the phase where each capability lands, and is honest about
infrastructure that does not exist yet.

## Capability → Phase Map

| Capability                                                | Phase                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Firebase Auth, app shell, navigation                      | Phase 1                                                                         |
| CIMS (Accounts, Contacts)                                 | Phase 1 → Phase 2                                                               |
| Sales Pipelines (Opportunities)                           | Phase 2                                                                         |
| Contracts                                                 | Phase 2                                                                         |
| Customer Journey (lifecycle stages)                       | Phase 2                                                                         |
| Opportunity Qualification (BANT/MEDDIC fields)            | Phase 2 → Phase 3 (AI-assisted)                                                 |
| AI Commercial Intelligence (Brutus AI)                    | Phase 3                                                                         |
| Cross-selling / Upselling signals                         | Phase 3                                                                         |
| Automated Customer Communications (via BalloAds)          | Phase 3 → Phase 4                                                               |
| Commercial Analytics (dashboards, forecasting)            | Phase 4                                                                         |
| ABM (Account-Based Marketing)                             | Phase 4                                                                         |
| Vertical Sales Indexing                                   | Phase 4                                                                         |
| Testing (Jest/Vitest/Playwright), CI (GitHub Actions)     | Cross-cutting — starts in Phase 2, see [Known Gaps](#known-gaps-to-close-early) |
| Enterprise hardening (granular permissions, audit, scale) | Phase 5                                                                         |

## Phase 1 — Foundation (in progress)

Deployable skeleton proving the stack end to end: Firebase Auth sign-in with session cookie
issuance, a rendered dashboard shell with real sidebar/topbar navigation wired to `primaryNav`,
and one working CRM entity — Accounts — with Create/Read against Firestore through the
repository → service → action pattern. No Opportunities, Contracts, Campaigns, ABM, or AI features
yet. Full task ownership across the three Sprint 1 developers is tracked in
[sprint-plan.md](./sprint-plan.md), [tasks/sprint-1.md](./tasks/sprint-1.md), and the per-developer
files ([developer-1.md](./tasks/developer-1.md), [developer-2.md](./tasks/developer-2.md),
[developer-3.md](./tasks/developer-3.md)).

## Phase 2 — Core CRM MVP

Complete the core commercial-operations data model and CRUD surface: full Opportunity pipeline
(stages, Kanban/list views, Opportunity Qualification fields), Contracts (creation, renewal
tracking, association to won Opportunities), and Customer Journey lifecycle-stage tracking on
Accounts/Contacts (see [glossary.md](./glossary.md#customer-journey) for why this is explicitly
not the same thing as a BalloAds Journey). This phase also delivers the first read-only
integration with BalloAds: pulling Health Score and delivery/opt-out status into the Account and
Contact timeline via the [Developer Portal API](./integrations.md). This is the phase where a
minimal test framework and CI pipeline must be introduced (see
[Known Gaps](#known-gaps-to-close-early)) — building Opportunities/Contracts without any
regression safety net is the point at which the debt becomes expensive to defer further.

## Phase 3 — AI Commercial Intelligence

Brutus AI comes online as the AI Job pipeline described in [architecture.md](./architecture.md):
Opportunity Qualification scoring assistance, next-best-action recommendations surfaced on
Account and Opportunity views, account/contact summarization, and cross-sell/upsell signal
detection driven by health score, contract, and activity data. This phase also introduces
outbound Automated Customer Communications: CRM workflows (e.g., an Opportunity stage change or a
Customer Journey stage transition) triggering a BalloAds Journey or campaign via the Developer
Portal API, always logged back as a CRM Activity — never a second delivery loop inside BalloCRM.

## Phase 4 — Advanced Analytics & ABM

Commercial Analytics dashboards (pipeline velocity, win rate, forecasting, account health
distribution) backed by aggregate queries and, where volume requires it, the
`analyticsCache` collection. Account-Based Marketing tooling: account targeting lists, campaign-
to-account association, and coordinated outreach planning executed through BalloAds. Vertical
Sales Indexing formalized as a first-class segmentation dimension across Accounts, Opportunities,
and analytics views, letting RevOps benchmark and forecast per industry vertical rather than only
in aggregate. Automated Customer Communications matures from single triggers (Phase 3) to
lifecycle-stage-driven sequences configured per vertical or segment.

## Phase 5 — Scale & Enterprise Hardening

Once the product surface is complete, harden it for real multi-organization, multi-team usage:
granular permission checks beyond the five base [Roles](./glossary.md#role) (e.g., account-level
ownership restrictions, field-level visibility), audit log completeness review, Firestore index
and query cost review at scale (see [indexes.md](./indexes.md)), rate limiting and retry/backoff
around all Developer Portal API calls, and a full accessibility (WCAG 2.1 AA) audit pass across
the UI. Test coverage and CI maturity (contract tests against the BalloAds API surface, E2E
coverage of the core CRUD + AI Job flows) are load-bearing gates for this phase, not optional
polish.

## Known Gaps to Close Early

As of the current scaffolded state (see the ground-truth section of the project brief), **no test
framework is installed** (no Jest, Vitest, or Playwright, and `package.json` has no `test`
script) and **no CI pipeline exists** (no GitHub Actions workflows). These are tracked as open
risks in [risks.md](./risks.md) rather than assumed away. The roadmap treats closing this gap as
mandatory work at the start of Phase 2, before Opportunities and Contracts CRUD grows the surface
area that a regression would silently break — not a "someday" item deferred to Phase 5.
