# Sprint 2 — Core CRM Domain Expansion & First AI/BalloAds Integration

**Sprint goal:** expand Sprint 1's single proven entity (Accounts) into the full core CRM domain
— Contacts, Opportunities (with a pipeline/Kanban view), and Contracts — and stand up the first
real integrations with BalloAds and Brutus AI, per [roadmap.md](../roadmap.md) Phase 2. This
sprint also starts closing the testing gap flagged in [risks.md](../risks.md) R1, since building
three more CRUD entities and two external integrations without any regression safety net is the
point at which that debt becomes expensive to keep deferring.

**Team and numbering:** tasks continue the per-developer tracks and numbering from
[sprint-1.md](./sprint-1.md) — `INFRA-*` (Developer 1) continues at `INFRA-005`, `SHELL-*`
(Developer 2) continues at `SHELL-005`, `CRM-*` (Developer 3) continues at `CRM-005`. Two new
areas are introduced per [task-template.md](./task-template.md)'s AREA list: `AI-*` (Brutus AI /
commercial intelligence) and `COMM-*` (automated communications via BalloAds) — both owned by the
developers already carrying the corresponding risk-register items ([risks.md](../risks.md) R2,
R5, R6): Developer 1 builds the low-level external API clients in `lib/`, the same role they
played building `lib/firebase/`; Developer 3 (Core CRM Domain owner) builds the feature-level
services/actions that consume them, consistent with owning `services/accounts-service.ts` and
`services/opportunities-service.ts` in this same sprint.

Field structure for every task below follows [task-template.md](./task-template.md); the same
project-wide Definition of Done from [sprint-1.md](./sprint-1.md) applies throughout.

---

### CRM-005: Contacts data layer (schema, repository, service, actions)

- **Task ID**: `CRM-005`
- **Epic**: Contacts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Implement Contacts schema, repository, service, and Server Actions
- **Objective**: Extend the Accounts pattern from Sprint 1 to a second entity — a Contact belongs
  to exactly one Account and carries its own lifecycle/communication-relevant fields (email,
  phone, role/title, opt-out-relevant channel preferences read back from BalloAds in `COMM-002`).
- **Business Value**: Contacts are the second-most-referenced entity in the product mission
  (CIMS) and the target of most BalloAds delivery/opt-out reads — nothing in `COMM-002` or later
  Opportunity work can reference a contact without this landing first.
- **Dependencies**: `CRM-001` (Account shape, for the `accountId` foreign key).
- **Target Files**:
  - `features/contacts/schemas/contact-schema.ts`
  - `features/contacts/types.ts`
  - `repositories/contacts-repository.ts`
  - `services/contacts-service.ts`
  - `features/contacts/actions/create-contact.ts`
  - `features/contacts/actions/list-contacts.ts`
- **Technical Instructions**: Mirror `CRM-001`/`CRM-002`'s layering exactly. `contactSchema`
  fields: `id`, `orgId`, `accountId` (required — a Contact always belongs to an Account),
  `firstName`, `lastName`, `email`, `phone` (optional), `title` (optional), `createdBy`,
  `createdAt`, `updatedAt`. `contacts-repository.ts` adds `listContactsByAccount(orgId,
accountId)` alongside the standard `create`/`getById`/`list`. The service layer validates the
  referenced `accountId` actually exists in the caller's org before creating a Contact (a
  business rule, so it belongs in `services/contacts-service.ts`, not the repository).
- **Acceptance Criteria**:
  - A Contact cannot be created against an `accountId` that doesn't exist in the caller's org
    (returns `{ ok: false, error }`).
  - `listContactsByAccount` returns only that account's contacts, org-scoped.
  - All functions are typed from `contactSchema`, no `any`.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) updated with the
        `contacts` collection shape; project-wide DoD met; `docs/progress.md`/`changelog.md`
        updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: [../database-schema.md](../database-schema.md),
  [sprint-1.md](./sprint-1.md) `CRM-001`/`CRM-002` as the reference pattern.
- **Testing Notes**: If `INFRA-005` (test framework) has landed by the time this starts, add unit
  tests for `contacts-service.ts`'s account-existence check against the Firestore emulator;
  otherwise, manual verification per the `CRM-001`/`CRM-002` pattern.

### CRM-006: Contacts list and create UI

- **Task ID**: `CRM-006`
- **Epic**: Contacts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Build the Contacts list page and create-contact form
- **Objective**: Give Contacts a UI surface at `/contacts`, and a way to add a contact inline
  from an Account's detail view (nested creation, not just a standalone list).
- **Business Value**: Completes the second full vertical slice of the CRM, validating that
  Sprint 1's pattern (and `SHELL-004`'s shared table) generalizes past a single entity.
- **Dependencies**: `CRM-005`; reuses `SHELL-004`'s `data-table.tsx` and `CRM-004`'s form
  conventions directly (both already shipped in Sprint 1, so no soft-dependency workaround is
  needed this time).
- **Target Files**:
  - `app/(dashboard)/contacts/page.tsx`
  - `features/contacts/components/contacts-table.tsx`
  - `features/contacts/components/create-contact-dialog.tsx`
  - `features/contacts/components/create-contact-form.tsx`
  - `features/contacts/hooks/use-contacts.ts`
- **Technical Instructions**: Reuse `components/shared/data-table.tsx` and the dialog/form pattern
  from `CRM-004` verbatim — this task should be materially faster than `CRM-004` because the
  primitives already exist. Add an `accountId` filter/column showing the linked Account's name
  (a small denormalized `accountName` field written at Contact-create time, or a join read via
  `getAccountById` — prefer the denormalized field to avoid N+1 reads per
  [risks.md](../risks.md) R9).
- **Acceptance Criteria**: `/contacts` lists all org contacts with their linked account name
  visible; creating a contact from the dialog updates the list without a manual refresh; creating
  a contact against a non-existent account is rejected with a visible inline error.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../routes.md](../routes.md) updated; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: [sprint-1.md](./sprint-1.md) `CRM-003`/`CRM-004`.
- **Testing Notes**: Manual verification per the `CRM-003`/`CRM-004` pattern; add component tests
  if `INFRA-005` has landed.

### CRM-007: Opportunities data layer with qualification fields

- **Task ID**: `CRM-007`
- **Epic**: Opportunities
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Implement Opportunities schema, repository, and service with BANT-style qualification fields
- **Objective**: Model the sales pipeline entity — an Opportunity belongs to an Account, has a
  `stage`, an amount, a close date, and a structured qualification block (Budget, Authority,
  Need, Timeline) that Sprint 2's `AI-002` will later help score.
- **Business Value**: Opportunities are the core of Sales Pipelines and Opportunity Qualification
  in the product mission, and the entity every later Analytics (Sprint 3) and cross-sell
  (`AI-003`) feature reads from.
- **Dependencies**: `CRM-001` (Account shape).
- **Target Files**:
  - `features/opportunities/schemas/opportunity-schema.ts`
  - `features/opportunities/types.ts`
  - `repositories/opportunities-repository.ts`
  - `services/opportunities-service.ts`
  - `features/opportunities/actions/create-opportunity.ts`
  - `features/opportunities/actions/update-opportunity-stage.ts`
- **Technical Instructions**: `opportunitySchema` fields: `id`, `orgId`, `accountId`, `name`,
  `stage` (enum: `prospecting`, `qualification`, `proposal`, `negotiation`, `closed_won`,
  `closed_lost`), `amount`, `expectedCloseDate`, `qualification` (nested object: `budget`,
  `authority`, `need`, `timeline` — each a short free-text or enum field, structured enough for
  `AI-002` to score later), `ownerId`, `createdBy`, `createdAt`, `updatedAt`. Add
  `update-opportunity-stage.ts` as a separate, narrower action (not a general update) because
  stage transitions are the operation the Kanban board (`CRM-008`) drives most frequently and the
  operation `COMM-002`/Sprint 3's `COMM-003` will eventually hook a BalloAds trigger onto — keep
  it isolated so that hook has one clear call site.
- **Acceptance Criteria**: All CRUD functions org- and account-scoped, typed from
  `opportunitySchema`; `update-opportunity-stage` validates the new stage is a legal enum value
  and logs an `activities` entry recording the stage transition (old stage → new stage).
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) updated;
        project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: [../database-schema.md](../database-schema.md),
  [../glossary.md](../glossary.md) (Opportunity Qualification).
- **Testing Notes**: Unit tests for the stage-transition validation logic if `INFRA-005` has
  landed; otherwise manual verification of legal vs. illegal stage transitions.

### CRM-008: Opportunities pipeline (Kanban) and list view

- **Task ID**: `CRM-008`
- **Epic**: Opportunities
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Build the Opportunities pipeline board and list view toggle
- **Objective**: Give reps the primary way to work a pipeline — a Kanban-style board with one
  column per `stage`, drag-or-click to advance stage, plus a `SHELL-004`-table list view for
  power users who prefer a dense table.
- **Business Value**: The pipeline board is the single highest-visibility screen for a B2B CRM
  demo — it's the screen most likely to be shown first to judges after the Accounts list.
- **Dependencies**: `CRM-007`.
- **Target Files**:
  - `app/(dashboard)/opportunities/page.tsx`
  - `features/opportunities/components/pipeline-board.tsx`
  - `features/opportunities/components/pipeline-column.tsx`
  - `features/opportunities/components/opportunity-card.tsx`
  - `features/opportunities/components/opportunities-table.tsx`
  - `features/opportunities/hooks/use-opportunities.ts`
- **Technical Instructions**: For hackathon time constraints, implement stage advancement via a
  simple "move to next/previous stage" action on the card's dropdown menu rather than a full
  drag-and-drop library integration — full drag-and-drop is an acceptable Sprint 3+ polish item,
  not a Sprint 2 requirement. `pipeline-board.tsx` groups the `use-opportunities.ts` query result
  by `stage` client-side (no separate per-stage query). Add a view-toggle (board/list) persisted
  in `store/slices/ui-slice.ts` (extend it with an `opportunitiesView` field) so the choice
  survives navigation.
- **Acceptance Criteria**: Board renders one column per stage with correct opportunity counts and
  totals per column; advancing a card's stage calls `update-opportunity-stage` and moves it to
  the correct column without a manual refresh; list view renders the same data via
  `components/shared/data-table.tsx`.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../routes.md](../routes.md) updated; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 6-8
- **Documentation References**: [../ui-design-system.md](../ui-design-system.md),
  [sprint-1.md](./sprint-1.md) `SHELL-004`.
- **Testing Notes**: Manual verification of stage-advance flows across all six stages, including
  the terminal `closed_won`/`closed_lost` states (card should show as terminal, e.g. no further
  "advance" option).

### CRM-009: Contracts data layer

- **Task ID**: `CRM-009`
- **Epic**: Contracts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Implement Contracts schema, repository, and service
- **Objective**: Model Contracts as records tied to a `closed_won` Opportunity — value, term
  dates, renewal date, and status — completing the third core CRM entity.
- **Business Value**: Contracts close the loop from pipeline to revenue in the product mission and
  are a prerequisite for any renewal/upsell signal (`AI-003`, Sprint 3).
- **Dependencies**: `CRM-007` (an Opportunity must exist and typically be `closed_won` before a
  Contract references it).
- **Target Files**:
  - `features/contracts/schemas/contract-schema.ts`
  - `repositories/contracts-repository.ts`
  - `services/contracts-service.ts`
  - `features/contracts/actions/create-contract.ts`
- **Technical Instructions**: `contractSchema` fields: `id`, `orgId`, `accountId`,
  `opportunityId` (optional — a contract can in principle be created without a prior tracked
  opportunity, e.g. backfilled data), `value`, `startDate`, `endDate`, `renewalDate` (optional),
  `status` (enum: `draft`, `active`, `expired`, `renewed`, `terminated`), `createdBy`,
  `createdAt`, `updatedAt`. The service layer warns (returns a non-blocking warning field in the
  result, not an error) if `opportunityId` is supplied but that opportunity's `stage` isn't
  `closed_won` — a soft data-quality nudge, not a hard validation failure, since backfilled or
  edge-case contracts are legitimate.
- **Acceptance Criteria**: Contract creation succeeds with or without an `opportunityId`; the
  soft warning appears when the linked opportunity isn't `closed_won`; all fields typed from
  `contractSchema`.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) updated;
        project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: [../database-schema.md](../database-schema.md).
- **Testing Notes**: Manual verification of the soft-warning path; unit test if `INFRA-005` has
  landed.

### CRM-010: Contracts list and create UI

- **Task ID**: `CRM-010`
- **Epic**: Contracts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the Contracts list page and create-contract form
- **Objective**: Give Contracts a UI surface at `/contracts`, including the option to pre-fill
  `accountId`/`opportunityId` when launched from an Opportunity's `closed_won` card.
- **Business Value**: Completes the third full CRM vertical slice for the sprint, and gives the
  demo a concrete "won deal to signed contract" narrative arc.
- **Dependencies**: `CRM-009`.
- **Target Files**:
  - `app/(dashboard)/contracts/page.tsx`
  - `features/contracts/components/contracts-table.tsx`
  - `features/contracts/components/create-contract-dialog.tsx`
  - `features/contracts/components/create-contract-form.tsx`
- **Technical Instructions**: Reuse `data-table.tsx` and the established dialog/form pattern.
  Surface the soft data-quality warning from `CRM-009`'s service as an inline `components/ui/
alert.tsx` (not a blocking error) if the user proceeds with a non-`closed_won` opportunity link.
- **Acceptance Criteria**: `/contracts` lists all org contracts; creating one from a
  `closed_won` opportunity pre-fills the linking fields; the soft warning renders correctly for
  the edge case.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../routes.md](../routes.md) updated; project-wide DoD met;
        `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: [sprint-1.md](./sprint-1.md) `CRM-003`/`CRM-004`.
- **Testing Notes**: Manual verification of both the clean-link and soft-warning creation paths.

### SHELL-005: Notifications menu

- **Task ID**: `SHELL-005`
- **Epic**: Design System — App Shell
- **Priority**: P1
- **Owner**: Developer 2
- **Title**: Build the topbar notifications menu backed by the `notifications` collection
- **Objective**: Surface `organizations/{orgId}/notifications` (already reserved in
  `firestore.rules`) in the topbar as a bell icon with an unread-count badge and a dropdown list,
  giving the shell somewhere to render events like "AI job completed" (`AI-002`) or "contract
  renewal due" (future).
- **Business Value**: A visible notifications affordance is expected in an enterprise SaaS shell
  and gives the AI Job pattern (`AI-001`/`AI-002`) a UI destination for completion events instead
  of requiring users to poll a job status manually.
- **Dependencies**: `SHELL-003` (topbar).
- **Target Files**:
  - `components/shared/notifications-menu.tsx`
  - `features/notifications/schemas/notification-schema.ts`
  - `repositories/notifications-repository.ts`
  - `features/notifications/actions/mark-notification-read.ts`
  - `features/notifications/hooks/use-notifications.ts`
- **Technical Instructions**: `notificationSchema` fields: `id`, `orgId`, `userId` (recipient),
  `type` (e.g. `ai_job_completed`, `contract_renewal_due`), `title`, `body`, `relatedTo` (`{
type, id }`, matching the pattern already used for `activities`), `read` (boolean), `createdAt`.
  Use `components/ui/popover.tsx` or `dropdown-menu.tsx` for the menu; use TanStack Query with a
  short polling interval (or a Firestore `onSnapshot` listener, matching the pattern
  `integrations.md` describes for AI Job UI observation) for near-real-time unread counts.
- **Acceptance Criteria**: Bell icon shows an accurate unread count; opening the menu lists
  notifications newest-first; clicking one marks it read and decrements the count.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../database-schema.md](../database-schema.md) updated with the
        `notifications` shape; project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: [../architecture.md](../architecture.md) §5,
  [../integrations.md](../integrations.md) (AI Job observation pattern).
- **Testing Notes**: Manual verification: manually insert a test notification document, confirm
  it appears and the unread count updates, mark it read and confirm the badge decrements.

### COMM-001: BalloAds API client foundation

- **Task ID**: `COMM-001`
- **Epic**: BalloAds Integration
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Build the `lib/balloads/` client and wire BalloAds environment variables
- **Objective**: Create the single, server-only module allowed to call BalloAds'
  `/v1/developer-portal/*` API and hold `BALLOADS_API_BASE_URL`/`BALLOADS_DEVELOPER_API_KEY`, per
  [integrations.md](../integrations.md) — this does not yet call BalloAds for anything
  meaningful; it establishes the adapter boundary `COMM-002` builds on.
- **Business Value**: Isolates the entire BalloAds integration behind one module so the
  not-yet-confirmed API contract ([risks.md](../risks.md) R2) can change without touching every
  call site, and guarantees the developer API key can never leak to the client
  ([risks.md](../risks.md) R6).
- **Dependencies**: `INFRA-001` (env schema pattern to extend).
- **Target Files**:
  - `lib/balloads/client.ts`
  - `lib/balloads/types.ts`
  - `lib/balloads/README.md`
  - `config/env.ts` (add `BALLOADS_API_BASE_URL`, `BALLOADS_DEVELOPER_API_KEY` to
    `getServerEnv()`)
  - `.env.example` (add the two new keys with placeholder values and a comment)
- **Technical Instructions**: Mark `client.ts` with the `server-only` package. `types.ts` holds
  Zod schemas for every request/payload BalloAds is expected to accept, per
  [integrations.md](../integrations.md) — mark each as `// TBC against live BalloAds OpenAPI
spec` in a comment, since no spec has been supplied yet. Read the per-organization key from
  `organizations/{orgId}/integrations/balloAds` via the Admin SDK first, falling back to the
  `BALLOADS_DEVELOPER_API_KEY` env var only if no per-org key is configured (per
  [integrations.md](../integrations.md)'s "fallback/dev-time key" note). Build a mocked/stubbed
  response mode (toggled by an env flag) so `COMM-002` can be developed and demoed without a live
  BalloAds sandbox if credentials aren't available in time, per the mitigation in
  [risks.md](../risks.md) R2.
- **Acceptance Criteria**: `lib/balloads/client.ts` cannot be imported from a Client Component
  (build fails); the client exposes typed functions for at minimum "trigger a journey/send" and
  "read delivery/opt-out status," both returning Zod-validated shapes; a mock mode produces
  plausible fake responses when no live credentials are configured.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../integrations.md](../integrations.md) updated to mark the
        client as implemented (endpoints/payloads remain marked TBC until confirmed);
        [../environment.md](../environment.md) updated with the new env vars; project-wide DoD
        met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Must read [../integrations.md](../integrations.md) in full and
  [../risks.md](../risks.md) R2/R6 before starting.
- **Testing Notes**: Manual verification in mock mode (no live BalloAds credentials required);
  if a sandbox key becomes available, verify one real call against it and note the actual
  response shape in [../integrations.md](../integrations.md), replacing a "TBC" marker with a
  confirmed one.

### COMM-002: Trigger a BalloAds send and surface Health Score on Accounts

- **Task ID**: `COMM-002`
- **Epic**: BalloAds Integration
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Wire the first real BalloAds call into an Account action and surface Health Score
- **Objective**: Consume `COMM-001`'s client from a real feature: an "Trigger onboarding" button
  on the Account detail view that calls BalloAds and logs the call as an Activity, plus a
  read-only "BalloAds Health Score" field on the Account shown when the API exposes it.
- **Business Value**: This is the sprint's proof that BalloCRM's non-negotiable integration
  boundary (call out to BalloAds, never reimplement) works in a real UI, not just in the client
  module — and it's a concrete, demoable AI-adjacent enrichment (Health Score) for judges.
- **Dependencies**: `COMM-001`, `CRM-001` (Account).
- **Target Files**:
  - `features/accounts/actions/trigger-balloads-onboarding.ts`
  - `features/accounts/actions/sync-health-score.ts`
  - `services/accounts-service.ts` (extend with BalloAds composition)
  - `features/accounts/components/health-score-badge.tsx`
  - `app/(dashboard)/accounts/[accountId]/page.tsx` (Account detail page, first version)
- **Technical Instructions**: `trigger-balloads-onboarding.ts` calls
  `services/accounts-service.ts`'s new `triggerOnboarding(orgId, accountId)`, which calls
  `lib/balloads/client.ts` and then writes an `activities` document
  (`{ relatedTo: { type: "account", id }, type: "balloads_journey_triggered", ... }`) — never a
  second delivery attempt inside BalloCRM. `sync-health-score.ts` reads the score via
  `lib/balloads/client.ts` and writes it to the Account's `healthScore` field, clearly labeled in
  the UI as BalloAds-supplied per [integrations.md](../integrations.md) — BalloCRM never computes
  its own version. If the API doesn't expose the field (mock mode returns `null`), the badge is
  simply omitted, not approximated.
- **Acceptance Criteria**: Clicking "Trigger onboarding" results in a call to `lib/balloads/`
  (real or mocked) and a new Activity entry visible on the Account detail's timeline query (per
  the `activities`-as-timeline design in [decisions.md](../decisions.md)); the Health Score badge
  renders only when a value is present and is visibly labeled as BalloAds-supplied.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../integrations.md](../integrations.md) updated; project-wide
        DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: [../integrations.md](../integrations.md),
  [../decisions.md](../decisions.md) (activities-as-timeline ADR).
- **Testing Notes**: Manual verification in mock mode: trigger onboarding, confirm the Activity
  appears in the timeline query; confirm the badge only renders with a non-null score.

### AI-001: Brutus AI client and AI Jobs foundation

- **Task ID**: `AI-001`
- **Epic**: AI Commercial Intelligence
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Build the `lib/brutus/` client and the `aiJobs` repository/lifecycle scaffold
- **Objective**: Create the server-only Brutus AI client and the shared `aiJobs` repository that
  implements the `queued -> running -> completed | failed` lifecycle described in
  [integrations.md](../integrations.md), so any feature (starting with `AI-002`) can create and
  advance an AI Job without re-deriving the pattern.
- **Business Value**: This is the reusable substrate every future Brutus AI feature (opportunity
  qualification now, next-best-action/summarization/cross-sell later) is built on — getting the
  async job contract right once here avoids three divergent implementations later.
- **Dependencies**: `INFRA-001` (env schema pattern to extend).
- **Target Files**:
  - `lib/brutus/client.ts`
  - `lib/brutus/types.ts`
  - `lib/brutus/README.md`
  - `repositories/ai-jobs-repository.ts`
  - `services/ai-jobs-service.ts`
  - `config/env.ts` (add `BRUTUS_AI_API_BASE_URL`, `BRUTUS_AI_API_KEY`)
  - `.env.example` (add the two new keys)
- **Technical Instructions**: Mark `lib/brutus/client.ts` `server-only`. `ai-jobs-repository.ts`
  exposes `createJob`, `getJobById`, `updateJobStatus` scoped to `organizations/{orgId}/aiJobs`.
  `ai-jobs-service.ts` exposes a generic `runAiJob(orgId, type, relatedTo, requestedBy, handler)`
  helper that creates the `queued` job, flips it to `running`, invokes `handler` (the
  feature-specific Brutus call), and writes `completed`/`failed` with the result or error — so
  `AI-002` (and future AI features) only supply the `handler`, not the job bookkeeping. Per
  [integrations.md](../integrations.md), the exact background-invocation mechanism (fire-and-
  forget continuation vs. a lightweight Route Handler trigger) is a decision to record in
  [decisions.md](../decisions.md) as part of this task, not left implicit.
- **Acceptance Criteria**: `runAiJob` correctly transitions a job through all four states for
  both a successful and a deliberately-failing handler; `lib/brutus/client.ts` cannot be imported
  client-side; the background-invocation mechanism chosen is documented as a new ADR.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../decisions.md](../decisions.md) updated with the new ADR;
        [../database-schema.md](../database-schema.md) updated with the `aiJobs` shape;
        project-wide DoD met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: Must read [../integrations.md](../integrations.md) §"The async
  AI Job pattern" in full before starting.
- **Testing Notes**: Unit tests for `runAiJob`'s state machine if `INFRA-005` has landed
  (a fast, high-value test target since every future AI feature depends on this transition logic
  being correct); otherwise manual verification with a stub handler that succeeds and one that
  throws.

### AI-002: Opportunity qualification scoring AI Job

- **Task ID**: `AI-002`
- **Epic**: AI Commercial Intelligence
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Implement "Qualify with Brutus AI" on the Opportunity detail view
- **Objective**: Ship the first real Brutus AI feature — a rep clicks "Qualify with Brutus AI" on
  an Opportunity, a `opportunity_qualification` AI Job runs via `AI-001`'s scaffold, and the UI
  polls/subscribes to show a score and rationale once complete.
- **Business Value**: This is the sprint's headline AI Commercial Intelligence demo moment —
  turning the qualification fields from `CRM-007` into an AI-assisted score is a core product
  mission item.
- **Dependencies**: `AI-001`, `CRM-007`.
- **Target Files**:
  - `features/opportunities/actions/qualify-opportunity.ts`
  - `services/opportunity-qualification-service.ts`
  - `features/opportunities/components/qualify-button.tsx`
  - `features/opportunities/components/qualification-result-card.tsx`
  - `features/opportunities/hooks/use-ai-job.ts`
- **Technical Instructions**: `qualify-opportunity.ts` calls
  `opportunity-qualification-service.ts`, which calls `ai-jobs-service.ts`'s `runAiJob` with a
  handler that reads the Opportunity's `qualification` fields and activity history, sends them to
  `lib/brutus/client.ts`, and returns a `{ score, rationale }` result shape. `use-ai-job.ts` is a
  TanStack Query hook polling `getJobById` at a short interval while `status` is
  `queued`/`running`, stopping once terminal (per the pattern in
  [integrations.md](../integrations.md)). `qualification-result-card.tsx` renders the score,
  rationale, and a "failed — retry" state if the job errors — never an infinite spinner, per
  [risks.md](../risks.md) R5.
- **Acceptance Criteria**: Clicking "Qualify with Brutus AI" creates a job, the button shows a
  pending state, and the result card renders the score/rationale on completion without a manual
  page refresh; a simulated Brutus failure renders a visible failed state with a retry action.
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../integrations.md](../integrations.md) updated with the
        `opportunity_qualification` job type's concrete payload/result shape; project-wide DoD
        met; `docs/progress.md`/`changelog.md` updated.
- **Estimated Complexity**: L
- **Estimated Hours**: 5-6
- **Documentation References**: [../integrations.md](../integrations.md),
  [sprint-1.md](./sprint-1.md) `CRM-007` (qualification fields).
- **Testing Notes**: Manual verification with a mocked Brutus response for both success and
  failure paths; confirm no infinite spinner state is reachable.

### INFRA-005: Adopt a test framework and add first unit tests

- **Task ID**: `INFRA-005`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Adopt Vitest and add first unit tests for repositories/services
- **Objective**: Close the testing gap flagged in [risks.md](../risks.md) R1 before Sprint 2's
  three new entities and two integrations ship without any regression safety net — install
  Vitest, wire it to run against the Firestore emulator for repository tests, and write the first
  real tests for `accounts-service.ts` and `contacts-service.ts`'s business-rule logic.
- **Business Value**: Three developers (and AI agents) shipping in parallel across a layered
  architecture is exactly the situation where an untested `services/` regression silently breaks
  another feature's assumptions — this is the highest-leverage point to close the gap, per
  [risks.md](../risks.md) R1's mitigation plan.
- **Dependencies**: none (can start any time in the sprint; ideally early so `CRM-005`/`CRM-007`
  can add tests as they're built rather than retrofitting them).
- **Target Files**:
  - `package.json` (add `vitest`, `@firebase/rules-unit-testing`, and a `test` script)
  - `vitest.config.ts`
  - `services/__tests__/accounts-service.test.ts`
  - `services/__tests__/contacts-service.test.ts`
  - `.github/workflows/ci.yml` (extend to run `npm run test`)
- **Technical Instructions**: Use the Firestore emulator (`firebase emulators:start
--only firestore`) as the test backend for repository/service tests rather than mocking the
  Admin SDK, so tests exercise real query/index behavior. Document the emulator setup command in
  `docs/coding-standards.md`'s testing conventions section. Extend `INFRA-004`'s CI workflow to
  start the emulator and run `npm run test` as an additional step.
- **Acceptance Criteria**: `npm run test` runs and passes locally and in CI; at least one test
  exists per service function with a non-trivial business rule (account-existence check in
  `contacts-service.ts`, org-scoping in `accounts-service.ts`).
- **Definition of Done**:
  - [ ] Acceptance criteria met; [../risks.md](../risks.md) R1 updated to mark the test-framework
        portion of the mitigation landed; [../coding-standards.md](../coding-standards.md)
        updated with testing conventions; project-wide DoD met; `docs/progress.md`/`changelog.md`
        updated.
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: [../risks.md](../risks.md) R1, [sprint-1.md](./sprint-1.md)
  `INFRA-004`.
- **Testing Notes**: This task establishes testing infrastructure itself; verify by intentionally
  breaking `contacts-service.ts`'s validation in a scratch branch and confirming the new test
  fails, then reverting.

---

## Cross-track dependencies

- **`COMM-001`/`AI-001` (external clients) block `COMM-002`/`AI-002` (feature integrations) but
  not each other** — Developer 1 can build both client foundations in parallel since they touch
  disjoint files (`lib/balloads/` vs. `lib/brutus/`), and Developer 3 can start `COMM-002`/`AI-002`
  against each client's mock mode as soon as the corresponding `types.ts` shape is settled, without
  waiting for a live sandbox key.
- **`CRM-008`'s pipeline board reuses `SHELL-004`'s `data-table.tsx`** for its list-view toggle;
  no new shared-component work is needed since Sprint 1 already shipped it — this sprint is where
  that Sprint 1 investment starts paying off across three new entities.
- **`INFRA-005` should land early in the sprint**, not at the end — `CRM-005` through `CRM-010`
  benefit most from writing tests alongside the new services rather than retrofitting them once
  the sprint is nearly over.
- See [sprint-1.md](./sprint-1.md) for the foundational Accounts pattern every task above
  extends, and [sprint-3.md](./sprint-3.md) for how Campaigns, Analytics, and cross-sell signals
  build on this sprint's Opportunities/Contracts/BalloAds/Brutus work.
