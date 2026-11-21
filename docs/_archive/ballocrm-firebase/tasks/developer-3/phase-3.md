# Phase 3 - Commercial Intelligence (Brutus AI) & automated communications

Phase 3 layers the differentiators on top of the core CRM: the Brutus AI **commercial-intelligence
jobs** (qualification scoring, next-best-action, summarization, cross-sell signals) modeled as async
`aiJobs` documents per
[ADR-008](../../decisions.md#adr-008-ai-work-modeled-as-async-trackable-aijobs-documents), the
pipeline-velocity domain computation, the BalloAds health-score enrichment surface, and the first
live BalloAds-triggered communications (both writing an activity on trigger and reading
delivery/opt-out status back).

Two hard architectural boundaries govern this whole phase:

- **AI is async and server-only.** Every Brutus call goes through `lib/brutus/` (AI-002) from a
  `services/` function, is tracked as an `aiJobs` document (`queued → running → completed|failed`),
  and the UI observes the job - it never blocks on the model call
  ([../../integrations.md](../../integrations.md), [../../architecture.md](../../architecture.md) §7).
- **BalloCRM never sends or reimplements messaging.** Every "trigger a sequence" is a call into the
  BalloAds developer-portal API via `lib/balloads/` (COMM-001), logged as an activity; every status
  is read back from BalloAds, never stored as a BalloCRM ledger
  ([ADR-007](../../decisions.md#adr-007-balloads-integration-exclusively-via-v1developer-portal-rest-apis-server-side-only)).

Developer 3 owns the **data/service side** of the AI jobs; the AI _panels_ on the detail views are
Developer 2's (e.g. AI-010). See [README.md](./README.md#id-reconciliation-note) for the AI-004/005
data-vs-UI split and the CRM-050 ID reconciliation.

---

### CRM-050: Surface BalloAds `healthScore` as a read-only enrichment field on Account/Contact views

- **Task ID**: `CRM-050` (reconciles to [../backlog.md](../backlog.md) **CRM-006**, "health score
  badge" - see [README.md](./README.md#id-reconciliation-note))
- **Epic**: Accounts / AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Surface the BalloAds health score as a labeled, read-only enrichment field
- **Objective**: Display the BalloAds-computed `healthScore` (0-100, `healthScoreSource: "balloAds"`)
  on the Account (and, where exposed, Contact) views as a clearly-labeled, read-only enrichment
  field - consuming the sync job (INFRA-014), never computing a score in BalloCRM.
- **Business Value**: A cheap, visibly "AI-ish" signal for judges (High impact / Low effort in the
  [backlog priority matrix](../backlog.md#priority-matrix-impact-vs-effort)) - an existing external
  field surfaced as a badge.
- **Dependencies**: `CRM-005` (account detail), `CRM-003` (list); `INFRA-014` (BalloAds health sync
  job that writes `healthScore`) - **soft**: until it lands, render whatever `healthScore` exists on
  the doc and show a "not yet synced" state when absent (omit rather than approximate, per
  [../../integrations.md](../../integrations.md)).
- **Target Files**:
  - `features/accounts/components/health-score-badge.tsx` (new - reused on list + detail)
  - `features/accounts/components/account-detail.tsx` (extend), `accounts-table.tsx` (extend)
- **Technical Instructions**:
  1. `health-score-badge.tsx` renders the 0-100 score with a band (e.g. red `<40`, amber `40-69`,
     green `≥70`) and an explicit "BalloAds Health Score" label/tooltip. It is **read-only** - no
     edit affordance, no recompute - since the score is externally supplied
     ([../../glossary.md](../../glossary.md) Health Score, [../../database-schema.md](../../database-schema.md)
     security note).
  2. Show a graceful "awaiting BalloAds sync" state when `healthScore` is undefined; never fabricate
     a default beyond what BalloAds supplies.
  3. Do **not** add any write path to `healthScore` from the client (it is server-sync-only).
- **Acceptance Criteria**:
  - The health score renders on both the accounts list and the account detail, banded and labeled as
    BalloAds-sourced.
  - When no score is synced yet, the UI shows a clear placeholder, not a made-up number.
  - No client-side code path writes `healthScore`.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) (health-score enrichment) + [../../routes.md](../../routes.md)
        cross-checked
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: S
- **Estimated Hours**: 1-2
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (Health
  Score) and [../../glossary.md](../../glossary.md) (Health Score) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: seed an account with a
  `healthScore`, confirm the banded badge on list + detail; clear it and confirm the placeholder.

---

### AI-003: Opportunity qualification scoring AI job

- **Task ID**: `AI-003`
- **Epic**: AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Add the opportunity-qualification Brutus AI job (create job → call Brutus → write back
  `qualification.score`)
- **Objective**: Let a rep request AI qualification scoring of an opportunity: a Server Action
  enqueues an `aiJobs` doc (`type: "opportunity_qualification"`), a background step calls Brutus via
  `lib/brutus/`, and the completed job's score is written back to `opportunity.qualification.score`
  with `aiInsightJobId` set.
- **Business Value**: The headline "AI Commercial Intelligence" differentiator - structured,
  auditable AI scoring of a deal from its recorded fields/activity.
- **Dependencies**: `AI-001` (aiJobs state machine), `AI-002` (`lib/brutus/` client), `CRM-020`
  (opportunity), `CRM-022` (qualification fields) - **soft** on AI-001/002: stub `lib/brutus/` with
  a deterministic fake scorer behind the same interface until the real client lands, so the job
  lifecycle + write-back are demoable independently.
- **Target Files**:
  - `repositories/ai-jobs.ts` (new or shared with AI-001 - Admin SDK only)
  - `services/ai-jobs.ts` (new - `enqueueJob`, `transitionJob`, `completeJob`, `failJob`)
  - `services/opportunities.ts` (extend - apply score write-back)
  - `features/opportunities/actions/qualify-opportunity.ts` (new)
  - `app/api/ai-jobs/run/route.ts` (new - background trigger Route Handler, if the fire-and-forget
    step is done via a Route Handler per [../../integrations.md](../../integrations.md))
- **Technical Instructions**:
  1. `qualify-opportunity.ts` (`"use server"`) calls the service to write an `aiJobs` doc with
     `status: "queued"`, `type: "opportunity_qualification"`, `input: { opportunityId }`,
     `requestedBy`, and returns `{ ok: true, data: { jobId } }` immediately - the rep is not blocked
     (per [ADR-008](../../decisions.md#adr-008-ai-work-modeled-as-async-trackable-aijobs-documents)).
  2. A background step (same-action fire-and-forget or the Route Handler) transitions the job to
     `running`, calls Brutus via `lib/brutus/` with the opportunity + its activity context, and on
     success writes `status: "completed"` with `output: { score, rationale }`, `completedAt`; on
     failure writes `status: "failed"` with `error`. The write to `aiJobs` is **server-only** (Admin
     SDK - clients cannot write jobs, [../../firestore-rules.md](../../firestore-rules.md)).
  3. On completion the service writes `qualification.score` and `aiInsightJobId` back onto the
     opportunity.
  4. The UI (Developer 2's panel) polls/subscribes to the `aiJobs` doc keyed on `jobId`; this task
     provides a read action/hook for job status if not already provided by AI-001.
- **Acceptance Criteria**:
  - Requesting scoring creates a `queued` job and returns a `jobId` without blocking.
  - The job transitions to `completed` with a score and rationale (or `failed` with an error - never
    silently dropped).
  - On completion, the opportunity's `qualification.score` and `aiInsightJobId` are updated.
  - No client-writable path to `aiJobs` exists.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) (AI Job pattern) +
        [../../database-schema.md](../../database-schema.md) (`aiJobs`, `opportunities`) +
        [../../api.md](../../api.md) updated; background-invocation mechanism recorded in
        [../../decisions.md](../../decisions.md) if newly chosen
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 6-9
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (Brutus AI,
  async AI Job pattern),
  [../../decisions.md](../../decisions.md#adr-008-ai-work-modeled-as-async-trackable-aijobs-documents),
  and [../../database-schema.md](../../database-schema.md) (`aiJobs`) before starting; update those +
  [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: with the stub scorer,
  request scoring, watch the job move queued→running→completed in the Firestore console, confirm the
  score writes back; force the stub to throw and confirm the `failed` state + error.

---

### AI-004: Next-best-action recommendation job + surface on Account/Opportunity (data/service side)

- **Task ID**: `AI-004`
- **Epic**: AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Add the next-best-action Brutus AI job (data/service side)
- **Objective**: Add an `aiJobs` job (`type: "next_best_action"`) that, given an Account or
  Opportunity, calls Brutus for a recommended next step and stores the result on the job for the UI
  panel (Developer 2's AI-010) to render.
- **Business Value**: "Tell the rep what to do next" is a concrete, demo-friendly AI moment; this
  task supplies the data the panel consumes.
- **Dependencies**: `AI-001`, `AI-002` (soft - stub as in AI-003), `CRM-005`/`CRM-020`; the **UI
  panel is Developer 2's AI-010** (not owned here).
- **Target Files**:
  - `services/ai-jobs.ts` (extend - `enqueueNextBestAction(orgId, requestedBy, relatedTo)`)
  - `features/ai/actions/request-next-best-action.ts` (new)
  - background run step (shared with AI-003's Route Handler / fire-and-forget)
- **Technical Instructions**:
  1. Reuse the AI-003 job lifecycle: enqueue `type: "next_best_action"` with `input: { relatedTo }`,
     run against Brutus, complete with `output: { nextBestAction, rationale }`.
  2. Provide a read action/hook (`getAiJob(jobId)`) so AI-010's panel can poll/subscribe; do **not**
     build the panel here.
  3. Recommendations are advisory only - no automated side effects (no auto-sending, no auto-stage
     change) from this job.
- **Acceptance Criteria**:
  - Requesting next-best-action for an account or opportunity creates a job that completes with a
    `nextBestAction` + rationale (or fails cleanly).
  - The result is readable by `jobId` for the downstream panel; this task ships no UI panel.
  - The job produces no automated side effects.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) + [../../database-schema.md](../../database-schema.md)
        (`aiJobs`) + [../../api.md](../../api.md) updated; handoff to AI-010 noted
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (Brutus AI)
  and [../../database-schema.md](../../database-schema.md) (`aiJobs`) before starting; update
  [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: enqueue for an
  account + an opportunity with the stub, confirm both complete and are readable by `jobId`.

---

### AI-005: Account/Contact AI summarization job

- **Task ID**: `AI-005`
- **Epic**: AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Add the account/contact summarization Brutus AI job (data/service side)
- **Objective**: Add an `aiJobs` job (`type: "account_summary"` / `"contact_summary"`) that condenses
  an entity's activity/communication history (from `activities`) into a short brief via Brutus,
  stored on the job for the UI panel (Developer 2).
- **Business Value**: A "prep me for this call" brief is an immediately useful AI feature; the
  summary reads the same `activities` timeline the CRM already maintains.
- **Dependencies**: `AI-001`, `AI-002` (soft - stub), `CRM-008` (activities as the summarization
  input), `CRM-009`/`CRM-013` (timelines); UI panel is Developer 2's.
- **Target Files**:
  - `services/ai-jobs.ts` (extend - `enqueueSummary(orgId, requestedBy, relatedTo)`)
  - `features/ai/actions/request-summary.ts` (new)
- **Technical Instructions**:
  1. Gather the entity's timeline via `getTimeline` (CRM-008), pass it to Brutus, complete the job
     with `output: { summary }`.
  2. Reuse the shared job lifecycle + background run step. Read path by `jobId` for the panel.
  3. Summaries are derived/ephemeral AI output - do not overwrite any source record with them.
- **Acceptance Criteria**:
  - Requesting a summary for an account or contact completes with a `summary` (or fails cleanly).
  - The summarization input is the entity's `activities` timeline, org-scoped.
  - No source record is mutated by the summary.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) + [../../database-schema.md](../../database-schema.md)
        (`aiJobs`) + [../../api.md](../../api.md) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (Brutus AI,
  summarization) and [../../database-schema.md](../../database-schema.md) (`activities`, `aiJobs`)
  before starting; update [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: seed several
  activities, request a summary with the stub, confirm completion and correct scoping.

---

### AI-006: Cross-sell / upsell signal detection job (driven by health score, contracts, activities)

- **Task ID**: `AI-006`
- **Epic**: AI Commercial Intelligence
- **Priority**: P3
- **Owner**: Developer 3
- **Title**: Add the cross-sell / upsell signal-detection Brutus AI job
- **Objective**: Add an `aiJobs` job (`type: "cross_sell_signal"`) that flags accounts as cross-sell/
  upsell candidates from health score, contract status/renewal proximity, and activity signals,
  storing detected signals on the job (optionally logging an `ai_insight_generated` activity).
- **Business Value**: Turns existing CRM signals into revenue-expansion prompts - a compelling
  "commercial intelligence" story, even if lower priority.
- **Dependencies**: `AI-001`, `AI-002` (soft - stub), `CRM-030` (contracts), `CRM-050`
  (health score), `CRM-008` (activities).
- **Target Files**:
  - `services/ai-jobs.ts` (extend - `enqueueCrossSellScan(orgId, requestedBy, accountId?)`)
  - `features/ai/actions/request-cross-sell-scan.ts` (new)
- **Technical Instructions**:
  1. Assemble the account's health score, contracts (via `listContractsByAccount`), and recent
     activities; pass to Brutus; complete with `output: { signals: [{ type, rationale, confidence }]
}`.
  2. Optionally log an `ai_insight_generated` activity (CRM-008) with `payload: { jobId }` so the
     signal appears on the account timeline.
  3. Can run per-account (on demand) or org-wide (batch); keep it a server-side job either way.
- **Acceptance Criteria**:
  - Running a scan for an account completes with zero or more signals (or fails cleanly).
  - The scan reads health score + contracts + activities as inputs, org-scoped.
  - When a signal is found, an `ai_insight_generated` activity appears on the account timeline.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) + [../../database-schema.md](../../database-schema.md)
        (`aiJobs`, `activities`) + [../../api.md](../../api.md) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-8
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (Brutus AI,
  cross-sell/upsell), [../../glossary.md](../../glossary.md) (Cross-sell / Upsell), and
  [../../database-schema.md](../../database-schema.md) before starting; update [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: seed an account with a
  soon-renewing contract and a high health score, run the stub scan, confirm a signal + timeline
  activity.

---

### CRM-023: Pipeline velocity rollups (stage duration, win rate) - domain computation

- **Task ID**: `CRM-023`
- **Epic**: Opportunities / Analytics
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Compute pipeline velocity (avg days-in-stage, win rate) from opportunities + activities
- **Objective**: Add the domain computation that derives pipeline velocity metrics - average time in
  each stage (from `stage_changed` activities) and win rate (`closed_won` vs `closed_lost`) - as a
  pure service consumed by the analytics aggregation (ANLY-001) and the opportunity-stalling
  notification (CRM-042).
- **Business Value**: Velocity + win rate are the core commercial-analytics numbers; computing them
  once here keeps the dashboard (ANLY-002, Developer 2) and stall-detection consistent.
- **Dependencies**: `CRM-020` (opportunities), `CRM-008` (`stage_changed` activities); consumed by
  `ANLY-001` and `CRM-042`.
- **Target Files**:
  - `services/pipeline-analytics.ts` (new - `computePipelineVelocity(orgId)`,
    `computeWinRate(orgId)`, `detectStalledOpportunities(orgId, thresholdDays)`)
- **Technical Instructions**:
  1. `computePipelineVelocity` reconstructs per-opportunity stage durations from the ordered
     `stage_changed` activities (CRM-008) and returns `avgDaysInStage` per stage - the exact shape
     `analyticsCache` stores (`{ avgDaysInStage: { prospecting, proposal, negotiation, ... } }`, see
     [../../database-schema.md](../../database-schema.md) `analyticsCache`).
  2. `computeWinRate` counts `closed_won` / (`closed_won` + `closed_lost`) over a period.
  3. `detectStalledOpportunities` flags open opportunities with no stage change for
     `thresholdDays`; CRM-042 turns each into an `opportunity_stalling` notification.
  4. Pure computation - reads via repositories, writes nothing itself (ANLY-001 owns the
     `analyticsCache` write).
- **Acceptance Criteria**:
  - `computePipelineVelocity` returns per-stage average durations derived from real stage-change
    history.
  - `computeWinRate` returns a correct ratio for a seeded set of closed deals.
  - `detectStalledOpportunities` returns opportunities exceeding the stall threshold.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`analyticsCache` shape) cross-checked
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`analyticsCache`, `activities`), [../../indexes.md](../../indexes.md), and
  [../../glossary.md](../../glossary.md) (Commercial Analytics) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: seed opportunities
  with a scripted stage-change history, compute velocity/win-rate, and hand-check the numbers.

---

### COMM-003: Trigger onboarding/renewal sequence from an Opportunity/Journey stage change → BalloAds, logged as an Activity

- **Task ID**: `COMM-003`
- **Epic**: Automated Customer Communications
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Trigger a BalloAds journey on a stage/lifecycle change and log a
  `balloads_campaign_triggered` activity
- **Objective**: When an Opportunity reaches a configured stage (e.g. `closed_won`) or an Account's
  `lifecycleStage` changes (e.g. → `onboarding`/`renewal`), call the BalloAds developer-portal API
  via `lib/balloads/` to enrol the account/contact in a BalloAds journey, and log the call as an
  activity - BalloCRM requests, it does not run, the journey.
- **Business Value**: The strongest live demo moment - "a CRM stage change fires a real BalloAds
  message" - while respecting the non-negotiable "never reimplement messaging" boundary.
- **Dependencies**: `COMM-001` (`lib/balloads/` client), `COMM-002` (per-org credential storage),
  `CRM-020` (stage change) / `CRM-041` (lifecycle change), `CRM-008` (activity) - **soft** on
  COMM-001/002: stub the BalloAds client behind its interface (log the intended call) until the real
  client + credential storage land.
- **Target Files**:
  - `services/communications.ts` (new - `triggerBalloAdsJourney(orgId, actorId, relatedTo,
balloAdsJourneyRef)`)
  - `services/opportunities.ts` / `services/accounts.ts` (extend - call the trigger on the
    configured transition)
- **Technical Instructions**:
  1. `triggerBalloAdsJourney` composes the `lib/balloads/` client (server-side only, per-org API key
     read via the Admin SDK from `integrations/balloAds` - never the browser,
     [ADR-007](../../decisions.md#adr-007-balloads-integration-exclusively-via-v1developer-portal-rest-apis-server-side-only)),
     calls the developer-portal enrol/trigger endpoint (path TBC against the live spec per
     [../../integrations.md](../../integrations.md)), then logs an activity `type:
"balloads_campaign_triggered"`, payload `{ balloAdsJourneyRef }`.
  2. Wire the trigger into `moveOpportunityStage` (CRM-020) and `changeLifecycleStage` (CRM-041) for
     the configured transitions only (which transition → which journey is org-configurable via
     settings, CRM-044).
  3. **Guard the naming collision**: this is a _BalloAds Journey_ - every identifier is `balloAds`-
     prefixed (`balloAdsJourneyRef`, `triggerBalloAdsJourney`), never a bare `journey`
     ([../../integrations.md](../../integrations.md)).
  4. BalloCRM implements **no** send loop, template rendering, or opt-out ledger - it only requests
     and records ([../../integrations.md](../../integrations.md) integration boundaries).
- **Acceptance Criteria**:
  - A configured stage/lifecycle transition calls the BalloAds trigger (or the stub) and logs a
    `balloads_campaign_triggered` activity on the entity timeline.
  - The developer API key is read server-side only and never reaches the client.
  - No messaging send/render/opt-out logic is implemented in BalloCRM; no unqualified `journey`
    identifier appears in the diff.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) boundary checklist re-confirmed;
        [../../database-schema.md](../../database-schema.md) (`activities` type) +
        [../../api.md](../../api.md) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (BalloAds
  API, Journey naming, boundaries) and
  [../../decisions.md](../../decisions.md#adr-007-balloads-integration-exclusively-via-v1developer-portal-rest-apis-server-side-only)
  before starting; update [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: with the stubbed
  client, move an opportunity to the configured stage, confirm the (stubbed) call and the activity;
  confirm the API key never appears in any client bundle/log.

---

### COMM-004: Read delivery/opt-out status back into Contact/Account timeline

- **Task ID**: `COMM-004`
- **Epic**: Automated Customer Communications
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Read BalloAds delivery/opt-out status back into the timeline (no BalloCRM ledger)
- **Objective**: Read per-send delivery status and per-channel opt-out state from the BalloAds
  developer API (via `lib/balloads/`) and surface them on the Contact/Account timeline and the
  CRM-013 opt-out panel - always reading from BalloAds, never maintaining a BalloCRM copy.
- **Business Value**: Closes the communication loop ("we sent it → here's what happened") using
  BalloAds as the single source of truth, so BalloCRM never shows stale/contradictory delivery
  state.
- **Dependencies**: `COMM-001` (`lib/balloads/`), `COMM-003` (there must be sends to report on),
  `CRM-013` (opt-out panel), `CRM-009` (timeline) - **soft** on COMM-001: stub the read behind its
  interface until the client lands.
- **Target Files**:
  - `services/communications.ts` (extend - `getDeliveryStatus(orgId, relatedTo)`,
    `getOptOutStatus(orgId, contactId)`)
  - `features/contacts/components/optout-status-panel.tsx` (wire real data from CRM-013's stub)
  - `features/activities/components/timeline.tsx` (render delivery-status enrichment where present)
- **Technical Instructions**:
  1. `getDeliveryStatus` / `getOptOutStatus` call the BalloAds developer-portal read endpoints
     (paths TBC per [../../integrations.md](../../integrations.md)) server-side and return typed,
     Zod-parsed shapes - **read-only**, no persistence of a delivery/opt-out ledger in Firestore
     (integration boundaries).
  2. Surface delivery status inline on relevant timeline entries and hydrate CRM-013's opt-out
     panel; grey out "Send via BalloAds" affordances for opted-out channels.
  3. Where BalloAds doesn't expose a field, omit it rather than approximate.
- **Acceptance Criteria**:
  - The Contact opt-out panel and timeline show BalloAds-sourced delivery/opt-out status (or the
    stub), read on demand, not stored.
  - No delivery/opt-out ledger is written to Firestore by BalloCRM.
  - Opted-out channels disable their send affordance.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) boundary checklist re-confirmed;
        [../../routes.md](../../routes.md) (`/contacts/[id]`, `/accounts/[id]`) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (delivery
  status / opt-out read-back, boundaries) before starting; update [../../routes.md](../../routes.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: with the stubbed
  reads, confirm status renders on the timeline/panel and that no Firestore write occurs for
  delivery/opt-out data; confirm opted-out channels are disabled.
