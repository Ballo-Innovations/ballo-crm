# Sprint 3 — ABM, Commercial Analytics, Signals & Demo Hardening

**Sprint goal:** deliver Campaigns/Account-Based Marketing tied to real BalloAds triggers, a
Commercial Analytics dashboard (pipeline velocity, forecasting, health-score distribution),
cross-sell/upsell signal surfacing as a second Brutus AI Job type, Vertical Sales Indexing, and
the polish/hardening pass a hackathon demo needs — empty states, loading skeletons, error
boundaries, and a final documentation sync — per [roadmap.md](../roadmap.md) Phase 4 (pulled
forward for the hackathon's compressed timeline).

**Team and numbering:** tasks continue from [sprint-2.md](./sprint-2.md)'s numbering — `INFRA-*`
continues at `INFRA-006`, `SHELL-*` continues at `SHELL-006`, `CRM-*`'s Opportunities/Contracts
work is done as of Sprint 2 so this sprint introduces `ABM-*` (Campaigns/ABM), `ANLY-*`
(Commercial Analytics), and `VSI-*` (Vertical Sales Indexing) per [task-template.md](./task-template.md)'s
AREA list, and `AI-*`/`COMM-*` continue at `AI-003`/`COMM-003`. Ownership continues the same
per-developer split established across Sprint 1-2: Developer 3 (Core CRM Domain) owns new
data-layer + feature work (`ABM-*`, `AI-003`, `VSI-001`, `COMM-003`); Developer 2 (Shell &
Design System) owns the Analytics dashboard's visual/UI layer and demo-polish work (`ANLY-002`,
`SHELL-006`); Developer 1 (Infrastructure) owns the production-readiness wrap-up
(`INFRA-006`, `DOCS-001`).

Field structure for every task below follows [task-template.md](./task-template.md); the same
project-wide Definition of Done from [sprint-1.md](./sprint-1.md) applies throughout.

---

### ABM-001: Campaigns data layer tied to BalloAds triggers

- **Task ID**: `ABM-001`
- **Epic**: Account-Based Marketing
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Implement Campaigns schema, repository, and service composed with the BalloAds client
- **Objective**: Model a Campaign as a CRM-native record (name, target segment, status, linked
  BalloAds journey reference) that, when activated, calls `lib/balloads/` (from
  [sprint-2.md](./sprint-2.md) `COMM-001`) to actually enrol the targeted accounts/contacts.
- **Business Value**: Campaigns/ABM is a headline product-mission capability; this task is what
  makes "BalloCRM triggers real outbound communication through BalloAds" demonstrable rather than
  theoretical.
- **Dependencies**: `COMM-001` (BalloAds client), `CRM-001` (Account targeting).
- **Target Files**:
  - `features/campaigns/schemas/campaign-schema.ts`
  - `repositories/campaigns-repository.ts`
  - `services/campaigns-service.ts`
  - `features/campaigns/actions/create-campaign.ts`
  - `features/campaigns/actions/activate-campaign.ts`
- **Technical Instructions**: `campaignSchema` fields: `id`, `orgId`, `name`, `targetFilter`
  (a structured filter — e.g. `{ industryVertical, lifecycleStage }` — reused by `VSI-001`'s
  segmentation work), `balloAdsJourneyRef` (named per the `balloAds`-prefix naming rule in
  [integrations.md](../integrations.md), never a bare `journeyId`), `status` (`draft`, `active`,
  `completed`, `paused`), `createdBy`, `createdAt`, `updatedAt`. `activate-campaign.ts` resolves
  `targetFilter` against `accounts-repository.ts`'s query functions, calls `lib/balloads/`'s
  trigger function once per resolved target, and writes an `activities` entry per account
  triggered — reusing `COMM-002`'s established pattern rather than inventing a new one.
- **Acceptance Criteria**: Activating a campaign resolves the correct set of accounts per
  `targetFilter`, calls BalloAds (real or mock) once per account, and logs one `activities` entry
  per call; campaign `status` transitions to `active` only after at least one successful trigger
  call.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) and
        [../integrations.md](../integrations.md) updated; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: [../integrations.md](../integrations.md) (naming-collision
  section), [sprint-2.md](./sprint-2.md) `COMM-001`/`COMM-002`.
- **Testing Notes**: Manual verification in BalloAds mock mode: create a campaign targeting a
  known filter, activate it, confirm one Activity per matched account.

### ABM-002: Campaigns list and detail UI

- **Task ID**: `ABM-002`
- **Epic**: Account-Based Marketing
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the Campaigns list page and campaign detail view
- **Objective**: Give Campaigns a UI at `/campaigns` — a list, a create form, and a detail view
  showing the resolved target segment and the trigger/activity log from `ABM-001`.
- **Business Value**: Completes the ABM vertical slice into something judge-demoable: build a
  segment, activate it, watch the Activity log populate.
- **Dependencies**: `ABM-001`.
- **Target Files**:
  - `app/(dashboard)/campaigns/page.tsx`
  - `app/(dashboard)/campaigns/[campaignId]/page.tsx`
  - `features/campaigns/components/campaigns-table.tsx`
  - `features/campaigns/components/create-campaign-form.tsx`
  - `features/campaigns/components/campaign-target-preview.tsx`
- **Technical Instructions**: Reuse `data-table.tsx` and the established dialog/form pattern.
  `campaign-target-preview.tsx` shows a live count/preview of accounts matching `targetFilter`
  before activation (a read-only query, no BalloAds call), so a rep can sanity-check a segment
  before committing to an outbound trigger.
- **Acceptance Criteria**: `/campaigns` lists all campaigns with status; the create form lets a
  user build a `targetFilter` and see a live matching-account count before saving; the detail
  view's activity log updates after activation.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../routes.md](../routes.md) updated; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: [sprint-1.md](./sprint-1.md) `CRM-003`/`CRM-004`.
- **Testing Notes**: Manual verification of the full create → preview → activate → activity-log
  flow.

### ANLY-001: Commercial Analytics data aggregation service

- **Task ID**: `ANLY-001`
- **Epic**: Commercial Analytics
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Implement the analytics aggregation service (pipeline velocity, forecast, health-score distribution)
- **Objective**: Compute the three headline analytics metrics from existing `opportunities` and
  `accounts` data — average time-in-stage (pipeline velocity), a simple weighted-pipeline revenue
  forecast, and a health-score distribution histogram bucket count — and cache the result in
  `organizations/{orgId}/analyticsCache` (already reserved in `firestore.rules`) rather than
  recomputing on every dashboard load.
- **Business Value**: Commercial Analytics is a headline product-mission capability and the
  data-layer prerequisite for `ANLY-002`'s dashboard — without a real aggregation, the dashboard
  would have nothing genuine to chart.
- **Dependencies**: `CRM-007` (Opportunities, for velocity/forecast), `COMM-002` (Health Score
  field, for the distribution).
- **Target Files**:
  - `services/analytics-service.ts`
  - `repositories/analytics-cache-repository.ts`
  - `features/analytics/actions/get-dashboard-metrics.ts`
- **Technical Instructions**: Pipeline velocity: average number of days an Opportunity spends in
  each `stage`, computed from the stage-transition `activities` entries `CRM-007`'s
  `update-opportunity-stage` already logs (avoiding a second source of truth, per
  [risks.md](../risks.md) R9). Forecast: sum of `amount` per open Opportunity weighted by a
  simple per-stage probability table (e.g. `prospecting: 0.1`, ... `negotiation: 0.7`) — document
  the weighting as an explicit, overridable constant, not a hidden magic number. Health-score
  distribution: bucket counts (e.g. 0-20, 21-40, ... 81-100) over Accounts with a non-null
  `healthScore`. Cache the computed result with a `computedAt` timestamp and a cheap
  staleness check (recompute if older than, e.g., 15 minutes) rather than on every request.
- **Acceptance Criteria**: `get-dashboard-metrics` returns all three metrics from real Firestore
  data; a second call within the staleness window reads the cache instead of recomputing; the
  forecast weighting table is a named, documented constant.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) updated with the
        `analyticsCache` shape; project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: [../risks.md](../risks.md) R9, [../database-schema.md](../database-schema.md).
- **Testing Notes**: Unit tests for the velocity/forecast math against fixture data if the test
  framework (`INFRA-005`) is in place by this sprint — this is exactly the kind of pure-function
  business logic that's cheap to test and expensive to get subtly wrong in a live demo; otherwise
  manual verification against a known seeded data set with hand-checked expected output.

### ANLY-002: Commercial Analytics dashboard UI

- **Task ID**: `ANLY-002`
- **Epic**: Commercial Analytics
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Build the `/analytics` dashboard page with Recharts visualizations
- **Objective**: Render `ANLY-001`'s three metrics as an enterprise-dashboard page — a pipeline
  velocity bar/funnel chart, a forecast line/area chart, and a health-score distribution
  histogram — using `recharts` (already installed) and the dashboard shell from Sprint 1.
- **Business Value**: This is the single most visually persuasive screen in the product for a
  judging audience — dashboards are explicitly called out in the UI direction
  ([vision.md](../vision.md): Stripe Dashboard, Vercel Dashboard inspiration).
- **Dependencies**: `ANLY-001`; reuses `SHELL-002`'s dashboard shell.
- **Target Files**:
  - `app/(dashboard)/analytics/page.tsx`
  - `features/analytics/components/pipeline-velocity-chart.tsx`
  - `features/analytics/components/forecast-chart.tsx`
  - `features/analytics/components/health-score-histogram.tsx`
  - `features/analytics/components/metric-card.tsx`
- **Technical Instructions**: `metric-card.tsx` is a small stat-tile component (per the
  design-system conventions in [ui-design-system.md](../ui-design-system.md)) used above the
  charts for headline numbers (total pipeline value, weighted forecast, average velocity). Each
  chart component is a Client Component (Recharts requires it) kept as small and leaf-level as
  possible per the Server/Client decision rule in [architecture.md](../architecture.md) §2 — the
  page itself stays a Server Component that prefetches `get-dashboard-metrics` and passes plain
  data down as props. Render an explicit loading-skeleton state (via
  `components/ui/skeleton.tsx`) and an explicit "not enough data yet" empty state for a brand-new
  org with no closed/open opportunities, rather than an empty or broken chart.
- **Acceptance Criteria**: `/analytics` renders all three charts with real data from `ANLY-001`;
  a brand-new org with no data shows a clear empty state instead of a blank or error chart;
  charts are responsive and legible at common demo-screen widths.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../routes.md](../routes.md) and
        [../ui-design-system.md](../ui-design-system.md) updated; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 6-8
- **Documentation References**: [../ui-design-system.md](../ui-design-system.md),
  [../architecture.md](../architecture.md) §2.
- **Testing Notes**: Manual verification against both a seeded demo org (rich data) and a fresh
  empty org (empty state); resize to the actual demo presentation resolution ahead of the
  hackathon to catch overflow/scroll issues early.

### AI-003: Cross-sell/upsell signal detection

- **Task ID**: `AI-003`
- **Epic**: AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Implement cross-sell/upsell signal detection as a Brutus AI Job
- **Objective**: Add a second AI Job type (`cross_sell_signal`) that scores an Account's
  cross-sell/upsell likelihood from its Health Score, contract status, and activity recency, and
  surfaces flagged accounts as a badge/panel on the Account list and detail views.
- **Business Value**: Cross-selling/Upselling signals are an explicit product-mission item and a
  strong differentiator in the pitch — "the CRM tells reps who to call next," not just "the CRM
  stores records."
- **Dependencies**: `AI-001` (job scaffold, from Sprint 2), `COMM-002` (Health Score),
  `CRM-009` (Contracts, for renewal-proximity signal).
- **Target Files**:
  - `services/cross-sell-signal-service.ts`
  - `features/accounts/actions/detect-cross-sell-signals.ts`
  - `features/accounts/components/cross-sell-badge.tsx`
  - `features/accounts/components/cross-sell-signal-panel.tsx`
- **Technical Instructions**: Reuse `AI-001`'s `runAiJob` helper exactly as `AI-002` did — this
  task should be materially smaller than `AI-002` because the job-lifecycle scaffolding already
  exists. The handler composes: `healthScore` (high score = healthy = good upsell candidate),
  contract `renewalDate` proximity (from `CRM-009`), and `activities` recency, sending this
  composed context to `lib/brutus/client.ts` for a signal + rationale. Run detection on-demand
  (an "Analyze" button on the Account list, batched across visible accounts) rather than a
  background cron for Sprint 3's scope — a scheduled batch job is a reasonable Phase 5+ item
  noted in [roadmap.md](../roadmap.md), not built here.
- **Acceptance Criteria**: Running detection flags at least the accounts an obvious fixture case
  should flag (high health score + contract renewal within 60 days); flagged accounts show a
  badge in the list and a rationale panel on the detail page; a failed job shows a visible failed
  state, never a silent no-op.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../integrations.md](../integrations.md) updated with the
        `cross_sell_signal` job type's payload/result shape; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: [../integrations.md](../integrations.md),
  [sprint-2.md](./sprint-2.md) `AI-001`/`AI-002`.
- **Testing Notes**: Manual verification against a fixture account crafted to obviously qualify
  (high health score, near-term renewal) and one that obviously shouldn't, confirming both are
  scored correctly.

### VSI-001: Vertical Sales Indexing — segmentation and filtering

- **Task ID**: `VSI-001`
- **Epic**: Vertical Sales Indexing
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Add industry-vertical filtering across Accounts, Opportunities, and Analytics
- **Objective**: Turn the `industryVertical` field already reserved on the Account schema
  (`CRM-001`, Sprint 1) into an actual segmentation feature — filter tabs/dropdowns on the
  Accounts and Opportunities list views, and a vertical breakdown widget on the Analytics
  dashboard.
- **Business Value**: Vertical Sales Indexing is an explicit product-mission item; because the
  underlying field was seeded early (Sprint 1's `CRM-001`), this task is primarily UI and query
  work rather than a schema migration, which is deliberately how it was planned.
- **Dependencies**: `CRM-001` (field already exists), `ANLY-001` (for the dashboard widget).
- **Target Files**:
  - `repositories/accounts-repository.ts` (extend `listAccounts` with an `industryVertical`
    filter parameter)
  - `repositories/opportunities-repository.ts` (same extension, via `accountId` join or a
    denormalized `industryVertical` copy per [risks.md](../risks.md) R9)
  - `features/accounts/components/vertical-filter-tabs.tsx`
  - `features/analytics/components/vertical-breakdown-widget.tsx`
- **Technical Instructions**: Prefer denormalizing `industryVertical` onto Opportunity documents
  at create-time (copied from the linked Account) over a per-row join read, consistent with the
  N+1-avoidance principle already applied in `CRM-006`. `vertical-filter-tabs.tsx` reuses
  `components/ui/tabs.tsx`; ensure "All verticals" is the default and the account creation form
  (`CRM-004`) exposes `industryVertical` as a select input if it doesn't already collect it.
- **Acceptance Criteria**: Filtering the Accounts list by vertical returns only matching accounts;
  the Opportunities list filter behaves identically; the Analytics dashboard's vertical breakdown
  widget sums pipeline value per vertical correctly.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) updated to note
        the denormalized `industryVertical` field on Opportunities; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: [../risks.md](../risks.md) R9, [sprint-1.md](./sprint-1.md)
  `CRM-001`.
- **Testing Notes**: Manual verification: seed accounts across at least three verticals, confirm
  each filter view and the analytics widget's totals match a hand-computed expectation.

### SHELL-006: Demo polish — empty states, skeletons, and error boundaries

- **Task ID**: `SHELL-006`
- **Epic**: Design System — Hardening
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Add empty states, loading skeletons, and error boundaries across all list/detail pages
- **Objective**: Audit every screen shipped across Sprints 1-3 (Accounts, Contacts, Opportunities,
  Contracts, Campaigns, Analytics) and ensure each has a real loading skeleton
  (`components/ui/skeleton.tsx`), a real empty state (`components/shared/empty-state.tsx` from
  Sprint 1's `SHELL-004`), and a route-level `error.tsx` boundary — no screen should be able to
  show a blank white page or an unhandled crash during the live demo.
- **Business Value**: Directly mitigates [risks.md](../risks.md) R3 (hackathon time pressure vs.
  quality bar) at the one point in the schedule reserved for it — a polish pass done once,
  broadly, rather than piecemeal under pressure feature-by-feature.
- **Dependencies**: All list/detail pages from Sprints 1-3 (`CRM-003`, `CRM-006`, `CRM-008`,
  `CRM-010`, `ABM-002`, `ANLY-002`).
- **Target Files**:
  - `app/(dashboard)/accounts/error.tsx`, `.../contacts/error.tsx`,
    `.../opportunities/error.tsx`, `.../contracts/error.tsx`, `.../campaigns/error.tsx`,
    `.../analytics/error.tsx` (new — one per route)
  - `app/(dashboard)/loading.tsx` (new — shell-level fallback)
  - Per-feature `components/*.tsx` touch-ups wherever a loading/empty state was skipped under
    Sprint 1-2 time pressure
- **Technical Instructions**: Each `error.tsx` is a Client Component per Next.js's error-boundary
  contract, rendering `components/ui/alert.tsx` with a "Try again" button (calling the provided
  `reset()`), never a raw stack trace in the demo build. Sweep every list page built in Sprints
  1-2 and confirm it actually reaches `SHELL-004`'s empty-state component on zero rows rather than
  an empty table header — several may have been left as a stopgap under sprint time pressure and
  need to be finished here, not newly invented.
- **Acceptance Criteria**: Every route listed above has a working `error.tsx` that renders on a
  forced error and recovers via "Try again"; every list page shows a real empty state on zero
  data; no console-visible unhandled rejection occurs across a full click-through of the app.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../ui-design-system.md](../ui-design-system.md) updated;
        project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: [../risks.md](../risks.md) R3, R12,
  [../ui-design-system.md](../ui-design-system.md).
- **Testing Notes**: Manual click-through of every route in both an empty new-org state and a
  forced-error state (e.g. temporarily throw inside a Server Component) to confirm every boundary
  actually catches.

### COMM-003: Read BalloAds delivery and opt-out status into the timeline

- **Task ID**: `COMM-003`
- **Epic**: BalloAds Integration
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Sync BalloAds delivery/opt-out status into the Account/Contact activity timeline
- **Objective**: Extend `lib/balloads/client.ts` (from `COMM-001`) with the "read delivery status"
  and "read opt-out status" calls described in [integrations.md](../integrations.md), and render
  them in the Account/Contact timeline (the `activities` query, per
  [decisions.md](../decisions.md)) rather than maintaining a second status ledger.
- **Business Value**: Completes the BalloAds read-back loop the product brief calls out
  explicitly — reps see message delivery/opt-out state without leaving BalloCRM, without BalloCRM
  ever owning that data.
- **Dependencies**: `COMM-001`, `COMM-002`.
- **Target Files**:
  - `lib/balloads/client.ts` (extend with delivery-status and opt-out read functions)
  - `features/accounts/actions/sync-balloads-status.ts`
  - `features/contacts/components/opt-out-indicator.tsx`
- **Technical Instructions**: `sync-balloads-status.ts` calls the new client functions and writes
  the result as `activities` entries (`type: "balloads_delivery_status"` /
  `"balloads_opt_out_status"`) rather than a new collection, per the deliberate
  no-separate-timeline-collection decision. `opt-out-indicator.tsx` grays out a "Trigger send"
  affordance on an opted-out contact rather than allowing an action BalloAds would reject anyway.
- **Acceptance Criteria**: Syncing status writes activity entries visible in the existing timeline
  query; an opted-out contact's send affordance is visibly disabled with an explanatory tooltip.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../integrations.md](../integrations.md) updated to mark this
        endpoint as implemented (still noting payload shape as TBC if no live spec was confirmed);
        project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: [../integrations.md](../integrations.md),
  [../decisions.md](../decisions.md).
- **Testing Notes**: Manual verification in mock mode: sync status for a fixture contact marked
  opted-out, confirm the UI affordance disables and the activity entry appears.

### INFRA-006: Production deployment checklist and Vercel promotion

- **Task ID**: `INFRA-006`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Finalize production Vercel deployment and pre-demo environment audit
- **Objective**: Confirm the production Vercel project is correctly connected to the Firebase
  project from `INFRA-001`, all server-only secrets (`BALLOADS_DEVELOPER_API_KEY`,
  `BRUTUS_AI_API_KEY`, Firebase Admin credentials) are set as Vercel environment variables (never
  committed), and a final smoke test passes against the deployed URL before the demo.
- **Business Value**: A hackathon demo failing because of a misconfigured production environment,
  rather than a code defect, is the most avoidable failure mode in the whole project — this task
  exists specifically to eliminate it.
- **Dependencies**: All Sprint 1-3 feature work that's expected to be demoed.
- **Target Files**:
  - `docs/deployment.md` (update with the final, real deployment steps taken)
  - `.env.example` (final audit — confirm every key documented matches what's actually read by
    `config/env.ts`)
  - `vercel.json` (if any project-level config is needed — otherwise confirm none is)
- **Technical Instructions**: Re-run the full env var audit from [risks.md](../risks.md) R6:
  grep the codebase for every `process.env.` read and confirm each server-only key is never
  reachable from a file importable by a Client Component. Confirm Vercel's production environment
  variables match `.env.example`'s final key list exactly (no stale or missing keys). Run a full
  manual click-through against the deployed production URL covering sign-in, Accounts CRUD, the
  Opportunities pipeline, an AI Job, and the Analytics dashboard.
- **Acceptance Criteria**: Production URL supports the full demo flow end to end with no
  environment-related errors; no server-only secret appears in the client bundle (verified via a
  browser devtools network/source check); `docs/deployment.md` reflects the actual steps taken,
  not a hypothetical plan.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../deployment.md](../deployment.md) updated; project-wide DoD
        met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: [../deployment.md](../deployment.md), [../risks.md](../risks.md) R6.
- **Testing Notes**: Manual, deployed-environment click-through per the acceptance criteria; this
  is deliberately the one task in the whole sprint plan verified against production, not local
  dev, since that's the only environment that matters for the actual demo.

### DOCS-001: Pre-demo documentation wrap-up

- **Task ID**: `DOCS-001`
- **Epic**: Documentation
- **Priority**: P0
- **Owner**: Developer 1 (coordinating; each developer updates the sections covering their own
  Sprint 3 tasks before handoff)
- **Title**: Bring `progress.md`, `changelog.md`, and `roadmap.md` current before the hackathon demo
- **Objective**: Do a final, deliberate documentation sync — rather than the per-task incremental
  updates every prior task's Definition of Done already required — to catch any doc that drifted
  from what actually shipped across three sprints, per the documentation-driven-development
  principle in the project brief.
- **Business Value**: Judges and future contributors read `/docs` as the source of truth; a doc
  set that's drifted from reality undermines the "documentation-driven development" pitch itself,
  which is one of this project's own stated architecture principles.
- **Dependencies**: All other Sprint 3 tasks (this is the sprint's closing task).
- **Target Files**:
  - `docs/progress.md`
  - `docs/changelog.md`
  - `docs/roadmap.md`
  - `docs/risks.md` (close out or update likelihood/impact on any risk resolved this sprint)
- **Technical Instructions**: Walk `docs/progress.md` feature-by-feature against what's actually
  merged (not planned) as of the demo date; update `docs/roadmap.md`'s Phase 1-4 capability map to
  reflect real completion status per phase; append a final `docs/changelog.md` entry summarizing
  the hackathon build; in `docs/risks.md`, strike through (with a note, not a deletion, per its
  own stated convention) any risk fully mitigated this sprint — e.g. R1 (testing/CI) if `INFRA-004`
  /`INFRA-005` fully landed, R2 (BalloAds contract) if a real sandbox was confirmed by
  `COMM-001`/`COMM-003`.
- **Acceptance Criteria**: `docs/progress.md` matches the actual merged state of the app with no
  known drift; `docs/roadmap.md`'s phase map reflects reality; `docs/changelog.md` has a complete
  entry for the hackathon build; `docs/risks.md` reflects the current, not Sprint-0, status of
  every risk.
- **Definition of Done**:
  - [ ] Acceptance criteria met; every other Sprint 1-3 task file
        ([sprint-1.md](./sprint-1.md), [sprint-2.md](./sprint-2.md), this file) has no task left
        in an ambiguous "started but undocumented" state; project-wide DoD met.
- **Estimated Complexity**: S
- **Estimated Hours**: 2-3
- **Documentation References**: [../roadmap.md](../roadmap.md), [../risks.md](../risks.md),
  and every task file in [docs/tasks/](./sprint-1.md).
- **Testing Notes**: Not applicable in the code-testing sense; verification is a documentation
  review — have a developer who did not write a given doc section read it against the live app
  and confirm no contradiction, mirroring the spirit of a code review for prose.

---

## Cross-track dependencies

- **`ANLY-002`'s dashboard is the sprint's highest-risk single point of failure for the demo** —
  it depends on `ANLY-001`'s real aggregation, which in turn depends on `CRM-007`/`COMM-002` data
  actually existing in the demo org. Seed representative demo data (accounts across several
  verticals and health scores, opportunities across every stage, at least one closed-won
  contract) well before `SHELL-006`'s polish pass and `INFRA-006`'s production smoke test, so
  these later tasks are validating against realistic data, not an empty dashboard.
- **`AI-003` and `VSI-001` are both P2 — if the sprint runs short, cut here first**, not from
  `ABM-001`/`ANLY-001`/`ANLY-002`, since Campaigns and Analytics are the two headline demo
  narratives explicitly named in the sprint goal; cross-sell signals and vertical filtering
  strengthen the pitch but the demo survives without them.
- **`SHELL-006` and `INFRA-006` should run last, in that order** — polish depends on every feature
  screen existing, and the production smoke test is only meaningful once polish has landed (no
  point smoke-testing broken empty states in production).
- **`DOCS-001` is the explicit final task of the hackathon build** — it should not start in
  earnest until the other tasks above are functionally complete, per its own dependency list.
- See [sprint-1.md](./sprint-1.md) and [sprint-2.md](./sprint-2.md) for the full lineage this
  sprint's tasks build on.
