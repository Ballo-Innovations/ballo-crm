# Phase 4 — ABM, Vertical Sales Indexing & analytics data

Phase 4 is Developer 3's data/domain contribution to the "advanced analytics & ABM" phase
([../../roadmap.md](../../roadmap.md#phase-4--advanced-analytics--abm)). It formalizes **Vertical
Sales Indexing** as a first-class segmentation dimension on the Account model, builds the
**Account-Based Marketing** campaign data model and its BalloAds trigger path, and stands up the
**analytics aggregation service** that computes and writes `analyticsCache` — the read-model that
Developer 2's dashboards (ANLY-002/ANLY-004) render. It also delivers CSV bulk import for Accounts.

Two architectural boundaries carry over from earlier phases:

- **ADR-002 layering.** Only `repositories/` import `firebase/firestore`; `services/` compose
  repositories and enforce referential integrity; `actions/` are thin Server Action entry points;
  types are `z.infer<...>` from `schemas/` ([../../decisions.md](../../decisions.md), [../../architecture.md](../../architecture.md)).
- **BalloAds only via `lib/balloads/`.** ABM campaign sends and performance reads go through the
  COMM-001 client server-side and are logged as activities — BalloCRM never reimplements messaging
  ([ADR-007](../../decisions.md), [../../integrations.md](../../integrations.md)).

`analyticsCache`, like `aiJobs` and `auditLogs`, is **server-write-only** in
[../../firestore-rules.md](../../firestore-rules.md) — ANLY-001 must write it via the Admin SDK from a
Server Action / Route Handler, never the client. Fields follow [../task-template.md](../task-template.md);
the project-wide Definition of Done referenced below lives in
[../../sprint-plan.md](../../sprint-plan.md#definition-of-done). See
[README.md](./README.md#id-reconciliation-note) for the CRM-060 ID reconciliation.

---

### VSI-001: Industry vertical taxonomy field on the Account schema

- **Task ID**: `VSI-001`
- **Epic**: Vertical Sales Indexing
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Add the industry `vertical` taxonomy field (`z.enum`) to the Account schema and repository
- **Objective**: Formalize the `vertical` field on `organizations/{orgId}/accounts/{accountId}` as a
  validated `z.enum` taxonomy (e.g. `logistics`, `manufacturing`, `retail`, `fintech`, `healthcare`,
  `telecom`, `other`) so every downstream segmentation, benchmark, and ABM-targeting feature has one
  canonical, queryable dimension to filter on.
- **Business Value**: A single schema field (High impact / Low effort in the
  [backlog priority matrix](../backlog.md#priority-matrix-impact-vs-effort)) unlocks all later
  vertical segmentation, benchmarking, and ABM targeting demos for near-zero cost.
- **Dependencies**: `CRM-001` (Account schema/repository). **Soft**: none — this extends an existing schema.
- **Target Files**:
  - `schemas/account-schema.ts` (add/confirm the `vertical` `z.enum`; export the enum for reuse)
  - `features/accounts/components/account-form.tsx` (a `Select`/combobox bound to the enum)
  - `firestore.indexes.json` — **flag to Developer 1 (INFRA-010)**: the `vertical ASC, healthScore DESC`
    composite index per [../../database-schema.md](../../database-schema.md)/[../../indexes.md](../../indexes.md)
    (do not edit rules/indexes yourself — raise it)
- **Technical Instructions**:
  1. Define the `vertical` enum once in `schemas/account-schema.ts`; infer the TS type — never
     hand-maintain a parallel string-union. Reuse the enum in VSI-002/VSI-003, ABM-002, and Developer
     2's VSI-004 filter bar rather than re-declaring values.
  2. Make it a required (or defaulted `other`) field on create/edit; back-fill existing docs as `other`.
  3. Confirm the `vertical ASC, healthScore DESC` index exists (raise INFRA-010 if not) before shipping
     any query that sorts by health within a vertical.
- **Acceptance Criteria**:
  - New/edited accounts persist a `vertical` value constrained to the enum; invalid values are rejected
    by the Zod schema server-side.
  - The account form offers the vertical as a labeled select; the value round-trips on edit.
  - The enum is exported and importable by segmentation/ABM/analytics code (single source of truth).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) reflects the enum values; index need raised
        to Developer 1 if missing
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: S
- **Estimated Hours**: 1-2
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md) (Account
  shape + vertical) and [../../glossary.md](../../glossary.md) before starting; update the schema doc
  if enum values change.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: create accounts across several
  verticals; attempt an invalid vertical via a crafted payload and confirm the schema rejects it.

---

### VSI-002: Vertical-based segmentation service and filtered views

- **Task ID**: `VSI-002`
- **Epic**: Vertical Sales Indexing
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Build the segmentation service that filters Accounts/Opportunities by vertical
- **Objective**: Provide a `services/`-level segmentation API and the query wiring so Accounts and
  Opportunities lists can be filtered by one or more verticals, using the `vertical ASC, healthScore
DESC` composite index for the ranked-by-health case.
- **Business Value**: Lets RevOps and leadership slice the book of business by industry — the core
  vertical-indexing narrative from [../../vision.md](../../vision.md) (Diego/Priya personas).
- **Dependencies**: `VSI-001` (the `vertical` field), `CRM-002`/`CRM-003` (accounts list),
  `CRM-020`/`CRM-021` (opportunities); Developer 2's `VSI-004` supplies the shared filter UI.
  **Soft**: build the service + query against the existing list pages first; wire the shared filter bar
  when VSI-004 lands.
- **Target Files**:
  - `services/segmentation.ts` (new — vertical filter composition over accounts/opportunities repos)
  - `repositories/accounts.ts`, `repositories/opportunities.ts` (add vertical-filtered query methods)
  - `features/accounts/` and `features/opportunities/` list components (accept a `vertical` filter param)
- **Technical Instructions**:
  1. Add repository query methods that filter by `vertical` (equality / `in` for multi-select) and,
     for accounts, order by `healthScore DESC` using the composite index. Keep Firestore access in the
     repository only.
  2. `services/segmentation.ts` composes those methods and returns typed results; the list pages read
     the current filter from URL params (set by VSI-004) and pass it through the Server Action.
  3. Respect org scoping and role reads from the session (INFRA-003) — never query across orgs.
- **Acceptance Criteria**:
  - Selecting one or more verticals filters the accounts and opportunities lists to matching records.
  - The accounts vertical view is orderable by health score (uses the composite index, no client sort
    of a full scan).
  - Filter state is driven by URL params so a filtered view is shareable and survives reload.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../indexes.md](../../indexes.md) cross-checked (index used, not a full-collection scan)
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../indexes.md](../../indexes.md) and
  [../../database-schema.md](../../database-schema.md) before starting; update indexes doc if a new
  query shape needs an index (raise it to Developer 1 / INFRA-010).
- **Testing Notes**: No test framework until `INFRA-012`. Manual: filter by single and multiple
  verticals on both lists; confirm health-ordered accounts view returns index-backed results; confirm
  URL params reflect and restore the filter.

---

### VSI-003: Vertical benchmarking analytics data

- **Task ID**: `VSI-003`
- **Epic**: Vertical Sales Indexing
- **Priority**: P3
- **Owner**: Developer 3
- **Title**: Compute per-vertical pipeline/health benchmarks and expose them for the analytics layer
- **Objective**: Produce comparative per-vertical metrics (avg health score, open pipeline value, win
  rate, deal count) as part of the analytics aggregation so leadership can benchmark and forecast per
  industry rather than only in aggregate; the results are written into `analyticsCache` via ANLY-001.
- **Business Value**: Turns vertical indexing from a filter into insight — "which verticals are
  healthy vs. at risk" — a strong analytics story for the VP-of-Sales persona.
- **Dependencies**: `VSI-001`/`VSI-002` (vertical dimension + segmentation), `ANLY-001` (the
  aggregation service + `analyticsCache` writer this plugs into), `CRM-023` (velocity/win-rate
  computation to reuse). Developer 2's `ANLY-004` renders these. **Soft**: can compute standalone and
  fold into ANLY-001's cache write once it lands.
- **Target Files**:
  - `services/analytics/vertical-benchmarks.ts` (new — per-vertical rollup functions)
  - `services/analytics/aggregate.ts` (extend — include vertical breakdown in the cache payload; shared
    with ANLY-001)
- **Technical Instructions**:
  1. Group opportunities/accounts by `vertical` and compute avg `healthScore`, total open `amount`,
     win rate, and count per vertical. Reuse CRM-023's velocity/win-rate helpers rather than
     recomputing.
  2. Emit a `verticalBreakdown` block into the ANLY-001 `analyticsCache` document shape (see
     [../../database-schema.md](../../database-schema.md) `analyticsCache`); do not create a new
     collection.
  3. All writes go through ANLY-001's server-only cache writer (Admin SDK) — `analyticsCache` is
     `allow write: if false` for clients.
- **Acceptance Criteria**:
  - The aggregation output contains a per-vertical breakdown (health, open value, win rate, count).
  - Numbers reconcile with the underlying accounts/opportunities for a hand-checked vertical.
  - The breakdown is persisted in `analyticsCache` via the server-only writer, not from the client.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) `analyticsCache` shape updated with the
        `verticalBreakdown` block
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`analyticsCache`) and [../../architecture.md](../../architecture.md) before starting; update the
  schema doc for the new cache block.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: seed accounts/opps across ≥2
  verticals, run the aggregation, and hand-verify one vertical's numbers against the raw docs.

---

### ABM-001: Campaign schema and repository

- **Task ID**: `ABM-001`
- **Epic**: Campaigns / ABM
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Define the `Campaign` Zod schema and Firestore repository (`organizations/{orgId}/campaigns`)
- **Objective**: Create the ABM campaign data model — `campaignId`, `name`, `status`, `targetVertical`,
  `targetAccountIds[]`, `balloAdsJourneyRef`, `startDate`/`endDate`, `ownerId`, timestamps — and its
  repository, matching [../../database-schema.md](../../database-schema.md) exactly.
- **Business Value**: The foundation of Account-Based Marketing in BalloCRM; without the campaign
  record there is nothing to target accounts with or trigger a BalloAds journey from.
- **Dependencies**: `CRM-001` (repository pattern reference), `INFRA-010` (rules for `campaigns` —
  write requires `owner`/`admin`/`manager`). **Soft**: can build schema + repository against local
  rules-agnostic reads first.
- **Target Files**:
  - `schemas/campaign-schema.ts` (new — Zod shape; `status` and `targetVertical` reuse existing enums)
  - `repositories/campaigns.ts` (new — CRUD under `organizations/{orgId}/campaigns`)
  - `features/campaigns/` (folder scaffold)
- **Technical Instructions**:
  1. Model every field per [../../database-schema.md](../../database-schema.md); `targetVertical` reuses
     the VSI-001 enum; `balloAdsJourneyRef` is an opaque external string, **not** a Firestore reference.
  2. Repository is the only layer importing `firebase/firestore`; expose typed `create`/`get`/`list`/
     `update` scoped to the org. Support the `status ASC, startDate DESC` list query (raise the index to
     INFRA-010 if absent).
  3. Referential integrity for `targetAccountIds` is enforced in the ABM-002 service, not the repository.
- **Acceptance Criteria**:
  - A campaign can be created/read/updated/listed through the repository, org-scoped, matching the schema.
  - The active/upcoming list query orders by `status`, then `startDate DESC` using the index.
  - `balloAdsJourneyRef` and `targetAccountIds` persist as plain strings/array — no `DocumentReference`.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) reconciled; index need raised to Developer 1
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 2-4
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`campaigns`) and [../../decisions.md](../../decisions.md) (ADR-002) before starting; update the
  schema doc on any drift.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: create/list campaigns via a
  throwaway Server Action; confirm org scoping and the ordered list query.

---

### ABM-002: Target account list builder

- **Task ID**: `ABM-002`
- **Epic**: Campaigns / ABM
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Build the target-account list builder (filter accounts by vertical/segment, persist `targetAccountIds`)
- **Objective**: Let a manager assemble a campaign's target audience by filtering accounts (by
  vertical, tier, health band, owner) via the VSI-002 segmentation service and persisting the resulting
  account IDs onto the campaign's `targetAccountIds[]`.
- **Business Value**: This is where ABM becomes actionable — choosing _which_ accounts a coordinated
  outreach targets, the step between "we have a campaign" and "we can trigger it."
- **Dependencies**: `ABM-001` (campaign record), `VSI-002` (segmentation service), Developer 2's
  `VSI-004` (filter UI) and `SHELL-013` (selectable data table). **Soft**: build the service + a plain
  multi-select list first; adopt the shared filter/table UI when they land.
- **Target Files**:
  - `services/campaigns.ts` (new — validate `targetAccountIds` exist, dedupe, attach to campaign)
  - `actions/campaigns.ts` (Server Action: `setCampaignTargets`)
  - `features/campaigns/components/target-builder.tsx` (filter + select + save)
- **Technical Instructions**:
  1. Reuse VSI-002 to fetch the filtered candidate accounts; the builder selects a subset and calls the
     Server Action to persist `targetAccountIds`.
  2. `services/campaigns.ts` performs referential-integrity checks (each account exists, is in the org)
     before writing — per the "no FK enforcement in Firestore" note in
     [../../database-schema.md](../../database-schema.md).
  3. Log a `note_added`/campaign-updated activity so the targeting change is auditable (CRM-008 service).
- **Acceptance Criteria**:
  - A user can filter candidate accounts and add/remove them from a campaign's target list.
  - Saved `targetAccountIds` contain only existing, in-org account IDs (invalid IDs rejected server-side).
  - Re-opening the campaign shows the persisted target list; changes are logged as an activity.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) integrity rules honored
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md) and
  [../../architecture.md](../../architecture.md) before starting; update routes doc if a builder route is added.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: filter + select accounts, save,
  reload; attempt to save a non-existent account ID and confirm rejection; confirm the activity log entry.

---

### ABM-003: Trigger a BalloAds journey/campaign from a CRM campaign

- **Task ID**: `ABM-003`
- **Epic**: Campaigns / ABM
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Trigger a BalloAds journey/campaign for a CRM campaign's targets and log it as an activity
- **Objective**: From a CRM campaign, call the BalloAds developer-portal API (via the COMM-001 client)
  to launch the referenced journey (`balloAdsJourneyRef`) against the resolved contacts of
  `targetAccountIds`, and record the send as a `balloads_campaign_triggered` activity — BalloCRM never
  sends messages itself.
- **Business Value**: The headline ABM demo moment — "a CRM campaign fires a real BalloAds outreach" —
  proving the native-integration value proposition from [../../vision.md](../../vision.md).
- **Dependencies**: `ABM-001`/`ABM-002` (campaign + targets), `COMM-001` (BalloAds client, Dev 1),
  `COMM-002` (credential storage, Dev 1), `CRM-008` (activity logging). **Soft**: until COMM-001 lands,
  develop against a typed mock of the client matching [../../integrations.md](../../integrations.md).
- **Target Files**:
  - `services/campaigns.ts` (extend — resolve targets → contacts, invoke client, log activity)
  - `actions/campaigns.ts` (Server Action: `triggerCampaign`)
  - `features/campaigns/components/campaign-detail.tsx` (trigger button + result state)
- **Technical Instructions**:
  1. Resolve `targetAccountIds` → contacts (respecting `optedOutChannels`), then call the COMM-001
     client server-side with `balloAdsJourneyRef` and the recipient set. All BalloAds access is
     server-only via `lib/balloads/` per [ADR-007](../../decisions.md).
  2. On success, write a `balloads_campaign_triggered` activity (`relatedTo: { type: "campaign", id }`)
     via CRM-008; on failure, surface the error and do not write a success activity.
  3. Never store a parallel message ledger in BalloCRM — the activity is the record; delivery status is
     read back separately (COMM-004 / ABM-004).
- **Acceptance Criteria**:
  - Triggering a campaign calls the BalloAds client with the journey ref and resolved recipients,
    skipping opted-out channels.
  - A successful trigger writes exactly one `balloads_campaign_triggered` activity on the campaign.
  - A failed trigger surfaces the error and writes no success activity.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) trigger contract honored
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) and
  [../../decisions.md](../../decisions.md) (ADR-007) before starting; update integrations doc if the
  trigger payload shape is confirmed.
- **Testing Notes**: No test framework until `INFRA-012`. Manual (against a mock client until COMM-001):
  trigger a campaign, confirm the client is called with the right journey ref + recipients, opted-out
  contacts are excluded, and the activity is written; simulate a failure and confirm no success activity.

---

### ABM-004: ABM campaign performance data

- **Task ID**: `ABM-004`
- **Epic**: Campaigns / ABM
- **Priority**: P3
- **Owner**: Developer 3
- **Title**: Read campaign performance (opens/clicks/delivery) back from BalloAds for a campaign
- **Objective**: Fetch the performance metrics for a triggered campaign from the BalloAds developer-
  portal API (via COMM-001) and expose them to the campaign detail view — read-only, sourced from
  BalloAds, never computed or stored as an authoritative BalloCRM metric.
- **Business Value**: Closes the ABM loop (trigger → outcome) so a manager can see whether an outreach
  worked, completing the "coordinated outreach through BalloAds" capability.
- **Dependencies**: `ABM-003` (a triggered campaign to measure), `COMM-001` (client). Developer 2 may
  render richer charts; a basic read-back surface is in scope here. **Soft**: mock the metrics response
  until COMM-001 lands.
- **Target Files**:
  - `services/campaigns.ts` (extend — fetch + normalize BalloAds performance)
  - `actions/campaigns.ts` (Server Action / cached read: `getCampaignPerformance`)
  - `features/campaigns/components/campaign-performance.tsx`
- **Technical Instructions**:
  1. Call the COMM-001 client for the campaign's `balloAdsJourneyRef`/send reference; normalize to a
     typed shape (delivered, opens, clicks, opt-outs). Treat the numbers as external/read-only.
  2. Do **not** persist them as an authoritative BalloCRM metric; if caching is needed for the view,
     cache with a short TTL and label the source + fetch time, per
     [../../integrations.md](../../integrations.md).
  3. Handle the "not yet available"/error states gracefully (recent send with no data yet).
- **Acceptance Criteria**:
  - The campaign detail shows delivery/opens/clicks/opt-outs read from BalloAds, labeled as BalloAds-
    sourced with a fetch timestamp.
  - No BalloCRM code path treats these numbers as its own source of truth or double-counts them.
  - Missing/errored performance data renders a clear state, not a fabricated zero.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) read-back contract honored
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) before
  starting; update it if the performance response shape is confirmed.
- **Testing Notes**: No test framework until `INFRA-012`. Manual (mock until COMM-001): render metrics
  for a campaign; simulate the no-data-yet and error responses and confirm graceful states.

---

### ANLY-001: Analytics aggregation service (writes `analyticsCache`)

- **Task ID**: `ANLY-001`
- **Epic**: Analytics
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Build the analytics aggregation service that computes and writes `analyticsCache`
- **Objective**: Stand up the service that computes org-level commercial aggregates — pipeline velocity
  (avg days in stage), forecast/total open value, win rate, account-health distribution, and the
  VSI-003 vertical breakdown — and writes them into `organizations/{orgId}/analyticsCache/{cacheKey}`
  with `computedAt`/`expiresAt`, so dashboards read a cheap precomputed model instead of recomputing on
  every load.
- **Business Value**: The data engine behind every dashboard (Developer 2's ANLY-002/ANLY-004) and the
  forecasting story for the VP-of-Sales persona; without it the analytics screens have nothing real to
  show.
- **Dependencies**: `CRM-020`/`CRM-021` (opportunities + stages), `CRM-023` (velocity/win-rate helpers),
  `CRM-030` (contracts for renewal/forecast), `VSI-003` (vertical breakdown), `INFRA-010` (rules:
  `analyticsCache` is `write: if false` for clients — server-only). Developer 2's ANLY-002/004 consume
  the output. **Soft**: compute from whatever entities exist and expand as more land.
- **Target Files**:
  - `services/analytics/aggregate.ts` (new — the aggregation computations)
  - `repositories/analytics-cache.ts` (new — Admin-SDK write/read of `analyticsCache`)
  - `actions/analytics.ts` or `app/api/analytics/recompute/route.ts` (server-only trigger to recompute)
- **Technical Instructions**:
  1. Compute the aggregates from `opportunities`, `accounts`, `contracts`, and `activities`; reuse
     CRM-023 and VSI-003 helpers rather than duplicating stage/win-rate math.
  2. Write results to `analyticsCache` **only via the Admin SDK** from a Server Action / Route Handler
     — the collection is `allow write: if false` for clients ([../../firestore-rules.md](../../firestore-rules.md)).
     Set `cacheKey`, `computedAt`, `expiresAt`, and a typed `data` payload per
     [../../database-schema.md](../../database-schema.md).
  3. Make recompute idempotent and safe to run on demand (and later on a schedule); reads check
     `expiresAt` and fall back to recompute when stale.
  4. Keep the cache document shape typed by a Zod schema shared with Developer 2's dashboard reads.
- **Acceptance Criteria**:
  - Running the aggregation writes an `analyticsCache` document with pipeline velocity, total open
    value, win rate, health distribution, and the vertical breakdown, plus `computedAt`/`expiresAt`.
  - The document is written via the Admin SDK; a client-side write attempt is rejected by rules.
  - Aggregates reconcile with the underlying collections for a hand-checked metric.
  - Recompute is idempotent (running twice yields the same result for unchanged data).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) `analyticsCache` shape reconciled;
        [../../firestore-rules.md](../../firestore-rules.md) server-only write confirmed with Developer 1
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-8
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`analyticsCache`), [../../architecture.md](../../architecture.md), and
  [../../firestore-rules.md](../../firestore-rules.md) before starting; update the schema doc for the
  final cache payload shape.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: seed a known set of opps/accounts/
  contracts, run recompute, and hand-verify at least velocity + total open value + one health bucket;
  attempt a client write to `analyticsCache` and confirm it is denied.

---

### CRM-060: Account bulk import (CSV)

- **Task ID**: `CRM-060` (reconciles to [../backlog.md](../backlog.md) **CRM-007**, "Account bulk
  import (CSV)" — re-minted to avoid colliding with the Phase-1 CRM numbering; see
  [README.md](./README.md#id-reconciliation-note))
- **Epic**: Accounts
- **Priority**: P3
- **Owner**: Developer 3
- **Title**: Import accounts in bulk from a CSV file with validation and an error report
- **Objective**: Let an admin/manager upload a CSV of accounts, validate each row against the Account
  Zod schema, create the valid rows through the existing accounts service, and return a per-row result
  report (created / skipped-duplicate / rejected-with-reason) — no partial silent failures.
- **Business Value**: Removes the biggest onboarding friction for a new org (getting the existing book
  of accounts into BalloCRM) and makes a demo with realistic data volume fast to set up.
- **Dependencies**: `CRM-001` (schema), `CRM-002` (create service with duplicate check), `VSI-001`
  (vertical enum for validation). Developer 2's `SHELL-010`/`SHELL-011` provide the upload/result UI.
  **Soft**: build the parse+validate+create service first with a plain file input.
- **Target Files**:
  - `services/account-import.ts` (new — parse, per-row validate, dedupe, create, collect results)
  - `actions/accounts.ts` (extend — `importAccounts` Server Action taking parsed rows)
  - `features/accounts/components/import-dialog.tsx` (upload + mapping + result report)
- **Technical Instructions**:
  1. Parse CSV to rows, map columns to Account fields, and validate each row with the Account Zod
     schema (including the `vertical` enum). Never bypass the schema for bulk writes.
  2. Reuse the CRM-002 create service so the duplicate-name check and referential integrity apply per
     row; collect a typed result per row rather than aborting the whole import on the first bad row.
  3. Cap batch size sensibly and use batched writes; return a summary (n created, n skipped, n rejected)
     plus a downloadable/inspectable error list keyed by row number.
- **Acceptance Criteria**:
  - A valid CSV creates the corresponding accounts; each created account passes the same validation as
    a single create.
  - Invalid rows are rejected with a per-row reason and do not block the valid rows from importing.
  - Duplicate accounts are skipped (not duplicated) per the CRM-002 duplicate rule, and reported as skipped.
  - The user sees a created/skipped/rejected summary after import.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) / [../../routes.md](../../routes.md)
        cross-checked (any import route documented)
  - [ ] Project-wide DoD met — see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] PR opened and reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md)
  - [ ] [../../progress.md](../../progress.md) and [../../changelog.md](../../changelog.md) updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md) (Account
  shape) and [../../coding-standards.md](../../coding-standards.md) before starting; update routes doc
  if an import route is added.
- **Testing Notes**: No test framework until `INFRA-012`. Manual: import a CSV mixing valid, invalid,
  and duplicate rows; confirm valid rows are created, invalid rows rejected with reasons, duplicates
  skipped, and the summary is accurate.
