# Phase 3–4 — Analytics & AI presentation

Phase 3–4 is Developer 2's contribution to the "differentiators" sprint: the presentation layer for
Brutus AI commercial intelligence and the analytics dashboards. Everything here is UI over data
another track produces — AI panels read `organizations/{orgId}/aiJobs` output (jobs authored by
Developer 1/3: AI-003/004/005), analytics reads `organizations/{orgId}/analyticsCache` (ANLY-001,
Developer 3), and the vertical filter bar drives Accounts/Opportunities/Analytics queries. **None
of these tasks may serialize on the producer landing.** Each one specifies a typed mock/stub matching
the real Firestore document shape from [../../database-schema.md](../../database-schema.md), so the
component is fully demoable first and the real data source is a one-hook swap.

All charts follow the **Charts** conventions in [../../ui-design-system.md](../../ui-design-system.md):
Recharts only, `--color-chart-1..5` tokens via `var(--color-chart-n)` (never hardcoded hex),
`--color-primary`/`--color-destructive` for semantic series, every chart in a `ResponsiveContainer`
inside a `Card`/`CardContent` with a same-height `Skeleton` loading state, and popover-styled custom
tooltips. Also load the **dataviz** skill before writing any chart code. Fields follow
[../task-template.md](../task-template.md).

---

### AI-010: AI insight panel component

- **Task ID**: `AI-010`
- **Epic**: AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: AI insight panel component (renders `aiJobs` output: score, next-best-action, summary) with polling/loading/failed states
- **Objective**: Build a reusable panel that renders a completed Brutus AI job's `output` — score,
  next-best-action, rationale/summary — and handles the full async lifecycle
  (`queued`/`running`/`completed`/`failed`) by polling/subscribing to an `aiJobs` document, so
  Account/Opportunity detail pages can show AI insight without their own lifecycle logic.
- **Business Value**: This is where the headline "AI Commercial Intelligence" story becomes visible
  to judges — a clean panel showing a qualification score and a recommended next action is the
  differentiator the whole pitch rests on.
- **Dependencies**: The `aiJobs` document shape + state machine (`AI-001`, Developer 1/3) and the
  jobs that produce output (`AI-003` qualification, `AI-004` next-best-action, `AI-005`
  summarization). **Soft**: build against a typed mock `aiJobs` document (all four states) matching
  [../../database-schema.md](../../database-schema.md); swap to the real polling/subscription hook
  once AI-001 lands. Pairs with `AI-011` (the trigger).
- **Target Files**:
  - `components/shared/ai/ai-insight-panel.tsx` (new)
  - `components/shared/ai/ai-insight-skeleton.tsx` (new — or reuse `card-skeleton` from SHELL-011)
  - `features/ai/hooks/use-ai-job.ts` (new — TanStack Query poll / `onSnapshot` on one job;
    coordinate the `features/ai/` folder)
  - `schemas/ai-job-schema.ts` (if not already owned by Dev 1/3 — the Zod shape for an aiJob;
    confirm ownership first)
- **Technical Instructions**:
  1. Model the `aiJobs` shape as a Zod schema per [../../database-schema.md](../../database-schema.md):
     `jobId`, `type` (`opportunity_qualification` | `next_best_action` | `summarization` | …),
     `status` (`queued`|`running`|`completed`|`failed`), `input`, `output` (`{ score?,
nextBestAction?, rationale?, summary? }`), `error`, `requestedBy`, timestamps.
  2. `use-ai-job.ts` reads a single job by `jobId`: poll via TanStack Query on a short interval
     while `status` is `queued`/`running`, stop on terminal state; or subscribe with `onSnapshot`
     for real-time — either way read **only** from `aiJobs` (no separate result collection), per the
     async AI Job pattern in [../../integrations.md](../../integrations.md). `aiJobs` is client-
     readable (rule allows org members to read), so a client subscription is acceptable.
  3. Render by status: `queued`/`running` → a `progress`/spinner + "Brutus is analyzing…" with the
     AI-insight skeleton; `completed` → the output (score as a labeled `Badge`/ring, next-best-
     action as a highlighted line, rationale/summary as body text); `failed` → an `ErrorState`
     (SHELL-011) showing the `error` with a retry that re-triggers via AI-011.
  4. Use `card.tsx` for the panel; label it clearly as AI/Brutus-sourced. Score badges must carry a
     text label (not color-only), per Accessibility. Keep the panel generic over job `type` so it
     serves Account (summary/next-best-action) and Opportunity (qualification score) alike.
  5. Never call Brutus AI or a repository directly from the component — it only reads the job doc.
- **Acceptance Criteria**:
  - Given a mock/real job in `queued`/`running`, the panel shows a loading/progress state that
    polls or subscribes until terminal.
  - Given a `completed` job, it renders score (labeled), next-best-action, and rationale/summary.
  - Given a `failed` job, it renders the error with a retry affordance.
  - Polling stops once the job is `completed`/`failed` (no runaway interval).
  - The panel is clearly labeled as Brutus AI output; renders correctly in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (mock states first, then real)
  - [ ] Reads only from `aiJobs`; no direct Brutus/repository calls in the component
  - [ ] Polling is bounded (stops on terminal state)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Read [../../integrations.md](../../integrations.md) (async AI Job
  pattern), [../../database-schema.md](../../database-schema.md) (`aiJobs`),
  [../../architecture.md](../../architecture.md) (Brutus AI), and
  [../../ui-design-system.md](../../ui-design-system.md) (Cards, Accessibility) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: drive the panel with a mock job
  cycling `queued`→`running`→`completed` → confirm loading then output and that polling stops; drive
  a `failed` job → confirm error + retry; verify no interval keeps running after terminal (check
  network/console); toggle theme.

---

### AI-011: AI job trigger button + progress UX

- **Task ID**: `AI-011`
- **Epic**: AI Commercial Intelligence
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: AI job trigger button + progress UX (invokes a Server Action, shows queued/running/completed)
- **Objective**: Build the trigger control that kicks off a Brutus AI job — a button that calls the
  relevant Server Action (e.g. `requestQualificationScore`), receives a `jobId`, and reflects
  progress (queued → running → completed/failed) by handing off to the AI-010 panel, with correct
  disabled/in-flight states so a user can't double-fire.
- **Business Value**: The "Qualify with Brutus AI" / "Ask Brutus" button is the interaction that
  starts the AI demo moment; smooth queued→running→result feedback makes the async AI feel
  intentional rather than laggy.
- **Dependencies**: The AI-job Server Action(s) (`AI-003`/`AI-004`/`AI-005`, Developer 1/3) and the
  `aiJobs` state machine (`AI-001`). `AI-010` (renders the result). **Soft**: build against a
  stubbed action returning `{ ok: true, data: { jobId } }` and a mock job that advances through
  states; swap to the real action + hook when they land.
- **Target Files**:
  - `components/shared/ai/ai-trigger-button.tsx` (new)
  - `features/ai/hooks/use-trigger-ai-job.ts` (new — wraps the action call + result handling)
  - Consumes `use-ai-job.ts` + `AiInsightPanel` from AI-010
- **Technical Instructions**:
  1. `AiTriggerButton` accepts an injected async `onTrigger()` that returns the shared Server Action
     result (`{ ok: true, data: { jobId } } | { ok: false, error }`) — the real one is a feature
     Server Action (e.g. `features/opportunities/actions/qualify-opportunity.ts`) that writes a
     `queued` aiJob and returns the `jobId` immediately (the rep is not blocked on the AI call), per
     the async pattern in [../../integrations.md](../../integrations.md).
  2. On click: disable the button, show an in-flight label ("Starting…"), call `onTrigger`. On
     `ok`, store the returned `jobId` and hand it to `AiInsightPanel` (AI-010) which takes over the
     queued/running/completed lifecycle; surface `!ok` via the SHELL-012 toast helper.
  3. Prevent double-fire: the button stays disabled while a job for this entity is non-terminal
     (derive from the AI-010 job state). Provide a re-run affordance once terminal.
  4. Keep it accessible (real `button`, `aria-label` if icon-only) and theme-safe; label it as a
     Brutus AI action.
- **Acceptance Criteria**:
  - Clicking the button calls the (stub/real) Server Action and disables while in flight.
  - On success, the returned `jobId` is handed to the AI insight panel which shows queued→running→
    completed progress.
  - On failure, an error toast appears and the button re-enables for retry.
  - The button cannot be double-fired while a non-terminal job exists for the entity.
  - Renders correctly in both themes; is keyboard-operable.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (stub first, then real action)
  - [ ] Returns immediately with a `jobId` (does not block on the AI call) per the async pattern
  - [ ] Double-fire prevented; error path uses the SHELL-012 toast helper
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Read [../../integrations.md](../../integrations.md) (async AI Job
  pattern, steps 1-5), [../../architecture.md](../../architecture.md) (Server Actions), and
  [../../ui-design-system.md](../../ui-design-system.md) (Buttons, Accessibility) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: click → button disables + calls
  stub; stub returns a `jobId` → panel shows progress to completion; force `!ok` → toast + re-enable;
  attempt a second click during a running job → blocked; keyboard-activate; toggle theme.

---

### ANLY-002: Pipeline/forecast analytics dashboard (Recharts) on `/analytics`

- **Task ID**: `ANLY-002`
- **Epic**: Analytics
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Pipeline/forecast analytics dashboard (Recharts) on `/analytics`
- **Objective**: Build the `/analytics` page's pipeline and forecast visualizations — pipeline value
  over time (line/area), opportunities by stage (bar), win-rate trend, and forecast totals — as
  Recharts charts wired to read-only analytics data, with date-range/segment filters and proper
  loading states.
- **Business Value**: A polished analytics dashboard is a high-visual-payoff judging moment
  ("here's your pipeline health at a glance") and demonstrates the commercial-intelligence value
  proposition beyond raw CRUD.
- **Dependencies**: `SHELL-002` (shell), `SHELL-003`/`KpiCard` (tiles), `SHELL-011` (chart
  skeletons). Data comes from the analytics aggregation service `ANLY-001` (Developer 3) which
  writes `organizations/{orgId}/analyticsCache` and exposes read actions (`getPipelineVelocity`,
  `getForecast`). **Soft**: build against typed mock cache data matching the `analyticsCache` shape
  in [../../database-schema.md](../../database-schema.md); swap to the real read hooks when ANLY-001
  lands. Uses `VSI-004` filter bar (soft) and the `/analytics` route.
- **Target Files**:
  - `app/(dashboard)/analytics/page.tsx` (new)
  - `features/analytics/components/pipeline-value-chart.tsx`, `stage-distribution-chart.tsx`,
    `win-rate-chart.tsx`, `forecast-summary.tsx` (new)
  - `features/analytics/hooks/use-analytics.ts` (new — TanStack Query over the read actions)
  - `components/shared/chart-tooltip.tsx` (new — popover-styled custom Recharts tooltip, reusable
    across all Phase 3–4 charts)
- **Technical Instructions**:
  1. **Load the `dataviz` skill before writing chart code.** Follow the Charts conventions in
     [../../ui-design-system.md](../../ui-design-system.md): line/area for trend, bar for
     categorical (opportunities by stage), color exclusively via `var(--color-chart-1..5)` (one
     token per series, in order) and `--color-primary`/`--color-destructive` for semantic series
     (won vs lost) — never hardcoded hex. Wrap each chart in `ResponsiveContainer` inside a
     `Card`/`CardContent` with a same-height `ChartSkeleton` (SHELL-011) loading state.
  2. Build a reusable `chart-tooltip.tsx` styled to match `popover.tsx` (bg-popover, text-popover-
     foreground, rounded, ring) and use it via Recharts' `Tooltip content=` on every chart, per the
     tooltip rule — not the default Recharts box.
  3. `use-analytics.ts` reads via TanStack Query over the ANLY-001 read actions
     (`getPipelineVelocity`, `getForecast`) backed by `analyticsCache`; the page is a Server
     Component with interactive chart leaves as small client components. Never read a repository or
     recompute aggregates client-side — the point of `analyticsCache` is precomputed reads.
  4. Add date-range and segment `select.tsx` filters (and the shared `VSI-004` vertical filter bar
     when available) in a toolbar; changing them re-queries. A `forecast-summary.tsx` renders
     forecast totals as `KpiCard`s (SHELL-003).
  5. Respect the `/analytics` permissions in [../../routes.md](../../routes.md) (owner/admin/manager/
     viewer; `rep` may be scoped) — the page renders behind the auth gate; scope-by-role is data-
     side (Developer 3), but don't hardcode assumptions that break for a scoped `rep`.
- **Acceptance Criteria**:
  - `/analytics` renders inside the shell with a pipeline-value trend chart, a by-stage bar chart, a
    win-rate trend, and forecast KPI tiles.
  - All chart colors resolve from `--color-chart-*`/semantic tokens and adapt correctly between
    light and dark mode (verify by toggling theme — no hardcoded hex).
  - Each chart shows a same-height skeleton while loading (no layout shift) and a popover-styled
    custom tooltip on hover.
  - Date-range/segment filters re-query and update the charts.
  - Charts are responsive (fill their container) and legible at narrow widths.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (mock data first, then real cache reads)
  - [ ] `dataviz` skill consulted; zero hardcoded chart colors
  - [ ] Reads via `analyticsCache`-backed actions only (no client-side aggregation)
  - [ ] [../../routes.md](../../routes.md) `/analytics` row updated to reflect the built dashboard
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 7-10
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Charts,
  Colors), [../../routes.md](../../routes.md) (`/analytics`),
  [../../database-schema.md](../../database-schema.md) (`analyticsCache`), and the `dataviz` skill
  before starting; update [../../routes.md](../../routes.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: load `/analytics` with mock cache
  data; confirm all charts render and tooltips match the popover style; toggle theme and confirm
  colors adapt (inspect that no hex is inlined); resize to confirm responsiveness; change filters →
  charts re-query; confirm skeletons show during a simulated slow load.

---

### ANLY-003: Natural-language pipeline Q&A panel UI

- **Task ID**: `ANLY-003`
- **Epic**: Analytics
- **Priority**: P3
- **Owner**: Developer 2
- **Title**: Natural-language pipeline Q&A panel UI (calls the Brutus NL job)
- **Objective**: Build the "ask a question about your pipeline" panel on `/analytics` — a query
  input that kicks off a Brutus AI natural-language analytics job (an `aiJobs` entry) and renders
  the completed answer (text plus any returned chart/table data), reusing the AI-010/AI-011 async
  job lifecycle.
- **Business Value**: Natural-language querying is a "wow" moment for judges ("how many deals will
  close this quarter?" answered in plain English), showcasing Brutus AI beyond scoring — a strong
  differentiator if the core is already solid.
- **Dependencies**: `AI-010` (job-lifecycle panel), `AI-011` (trigger pattern), `ANLY-002`
  (`/analytics` page context). The NL analytics job type in `aiJobs` (Brutus, Developer 1/3).
  **Soft**: build against a stubbed action returning a `jobId` and a mock completed NL job whose
  `output` includes an answer string (+ optional structured data); swap to the real action/hook
  later. This is P3 — attempt only if AI-001-005 and analytics are solid (per the backlog priority
  matrix).
- **Target Files**:
  - `features/analytics/components/nl-query-panel.tsx` (new)
  - `features/analytics/hooks/use-nl-query.ts` (new — wraps trigger + `use-ai-job`)
  - Consumes `AiInsightPanel`/`use-ai-job` (AI-010), the SHELL-012 toast helper, and the shared
    `chart-tooltip`/chart components from ANLY-002 if the answer includes chart data
- **Technical Instructions**:
  1. Build the query box with `input-group.tsx` (or `command.tsx`) per the `/analytics` component
     list in [../../routes.md](../../routes.md): a text input + submit, with example prompt chips.
  2. On submit, call the NL-analytics Server Action (stub → real) which writes an `aiJobs` doc of
     the NL-query type and returns a `jobId`; then drive the lifecycle with `use-ai-job` (AI-010) —
     queued/running → answer. Reuse AI-011's trigger/disabled semantics so a query can't double-fire.
  3. Render the completed `output` answer as body text; if the job returns structured data
     (series/rows), render it with the ANLY-002 chart components or a `DataTable` (SHELL-005/013).
     Handle `failed` with an `ErrorState` + retry.
  4. Keep a lightweight history of asked questions in local state (not Redux/server) for the session
     so the panel reads like a mini chat. Accessible (labeled input, keyboard submit) and theme-safe.
  5. Read only from `aiJobs`; the panel never calls Brutus directly.
- **Acceptance Criteria**:
  - Typing a question and submitting starts an NL job and shows queued/running progress.
  - A completed job renders the answer text (and any structured chart/table data) in the panel.
  - A failed job shows an error with retry; a query can't be double-submitted while running.
  - Example prompt chips populate the input; session question history is visible.
  - Renders correctly in both themes; input/submit are keyboard-operable.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (stub/mock first, then real)
  - [ ] Reuses AI-010/AI-011 lifecycle; reads only from `aiJobs`
  - [ ] Any answer charts follow the ANLY-002 chart conventions (tokens, tooltip)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: L
- **Estimated Hours**: 6-8
- **Documentation References**: Read [../../integrations.md](../../integrations.md) (async AI Job
  pattern), [../../routes.md](../../routes.md) (`/analytics` NL Q&A), and
  [../../ui-design-system.md](../../ui-design-system.md) (Charts, Accessibility) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: submit a question → progress →
  mock answer renders (text and, if present, a chart/table); force failure → error + retry; try to
  re-submit while running → blocked; use a prompt chip; confirm session history; keyboard submit;
  toggle theme.

---

### ANLY-004: Account health distribution + vertical breakdown charts + KPI tiles wired to `analyticsCache`

- **Task ID**: `ANLY-004`
- **Epic**: Analytics
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Account health distribution + vertical breakdown charts + KPI tiles wired to `analyticsCache`
- **Objective**: Build the account-health and vertical-segmentation analytics — a health-score
  distribution chart (bands: healthy/watch/at-risk), an accounts-by-vertical breakdown (bar), and
  supporting KPI tiles — wired to the `analyticsCache` read model, complementing the pipeline/
  forecast charts from ANLY-002.
- **Business Value**: Health and vertical breakdowns turn the BalloAds health-score enrichment and
  the vertical-sales-indexing story into a visible dashboard, directly supporting two of the
  product's named differentiators for judges.
- **Dependencies**: `ANLY-002` (charts/tooltip infra, `/analytics` page), `ANLY-001` (Developer 3 —
  `analyticsCache` producer, e.g. health/vertical breakdown cache keys), `VSI-004` (vertical filter
  bar, soft). **Soft**: build against mock cache data matching the `analyticsCache` shape in
  [../../database-schema.md](../../database-schema.md) (e.g. a `health_distribution` and
  `accounts_by_vertical` cacheKey); swap to real read hooks later.
- **Target Files**:
  - `features/analytics/components/health-distribution-chart.tsx` (new)
  - `features/analytics/components/vertical-breakdown-chart.tsx` (new)
  - `features/analytics/components/health-kpi-tiles.tsx` (new — reuses `KpiCard`)
  - `app/(dashboard)/analytics/page.tsx` (compose these into the analytics page from ANLY-002)
  - `features/analytics/hooks/use-analytics.ts` (extend with health/vertical queries)
- **Technical Instructions**:
  1. **Health distribution**: a bar (or stacked) chart of account counts by health band. Map bands
     to semantic status per the Colors guidance in [../../ui-design-system.md](../../ui-design-system.md)
     — healthy/watch/at-risk should reuse existing `Badge`/token semantics (`default`/`secondary`/
     `destructive`) rather than inventing green/amber/red hex; on the chart, use `--color-primary`/
     `--color-chart-*`/`--color-destructive` tokens, never hardcoded hex. Band thresholds should
     reference `ACCOUNT_HEALTH_THRESHOLDS` (constants, per [../../folder-structure.md](../../folder-structure.md))
     if that constant exists — don't re-hardcode thresholds inline.
  2. **Vertical breakdown**: a bar chart of accounts (or open pipeline value) by `vertical`, using
     `var(--color-chart-1..5)` per series/category. This ties to the vertical-sales-indexing index
     (`vertical ASC, healthScore DESC`) noted in [../../database-schema.md](../../database-schema.md).
  3. **KPI tiles**: reuse `KpiCard` (SHELL-003) for headline health numbers (e.g. accounts at risk,
     average health score) wired to `analyticsCache`.
  4. All charts follow ANLY-002 conventions (ResponsiveContainer + Card, same-height skeleton,
     popover-styled `chart-tooltip`). Load the `dataviz` skill first. Reads go through the
     `analyticsCache`-backed actions (extend `use-analytics.ts`) — never recompute from raw
     `accounts` client-side.
  5. Respect the shared vertical filter (VSI-004) when present so these charts filter consistently
     with the rest of `/analytics`.
- **Acceptance Criteria**:
  - `/analytics` shows a health-distribution chart (by band) and an accounts-by-vertical chart plus
    health KPI tiles.
  - Health bands are conveyed with a text label (legend/axis), not color alone; colors resolve from
    tokens and adapt across themes (no hardcoded hex).
  - Band thresholds come from the shared constant (if it exists), not inline magic numbers.
  - Charts show same-height skeletons while loading and popover-styled tooltips on hover.
  - Applying the vertical filter (VSI-004) updates these charts consistently; renders in both themes.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (mock cache first, then real)
  - [ ] `dataviz` skill consulted; zero hardcoded chart colors; thresholds from constants
  - [ ] Reads via `analyticsCache`-backed actions only
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 5-7
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Charts,
  Colors — health bands), [../../database-schema.md](../../database-schema.md) (`analyticsCache`,
  `accounts` health/vertical), [../../folder-structure.md](../../folder-structure.md) (`constants/`),
  and the `dataviz` skill before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: load `/analytics` with mock
  health/vertical cache; confirm both charts + KPI tiles render; toggle theme and confirm token-based
  colors adapt; confirm bands labeled (not color-only); apply the vertical filter and confirm
  consistent updates; confirm skeletons on slow load.

---

### VSI-004: Vertical segmentation filter controls

- **Task ID**: `VSI-004`
- **Epic**: Vertical Sales Indexing
- **Priority**: P2
- **Owner**: Developer 2
- **Title**: Vertical segmentation filter controls (shared filter bar used by accounts/opportunities/analytics)
- **Objective**: Build a reusable vertical/segment filter bar — a control (multi-select on
  `vertical`, plus tier/segment) that emits a typed filter state consumed identically by the
  Accounts list, Opportunities views, and the Analytics dashboards — so segmentation behaves
  consistently everywhere.
- **Business Value**: One filter bar shared across three surfaces makes "slice the whole CRM by
  industry vertical" a coherent, repeatable interaction — the concrete UI behind the Vertical Sales
  Indexing differentiator.
- **Dependencies**: `SHELL-010` (multi-select/combobox field) and `SHELL-013` (faceted filter
  pattern) are the building blocks. The `vertical` taxonomy field lives on the Account schema
  (`VSI-001`, Developer 3) — **soft**: build against the vertical enum values referenced in
  [../../database-schema.md](../../database-schema.md) (e.g. `logistics`, `manufacturing`, …) or a
  mock list; bind to the real Zod enum once VSI-001 lands. Consumed by Accounts (Dev 3), `VSI-002`,
  and ANLY-002/004.
- **Target Files**:
  - `components/shared/filters/vertical-filter-bar.tsx` (new — the shared bar)
  - `hooks/use-entity-filters.ts` (new — typed filter state + URL-param sync)
  - `schemas/` or `constants/` reference for the `vertical` enum (import VSI-001's enum when
    available; don't duplicate the source of truth)
- **Technical Instructions**:
  1. Build `VerticalFilterBar` as a toolbar (above a table/dashboard) using the SHELL-013 faceted-
     filter pattern (`popover.tsx`+`command.tsx` multi-select) for `vertical`, plus `select.tsx` for
     tier/segment where relevant, with active-filter chips and a reset — consistent with the
     Tables "filters live in a toolbar above the table" rule in
     [../../ui-design-system.md](../../ui-design-system.md).
  2. Emit a typed filter object (e.g. `{ verticals: string[], tier?: string }`) via an
     `onChange`/controlled prop so each consumer passes it into its own query (Accounts →
     `listAccounts`, Analytics → the cache read). The bar itself does **no** data fetching — it only
     produces filter state (keeps it feature-agnostic and reusable).
  3. Sync filter state to URL search params via `use-entity-filters.ts` so a filtered view is
     shareable/bookmarkable and survives refresh; keep it framework-light (Next.js
     `useSearchParams`/`useRouter`).
  4. The `vertical` options must come from VSI-001's Zod enum once it exists — import it rather than
     hardcoding a second list that could drift (per the single-source-of-truth rule in
     [../../naming-conventions.md](../../naming-conventions.md)). Until then, a clearly-marked mock
     list is acceptable.
  5. Accessible (keyboard-operable multi-select, labeled controls) and theme-safe.
- **Acceptance Criteria**:
  - The filter bar offers a multi-select vertical filter (+ tier/segment where relevant) with active
    chips and a reset.
  - Selecting verticals emits a typed filter object to the consumer (verified by a consumer logging
    or re-querying with it).
  - Filter state is reflected in the URL and restored on refresh.
  - The same component renders and behaves identically when mounted on an Accounts-style table and
    on the Analytics dashboard.
  - The bar performs no data fetching itself; renders correctly in both themes; keyboard-operable.
- **Definition of Done**:
  - [ ] All Acceptance Criteria met and manually verified (mock enum first, then VSI-001's enum)
  - [ ] Bar is feature-agnostic (emits filter state, fetches nothing)
  - [ ] `vertical` options sourced from VSI-001's enum once available (no duplicated taxonomy)
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
  - [ ] `../progress.md` + `../changelog.md` updated; task moved to [../completed.md](../completed.md)
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Read [../../ui-design-system.md](../../ui-design-system.md) (Tables →
  filters, Accessibility), [../../database-schema.md](../../database-schema.md) (`accounts.vertical`,
  vertical index), and [../../naming-conventions.md](../../naming-conventions.md) (single source of
  truth for enums) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual: mount the bar on a sample table
  and on the analytics page; select/clear verticals and confirm the emitted filter object and chips;
  confirm URL params update and survive refresh; confirm identical behavior in both mount points;
  keyboard-operate; toggle theme.
