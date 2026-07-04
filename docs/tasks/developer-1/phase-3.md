# Developer 1 — Phase 3: Integrations & AI Job Infrastructure

Phase 3 builds the server-side plumbing the product's differentiators run on: encrypted
per-organization credential storage, the BalloAds developer-portal API client, a scheduled
health-score/delivery-status sync job, the `aiJobs` state machine repository, and the Brutus AI
client wrapper. Developer 1 owns the **infrastructure** for these — the credential vault, the typed
clients, the job state machine — while feature teams (Developers 2/3) compose them into
user-facing flows (triggering a send from an opportunity, rendering an AI insight panel).

The single most important boundary in this phase (repeated throughout
[../../integrations.md](../../integrations.md)): BalloCRM **never** reimplements SMS/WhatsApp/Email
delivery, template rendering, or messaging auth — every capability is a call _into_ BalloAds. And
never use the bare word "journey" unqualified: `balloAdsJourney*` for the BalloAds concept,
`customerJourney`/`lifecycleStage` for the CRM concept.

Credential storage (COMM-002) is intentionally listed first — the BalloAds client (COMM-001) and
the sync job (INFRA-014) read decrypted keys from it. Confirm each task's Definition of Ready in
[../../sprint-plan.md](../../sprint-plan.md); close against the project-wide Definition of Done
there. Field order follows [../task-template.md](../task-template.md).

---

### COMM-002: Encrypted integration credential storage + crypto helper + admin-only server-side access

- **Task ID**: `COMM-002`
- **Epic**: Automated Customer Communications
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Encrypted integration credential storage (`organizations/{orgId}/integrations/{provider}`) + crypto helper + admin-only server-side access
- **Objective**: Implement the encrypted-at-rest credential vault for third-party integrations —
  one document per provider at `organizations/{orgId}/integrations/{provider}` (`balloAds`,
  `brutusAi`) — with a server-only crypto helper to encrypt/decrypt API keys and an admin-gated
  Server Action to connect/rotate credentials, all via the Admin SDK (the collection is
  `allow read, write: if false` for every client).
- **Business Value**: Per-organization BalloAds/Brutus keys are what make BalloCRM genuinely
  multi-tenant for integrations (each tenant connects their own account) and keep a long-lived
  credential from ever reaching a browser. It is the prerequisite for every real integration call.
- **Dependencies**: INFRA-004/INFRA-010 (the `integrations` rule: `read, write: if false`),
  INFRA-007 (`requireRole` to gate connect/rotate to owner/admin), INFRA-011 (audit-log credential
  rotation). Soft: an encryption key strategy — a dedicated secret env var is added here.
- **Target Files**:
  - `repositories/integrations.ts` (new — the only place reading/writing the `integrations`
    collection, via `firestoreAdmin`)
  - `services/integrations.ts` (new — connect/rotate/get-decrypted-key business logic)
  - `lib/crypto/index.ts` (new — encrypt/decrypt helper, `server-only`)
  - `actions/integrations.ts` (new — admin-gated `connectIntegration` / `rotateIntegrationKey`)
  - `schemas/integration.ts` (new — `IntegrationSchema` matching the doc shape)
  - `config/env.ts` / `.env.example` (add an encryption key secret, e.g.
    `INTEGRATION_ENCRYPTION_KEY`, to `serverEnvSchema`)
- **Technical Instructions**:
  1. Define `IntegrationSchema` matching [../../database-schema.md](../../database-schema.md):
     `provider` (doc ID), `encryptedApiKey`, `scope[]`, `connectedBy`, `connectedAt`,
     `lastVerifiedAt`. The document ID **is** the provider (`balloAds` / `brutusAi`).
  2. `lib/crypto/index.ts` uses Node `crypto` (authenticated symmetric encryption, e.g.
     AES-256-GCM) with a key from a new server-only env var `INTEGRATION_ENCRYPTION_KEY` (add to
     `serverEnvSchema` + `.env.example` + [../../environment.md](../../environment.md) in the same
     change). Import `server-only` so it can never bundle client-side. Only ever materialize the
     decrypted key inside server code.
  3. `services/integrations.ts` exposes `connectIntegration` (encrypt + store), `rotateIntegrationKey`
     (re-encrypt new key, update `lastVerifiedAt`, write an audit log via INFRA-011), and an
     internal `getDecryptedApiKey(orgId, provider)` that ONLY server-side callers (the BalloAds/
     Brutus clients) use — never returned to any UI/prop.
  4. `actions/integrations.ts` gates connect/rotate with `requireRole(session, ["owner","admin"])`.
     Confirm the `integrations` rule stays `read, write: if false` (all access is Admin SDK).
- **Acceptance Criteria**:
  - An owner/admin can connect a `balloAds` (and `brutusAi`) credential; the stored document
    contains only the encrypted key (no plaintext), plus `connectedBy`/`connectedAt`.
  - A client SDK read or write of `integrations` is denied for every role (including owner) in the
    emulator.
  - `getDecryptedApiKey` returns the original key server-side; the decrypted value never appears in
    any client-visible payload, prop, or log.
  - Rotating a key writes a new `encryptedApiKey`, updates `lastVerifiedAt`, and produces an
    audit-log entry.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`integrations`),
        [../../integrations.md](../../integrations.md), [../../firestore-rules.md](../../firestore-rules.md),
        [../../environment.md](../../environment.md) + `.env.example` (`INTEGRATION_ENCRYPTION_KEY`),
        and [../../api.md](../../api.md) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md),
  [../../database-schema.md](../../database-schema.md),
  [../../firestore-rules.md](../../firestore-rules.md), and
  [../../environment.md](../../environment.md) before starting; must update all of those plus
  `.env.example` and [../../api.md](../../api.md).
- **Testing Notes**: With INFRA-012 landed, unit-test `lib/crypto` (encrypt→decrypt round-trip,
  tamper-detection failure) and `services/integrations.ts` (role gating, audit write) with the
  repository mocked. Manual: connect a key as admin, confirm only ciphertext is stored (console),
  confirm a client read is denied in the emulator.

---

### COMM-001: BalloAds developer-portal API client (`lib/balloads/client.ts`, server-only)

- **Task ID**: `COMM-001`
- **Epic**: Automated Customer Communications
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: BalloAds developer-portal API client (`lib/balloads/client.ts`, server-only) with typed methods + error handling
- **Objective**: Build the server-only HTTP client that is the **only** module allowed to call
  BalloAds' `/v1/developer-portal/*` REST surface and hold the BalloAds credentials — with typed
  methods (trigger a send/journey, read delivery status, read opt-out status, read health score),
  Zod-validated responses, and consistent error handling.
- **Business Value**: This is the gateway to every messaging-adjacent feature (triggering onboarding
  sends, surfacing delivery/opt-out status, health-score enrichment). Without it, BalloCRM has no
  way to reach BalloAds — and the non-goal of "never reimplement messaging" is enforced by funneling
  all of it through here.
- **Dependencies**: COMM-002 (reads the decrypted per-org key via `getDecryptedApiKey`), INFRA-001
  (`BALLOADS_API_BASE_URL` / `BALLOADS_DEVELOPER_API_KEY` validated in `getServerEnv`), INFRA-013
  (result/error envelope — soft). Soft: endpoint paths/payloads are **TBC against the live BalloAds
  developer-portal OpenAPI spec** — model expected shapes as Zod schemas and parse at the boundary.
- **Target Files**:
  - `lib/balloads/client.ts` (new — the client, `server-only`)
  - `lib/balloads/types.ts` (new — Zod schemas for request/response shapes)
  - `lib/balloads/index.ts` (new — barrel export)
  - `lib/README.md` (note the client now exists — `lib/balloads/` is its designated home)
- **Technical Instructions**:
  1. Import `server-only`. Read `BALLOADS_API_BASE_URL` from `getServerEnv()` and the API key from
     COMM-002's `getDecryptedApiKey(orgId, "balloAds")` (falling back to
     `BALLOADS_DEVELOPER_API_KEY` for dev/single-tenant, per
     [../../environment.md](../../environment.md)). The key must never be passed to a Client
     Component or logged.
  2. Provide typed methods for the realistic capability surface in
     [../../integrations.md](../../integrations.md): (a) trigger a send / enrol in a BalloAds
     journey, (b) read delivery status / message logs, (c) read opt-out status per
     `(company, channel)`, (d) read a company health score. Mark every path/payload as **TBC**
     against the live spec; model the _expected_ shape as a Zod schema (ADR-009) and
     `parse`/narrow responses — never reach for `any`.
  3. Do NOT call BalloAds from a Client Component, browser `fetch`, or Edge middleware — the client
     is invoked only from `services/` (composed into business ops) called by Server Actions/Route
     Handlers, per [../../architecture.md](../../architecture.md).
  4. Naming: qualify every BalloAds concept as `balloAds*` (`triggerBalloAdsJourney`,
     `balloAdsJourneyRef`) — an unqualified `journey` identifier is a review blocker per
     [../../integrations.md](../../integrations.md).
  5. Return typed results / throw only on genuinely unexpected transport failures, aligning with
     INFRA-013's envelope.
- **Acceptance Criteria**:
  - `lib/balloads/client.ts` is the only module referencing the BalloAds base URL / key, imports
    `server-only`, and fails the build if imported client-side.
  - Each capability method has a Zod-typed request and response; responses are parsed/validated at
    the boundary (no `any`, no unqualified `journey`).
  - Against a mock/sandbox endpoint, a successful call returns a typed result and a failing call
    surfaces a typed error, not a swallowed null.
  - No BalloAds credential appears in any client payload or log.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) (mark which methods are implemented vs. still
        TBC) and [../../architecture.md](../../architecture.md) (BalloAds integration) updated;
        `lib/README.md` notes the client exists
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md),
  [../../architecture.md](../../architecture.md) (BalloAds), and
  [../../environment.md](../../environment.md) before starting; must update
  [../../integrations.md](../../integrations.md) and
  [../../architecture.md](../../architecture.md).
- **Testing Notes**: With INFRA-012 landed, unit-test each method against a mocked `fetch` (success
  - error + malformed-response-rejected-by-Zod). Manual: with a dev key configured, call one
    read-only method (e.g. health score) from a throwaway Server Action and confirm a typed response;
    confirm the key never appears in network/devtools on the client.

---

### INFRA-014: BalloAds health-score & delivery-status sync job

- **Task ID**: `INFRA-014`
- **Epic**: Automated Customer Communications
- **Priority**: P2
- **Owner**: Developer 1
- **Title**: BalloAds health-score & delivery-status sync job (scheduled Route Handler writing `healthScore`/`healthScoreSource` onto accounts/contacts)
- **Objective**: Provide a scheduled server-side sync that reads externally-computed health scores
  (and delivery/opt-out status) from BalloAds via the COMM-001 client and writes them onto
  `accounts` (`healthScore`, `healthScoreSource: "balloAds"`) and `contacts`
  (`optedOutChannels`) via the Admin SDK — treating these strictly as read-only enrichment fields
  BalloCRM never computes itself.
- **Business Value**: A live "BalloAds Health Score" badge on an account is a cheap, visibly
  "AI-ish" enrichment for judges (see the priority matrix in [../backlog.md](../backlog.md)) and
  keeps BalloCRM's displayed delivery/opt-out state as a mirror of BalloAds' single source of
  truth, never a second, drifting ledger.
- **Dependencies**: COMM-001 (the BalloAds client), COMM-002 (per-org credentials to authenticate),
  INFRA-010 (the `accounts` `vertical,healthScore` index that ranks by the synced score). Soft:
  Developer 3's `accounts`/`contacts` repositories define the write targets — the field names are
  fixed by [../../database-schema.md](../../database-schema.md), so this can proceed against them.
- **Target Files**:
  - `app/api/sync/balloads/route.ts` (new — Route Handler invoked on a schedule)
  - `services/balloads-sync.ts` (new — orchestrates read-from-BalloAds → write-to-Firestore)
  - `repositories/accounts.ts` / `repositories/contacts.ts` (extend, or coordinate with Developer 3,
    to write the enrichment fields via `firestoreAdmin`)
  - `vercel.json` or the deployment cron config (new/updated — schedule the Route Handler)
- **Technical Instructions**:
  1. Implement `app/api/sync/balloads/route.ts` as a Route Handler (Node runtime, not Edge) that
     the schedule triggers — Route Handlers are the correct surface for non-UI-initiated work per
     [../../architecture.md](../../architecture.md). Protect it (e.g. a shared secret / Vercel cron
     header) so it isn't publicly invocable.
  2. `services/balloads-sync.ts` iterates the org's accounts, calls the COMM-001 client's
     health-score / delivery-status / opt-out methods, and writes `healthScore` (0-100) +
     `healthScoreSource: "balloAds"` onto `accounts`, and `optedOutChannels` onto `contacts`, via
     the Admin SDK. Never compute a local score — if BalloAds doesn't expose it, omit the field.
  3. Use server timestamps for `updatedAt`; write only the enrichment fields (avoid clobbering
     unrelated fields). Log each sync run via INFRA-013's logger.
  4. Configure the schedule (Vercel Cron / equivalent) and document it in
     [../../deployment.md](../../deployment.md) and [../../integrations.md](../../integrations.md).
- **Acceptance Criteria**:
  - Invoking the sync Route Handler updates `healthScore` + `healthScoreSource: "balloAds"` on
    accounts and `optedOutChannels` on contacts, sourced from BalloAds — no locally-computed score.
  - The endpoint rejects unauthenticated/unscheduled callers.
  - The `accounts` `vertical,healthScore DESC` index serves a "rank accounts by health" query after
    a sync without an index error.
  - A BalloAds field that isn't exposed results in the field being omitted, not approximated.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) (health-score/delivery sync),
        [../../deployment.md](../../deployment.md) (cron schedule), and
        [../../database-schema.md](../../database-schema.md) (enrichment fields) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md),
  [../../architecture.md](../../architecture.md) (Route Handlers / BalloAds),
  [../../database-schema.md](../../database-schema.md) (`accounts`/`contacts`), and
  [../../deployment.md](../../deployment.md) before starting; must update
  [../../integrations.md](../../integrations.md), [../../deployment.md](../../deployment.md), and
  [../../database-schema.md](../../database-schema.md).
- **Testing Notes**: With INFRA-012 landed, unit-test `services/balloads-sync.ts` with the BalloAds
  client mocked (asserts correct field writes, omission when unexposed). Manual: invoke the Route
  Handler against a seeded account with the dev key, confirm the enrichment fields update in the
  console and the health badge would render.

---

### AI-001: `aiJobs` collection state machine repository + transition helpers

- **Task ID**: `AI-001`
- **Epic**: AI Commercial Intelligence
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: `aiJobs` collection state machine (`queued→running→completed|failed`) repository + transition helpers (Admin SDK, server-only writes per rules)
- **Objective**: Implement the repository + transition helpers for
  `organizations/{orgId}/aiJobs/{jobId}` that create a job (`queued`), advance it
  (`running` → `completed`/`failed`), and write results/errors — all via the Admin SDK, since the
  `aiJobs` rule is `allow write: if false` (clients only ever read to poll/subscribe).
- **Business Value**: This is the backbone of every AI feature (qualification scoring,
  next-best-action, summarization). Modeling AI work as trackable jobs keeps the UI responsive and
  gives every insight an audit trail (who requested it, when, what came back) — the pattern in
  ADR-008.
- **Dependencies**: INFRA-004/INFRA-010 (the `aiJobs` rule: read org-member, write `false`, plus
  the `status,createdAt` index), INFRA-003 (verified session for `requestedBy`), INFRA-013 (typed
  result/error handling — soft). Consumed by AI-002 (the Brutus client fills in job output).
- **Target Files**:
  - `repositories/ai-jobs.ts` (new — the only writer of `aiJobs`, via `firestoreAdmin`)
  - `services/ai-jobs.ts` (new — `enqueueJob`, `markRunning`, `completeJob`, `failJob` transitions)
  - `schemas/ai-job.ts` (new — `AiJobSchema` + the status enum)
- **Technical Instructions**:
  1. Define `AiJobSchema` matching [../../database-schema.md](../../database-schema.md): `jobId`,
     `type` (e.g. `"opportunity_qualification"`), `status`
     (`z.enum(["queued","running","completed","failed"])`), `input`, `output`, `error`,
     `requestedBy`, `createdAt`, `startedAt`, `completedAt`.
  2. Enforce the legal transitions (`queued→running→completed|failed`) in `services/ai-jobs.ts` —
     reject an illegal transition (e.g. `completed→running`) with a typed error. `enqueueJob`
     returns `{ ok:true, data:{ jobId } }` immediately so the caller isn't blocked on the AI call
     (per [../../integrations.md](../../integrations.md) sequence).
  3. All writes go through the Admin SDK (`repositories/ai-jobs.ts`) — a client writing
     `status:"completed"` is denied by the rules, which is the whole point (a user must not be able
     to fabricate AI output). Set `startedAt` on `running`, `completedAt` on terminal states, all
     server timestamps.
  4. Reads stay open to org members so the UI can poll (TanStack Query) or subscribe
     (`onSnapshot`) — do not add a client write path.
- **Acceptance Criteria**:
  - `enqueueJob` creates an `aiJobs` doc with `status:"queued"`, `requestedBy` from the verified
    session, and returns the `jobId` without waiting on any AI call.
  - Transition helpers move a job `queued→running→completed`/`failed`, setting `startedAt`/
    `completedAt`; an illegal transition returns a typed error.
  - A client SDK write to `aiJobs` is denied; a read (poll/subscribe) succeeds for an org member.
  - The `status,createdAt DESC` index serves the org's job-queue view without an index error.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`aiJobs`) and
        [../../integrations.md](../../integrations.md) (AI Job pattern) kept in sync;
        [../../api.md](../../api.md) updated if the service is a documented surface
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`aiJobs`), [../../integrations.md](../../integrations.md) (async AI Job pattern),
  [../../decisions.md](../../decisions.md) (ADR-008), and
  [../../firestore-rules.md](../../firestore-rules.md) before starting; must update
  [../../database-schema.md](../../database-schema.md) and
  [../../integrations.md](../../integrations.md).
- **Testing Notes**: With INFRA-012 landed, unit-test the transition state machine (legal vs.
  illegal transitions, timestamp setting) with the repository mocked — high-value `services/` logic.
  Manual: enqueue a job from a throwaway action, watch it move through states in the console, and
  confirm a client write is denied in the emulator.

---

### AI-002: Brutus AI client wrapper (`lib/ai/brutus.ts`, server-only)

- **Task ID**: `AI-002`
- **Epic**: AI Commercial Intelligence
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Brutus AI client wrapper (`lib/ai/brutus.ts`, server-only) with typed request/response + retry
- **Objective**: Build the server-only Brutus AI client — the only module holding the Brutus
  credentials and making HTTP calls to Brutus AI — with typed (Zod) request/response shapes and a
  retry on transient failures, to be driven by the AI-001 job state machine (client fills a job's
  `output` on success, marks it `failed` on error).
- **Business Value**: Brutus AI is the headline differentiator ("AI Commercial Intelligence").
  This wrapper is what actually produces qualification scores, next-best-actions, and summaries —
  and doing it server-side keeps the credential off the browser and AI latency off the request path.
- **Dependencies**: COMM-002 (per-org Brutus credential via `getDecryptedApiKey(orgId,"brutusAi")`),
  AI-001 (the job lifecycle this client's results feed into), INFRA-001
  (`BRUTUS_AI_API_BASE_URL`/`BRUTUS_AI_API_KEY` validated in `getServerEnv`), INFRA-013 (typed
  errors — soft). Soft: Brutus request/response contract details — model expected shapes as Zod and
  parse at the boundary.
- **Target Files**:
  - `lib/ai/brutus.ts` (new — the client, `server-only`)
  - `lib/ai/types.ts` (new — Zod request/response schemas)
  - `lib/ai/index.ts` (new — barrel export)
  - `services/ai-jobs.ts` (extend — invoke the client during the `running` transition)
- **Technical Instructions**:
  1. Import `server-only`. Read `BRUTUS_AI_API_BASE_URL` from `getServerEnv()` and the key from
     COMM-002's `getDecryptedApiKey(orgId, "brutusAi")` (falling back to `BRUTUS_AI_API_KEY` for
     dev). The key never reaches a Client Component or a log.
  2. Provide typed methods for the AI capabilities in [../../integrations.md](../../integrations.md)
     (opportunity qualification scoring, next-best-action, summarization, cross-sell signal) with
     Zod-validated request/response; parse responses at the boundary (no `any`).
  3. Add a bounded retry with backoff for transient failures (timeouts / 5xx) — but keep the fuller
     retry/circuit-breaker generalization to INFRA-016 in Phase 5; here a simple bounded retry is
     enough. A non-transient failure returns a typed error that AI-001's `failJob` records.
  4. Wire into `services/ai-jobs.ts`: on `markRunning`, call the Brutus client; on success
     `completeJob` with the parsed `output`; on failure `failJob` with the `error`. Never block the
     original enqueue Server Action on this (fire-and-forget or a background Route Handler per
     [../../integrations.md](../../integrations.md)).
- **Acceptance Criteria**:
  - `lib/ai/brutus.ts` is the only module referencing the Brutus base URL/key, imports
    `server-only`, and fails the build if imported client-side.
  - Each method has Zod-typed request/response; a malformed response is rejected by Zod (not passed
    through as `any`).
  - A transient failure is retried with backoff; a persistent failure marks the driving `aiJobs`
    document `failed` with an `error` (never silently dropped).
  - A successful call writes a parsed `output` onto the job (`completed`), observable by a
    polling/subscribing client.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) (Brutus methods implemented vs. TBC) and
        [../../architecture.md](../../architecture.md) (Brutus integration) updated; `lib/README.md`
        notes the client exists
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (Brutus AI
  - async job pattern), [../../architecture.md](../../architecture.md) (Brutus),
    [../../environment.md](../../environment.md), and [../../decisions.md](../../decisions.md)
    (ADR-008) before starting; must update [../../integrations.md](../../integrations.md) and
    [../../architecture.md](../../architecture.md).
- **Testing Notes**: With INFRA-012 landed, unit-test the client against a mocked `fetch`
  (success, transient-retry-then-succeed, persistent-fail, malformed-response) and the
  `services/ai-jobs.ts` integration (job ends `completed`/`failed` correctly). Manual: with a dev
  Brutus key, enqueue a qualification job and watch it complete with a real `output` in the console.
