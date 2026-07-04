# Developer 1 - Phase 5: Hardening & Scale

Phase 5 is the "make it production-credible" pass over everything Developer 1 built in Phases 1-3.
Nothing here adds a new user-facing feature; each task strengthens resilience, security, cost, or
deploy discipline. These are generally P2/P3 - pick them up once the core product demos cleanly.
They matter for the pitch (a judge asking "what happens when BalloAds is down?" or "how do you keep
prod data clean?" has a real answer) and for any life beyond the hackathon.

Every task here assumes the INFRA-012 test framework exists, so Testing Notes reference automated
tests where useful. Confirm each task's Definition of Ready in
[../../sprint-plan.md](../../sprint-plan.md); close against the project-wide Definition of Done
there. Field order follows [../task-template.md](../task-template.md).

---

### INFRA-015: API rate limiting / abuse guard on Server Actions

- **Task ID**: `INFRA-015`
- **Epic**: Infrastructure & Auth
- **Priority**: P2
- **Owner**: Developer 1
- **Title**: API rate limiting / abuse guard on Server Actions
- **Objective**: Add a per-user / per-org rate-limiting guard to sensitive Server Actions (sign-in,
  invite, integration connect/rotate, AI job enqueue) so a buggy client or a malicious actor can't
  hammer auth or spend AI/BalloAds budget unbounded.
- **Business Value**: Protects the auth surface from brute-force and the paid integration surfaces
  (Brutus AI, BalloAds) from runaway cost - a concrete answer to "how do you stop abuse?" and cheap
  insurance during a live demo where a retry loop could otherwise rack up calls.
- **Dependencies**: INFRA-003 (verified session to key limits per `uid`/`orgId`), INFRA-013 (typed
  error to return on limit exceeded). Soft: AI-001/COMM-001 (the AI/BalloAds actions worth
  guarding) - the guard can wrap them as they land.
- **Target Files**:
  - `lib/rate-limit/index.ts` (new - a reusable limiter, `server-only`)
  - `actions/auth.ts`, `actions/invites.ts`, `actions/integrations.ts`, `services/ai-jobs.ts`
    (apply the guard at the entry points)
  - `config/env.ts` / `.env.example` (only if a backing store / limit config env is introduced)
- **Technical Instructions**:
  1. Implement a token-bucket / fixed-window limiter keyed by verified `uid` (and/or `orgId`) -
     for hackathon scale an in-memory or Firestore-backed counter is acceptable; document the
     choice and its single-instance caveat in [../../decisions.md](../../decisions.md).
  2. Apply it at the top of the sensitive Server Actions: sign-in (per-IP/email), invite, integration
     connect/rotate, and AI job enqueue. On exceed, return the typed `{ ok:false, error }` envelope
     (INFRA-013) with a clear code - never throw for the expected "rate limited" case.
  3. Choose sane limits (documented), and ensure the guard reads its identity from the verified
     session, never client input.
- **Acceptance Criteria**:
  - Exceeding the limit on a guarded action returns a typed rate-limit error (not a throw, not a
    silent success), and normal usage is unaffected.
  - Limits are keyed to the verified `uid`/`orgId` (a different user isn't throttled by another's
    activity).
  - AI-enqueue and integration actions cannot be called in an unbounded loop past the limit.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../decisions.md](../../decisions.md) (limiter choice + caveats),
        [../../api.md](../../api.md) (rate-limit error code), and (if an env was added)
        [../../environment.md](../../environment.md) + `.env.example` updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../architecture.md](../../architecture.md) (Server
  Actions), [../../coding-standards.md](../../coding-standards.md) (error handling), and
  [../../risks.md](../../risks.md) before starting; must update
  [../../decisions.md](../../decisions.md) and [../../api.md](../../api.md).
- **Testing Notes**: Unit-test the limiter (allows N, blocks N+1, resets after window) with time
  mocked, using the INFRA-012 harness. Manual: fire a guarded action past the limit and confirm the
  typed rate-limit response.

---

### INFRA-016: Retry/backoff + circuit-breaker wrapper for all Developer Portal calls

- **Task ID**: `INFRA-016`
- **Epic**: Infrastructure & Auth
- **Priority**: P2
- **Owner**: Developer 1
- **Title**: Retry/backoff + circuit-breaker wrapper for all Developer Portal (BalloAds/Brutus) calls
- **Objective**: Generalize the ad-hoc retry in AI-002 into one reusable resilience wrapper (retry
  with exponential backoff + a circuit breaker) applied to every outbound call in `lib/balloads/`
  and `lib/ai/`, so a slow or down external dependency degrades gracefully instead of hanging the
  server or spamming a failing endpoint.
- **Business Value**: BalloCRM is fully dependent on BalloAds/Brutus availability (an
  external-dependency risk in [../../risks.md](../../risks.md)). A circuit breaker is the concrete
  answer to "what happens when BalloAds is down?" - the app fails fast and recovers, rather than
  compounding an outage.
- **Dependencies**: COMM-001 (BalloAds client), AI-002 (Brutus client - replaces its local retry),
  INFRA-013 (typed error envelope). Soft: none.
- **Target Files**:
  - `lib/resilience/index.ts` (new - `withRetry` + `CircuitBreaker`, `server-only`)
  - `lib/balloads/client.ts`, `lib/ai/brutus.ts` (wrap outbound calls; AI-002's inline retry is
    removed in favor of this)
- **Technical Instructions**:
  1. Implement `withRetry(fn, opts)` (bounded attempts, exponential backoff + jitter, only on
     transient/idempotent failures) and a `CircuitBreaker` (open after N consecutive failures,
     half-open probe, close on success) in `lib/resilience/`.
  2. Wrap every outbound method in `lib/balloads/client.ts` and `lib/ai/brutus.ts`; be careful to
     retry only idempotent reads freely and to treat non-idempotent sends (BalloAds trigger)
     conservatively to avoid duplicate messages.
  3. When the breaker is open, return a typed error immediately (INFRA-013) so callers/jobs
     (`failJob`) handle it cleanly rather than blocking.
  4. Emit structured logs (INFRA-013 logger) on retry/open/close events for demo-time observability.
- **Acceptance Criteria**:
  - A transient failure is retried with backoff and succeeds; a persistent failure trips the breaker
    and subsequent calls fail fast with a typed error until the half-open probe succeeds.
  - Non-idempotent BalloAds sends are not blindly retried in a way that could duplicate a message.
  - AI-002's local retry is removed and now uses this shared wrapper (no duplicate retry logic).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) (resilience behavior) and
        [../../risks.md](../../risks.md) (external-dependency mitigation) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../integrations.md](../../integrations.md),
  [../../risks.md](../../risks.md), and [../../architecture.md](../../architecture.md) before
  starting; must update [../../integrations.md](../../integrations.md) and
  [../../risks.md](../../risks.md).
- **Testing Notes**: Unit-test `withRetry` (retries transient, gives up after N) and `CircuitBreaker`
  (opens/half-opens/closes) with time + `fetch` mocked, via the INFRA-012 harness. Manual: point a
  client at an intentionally-failing endpoint and observe fail-fast behavior + recovery in logs.

---

### INFRA-017: Firestore index & query cost review at scale

- **Task ID**: `INFRA-017`
- **Epic**: Infrastructure & Auth
- **Priority**: P3
- **Owner**: Developer 1
- **Title**: Firestore index & query cost review at scale (audit `firestore.indexes.json` against actual query patterns)
- **Objective**: Audit the deployed `firestore.indexes.json` against the queries the code actually
  runs - removing unused indexes, confirming every real query has a matching index, and flagging
  costly patterns - per the index-proliferation caution in [../../indexes.md](../../indexes.md).
- **Business Value**: Every composite index costs storage and slows writes; an index nobody queries
  is pure overhead. A clean, justified index set keeps write latency and Firestore cost down as the
  CRM grows - a credible "we thought about scale" point for judges.
- **Dependencies**: INFRA-010 (the full index set to audit), plus the CRM feature tasks (Developers
  2/3) whose queries the audit checks against. Soft: best done after the feature set has stabilized.
- **Target Files**:
  - `firestore.indexes.json` (remove/adjust entries per findings)
  - `docs/indexes.md` (update the catalog + rationale)
- **Technical Instructions**:
  1. Enumerate every Firestore query in `repositories/` (the only layer allowed to query, per
     ADR-002) and map each to the index that satisfies it, using the catalog in
     [../../indexes.md](../../indexes.md) as the baseline.
  2. Flag any query with no matching index (would fail at runtime) and any index with no matching
     query (dead weight - remove it via `firebase deploy --only firestore:indexes`).
  3. Apply the [../../indexes.md](../../indexes.md) guidance: prefer reusing an existing index +
     small client-side filter over minting a near-duplicate; watch ASC/DESC reverse-sort
     duplication. Confirm all indexes remain `queryScope: "COLLECTION"`.
  4. Update the [../../indexes.md](../../indexes.md) catalog to match the final JSON exactly.
- **Acceptance Criteria**:
  - Every `repositories/` query maps to exactly one satisfying index; no query is left unindexed.
  - No index remains in `firestore.indexes.json` without a query that uses it.
  - The [../../indexes.md](../../indexes.md) catalog matches the deployed file with no drift.
  - `firebase deploy --only firestore:indexes` succeeds after changes.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../indexes.md](../../indexes.md) catalog reconciled; findings summarized in the PR
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: S
- **Estimated Hours**: 2-4
- **Documentation References**: Must read [../../indexes.md](../../indexes.md),
  [../../database-schema.md](../../database-schema.md), and
  [../../architecture.md](../../architecture.md) (repository layer) before starting; must update
  [../../indexes.md](../../indexes.md).
- **Testing Notes**: With INFRA-012's emulator harness, run each catalogued query against the
  emulator to confirm its index satisfies it. Manual: grep `repositories/` for query builders and
  reconcile each against the JSON.

---

### INFRA-018: Security hardening pass

- **Task ID**: `INFRA-018`
- **Epic**: Infrastructure & Auth
- **Priority**: P2
- **Owner**: Developer 1
- **Title**: Security hardening pass (rules audit, session/cookie hardening, credential rotation, dependency audit)
- **Objective**: Do a focused security review across the surfaces Developer 1 owns - re-audit
  `firestore.rules` for gaps, harden the `__session` cookie and session lifetime, verify integration
  credential encryption/rotation, and run a dependency vulnerability audit - before the app is
  exposed to real users.
- **Business Value**: Firestore rules and a multi-tenant model raise the stakes of a single
  authorization regression (a risk called out in [../../risks.md](../../risks.md) and ADR-003). A
  deliberate hardening pass is what lets the team credibly claim tenant isolation and credential
  safety to judges or early users.
- **Dependencies**: INFRA-004/INFRA-010 (rules to audit), INFRA-002/INFRA-003 (cookie/session to
  harden), COMM-002 (credential storage/rotation to verify). Soft: best late, once the surface is
  stable.
- **Target Files**:
  - `firestore.rules` (fixes from the audit)
  - `app/api/auth/session/route.ts` / `actions/auth.ts` (cookie flags, session lifetime,
    revocation)
  - `lib/crypto/index.ts` / `services/integrations.ts` (rotation verification)
  - `package.json` / lockfile (dependency updates from `npm audit`)
- **Technical Instructions**:
  1. Re-walk the [../../firestore-rules.md](../../firestore-rules.md) matrix against
     `firestore.rules` for every collection - confirm no write-locked collection (`auditLogs`,
     `aiJobs`, `analyticsCache`, `integrations`) is client-writable, no cross-tenant read is
     possible, and `users` `role`/`orgId` remain self-escalation-proof. Verify in the emulator.
  2. Harden the `__session` cookie: confirm `HttpOnly`, `Secure`, `SameSite`, a sane `expiresIn`,
     and that sign-out revokes refresh tokens (`authAdmin.revokeRefreshTokens`). Verify
     `verifySessionCookie(..., true)` checks revocation (INFRA-003).
  3. Verify integration credential encryption at rest (COMM-002), that a rotation writes an audit
     log (INFRA-011), and that no decrypted key can reach a client payload/log.
  4. Run `npm audit` (and update `eslint-config-prettier`/deps as needed); document residual
     accepted risks in [../../risks.md](../../risks.md).
- **Acceptance Criteria**:
  - Emulator re-audit confirms no cross-tenant read and no client write to any write-locked
    collection; a `users` self-role-change is denied.
  - The `__session` cookie is `HttpOnly`/`Secure`/`SameSite` with a bounded lifetime, and sign-out
    invalidates the session (a revoked cookie fails verification).
  - No plaintext integration credential exists at rest or in any client-visible surface; rotation
    is audit-logged.
  - `npm audit` findings are triaged (fixed or explicitly accepted with rationale).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../firestore-rules.md](../../firestore-rules.md), [../../risks.md](../../risks.md), and
        [../../architecture.md](../../architecture.md) (session hardening) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../firestore-rules.md](../../firestore-rules.md),
  [../../risks.md](../../risks.md), [../../architecture.md](../../architecture.md)
  (Authentication), and [../../integrations.md](../../integrations.md) before starting; must update
  [../../firestore-rules.md](../../firestore-rules.md) and [../../risks.md](../../risks.md).
- **Testing Notes**: Use INFRA-012's rules-unit/emulator harness to assert cross-tenant and
  write-lock denials as regression tests. Manual: attempt a revoked-cookie request (confirm
  rejection), inspect the stored integration doc (confirm ciphertext only), and review `npm audit`
  output.

---

### INFRA-019: Per-environment deployment config

- **Task ID**: `INFRA-019`
- **Epic**: Infrastructure & Auth
- **Priority**: P3
- **Owner**: Developer 1
- **Title**: Per-environment deployment config (separate dev/staging/prod Firebase projects, Vercel env scoping, rules/indexes deploy automation)
- **Objective**: Operationalize the three-environment strategy from
  [../../deployment.md](../../deployment.md) - separate `ballocrm-dev`/`-staging`/`-prod` Firebase
  projects, Vercel env-var scoping (Preview vs. Production), and automated deployment of
  `firestore.rules`/`firestore.indexes.json` per environment - so a Preview deploy can never
  authenticate against or pollute production data.
- **Business Value**: A single shared Firebase project is a realistic hackathon failure mode - a
  stray Preview/local write into prod during a demo rehearsal pollutes real tenant data with no
  clean way to distinguish test from real. Separate projects + scoped env + automated rules deploy
  is what makes the deploy story safe and repeatable.
- **Dependencies**: INFRA-001 (the first Firebase project + env wiring), INFRA-006/INFRA-012 (the CI
  workflow the rules/indexes deploy step can hook into). Soft: none.
- **Target Files**:
  - Firebase console: three projects (`ballocrm-dev`, `ballocrm-staging`, `ballocrm-prod`)
  - Vercel project env settings (Preview → staging creds, Production → prod creds) - configuration,
    not a repo file
  - `.github/workflows/` (new/updated - deploy `firestore:rules,firestore:indexes` to the matching
    project on merge, closing the "Vercel doesn't deploy Firebase config" gap in
    [../../deployment.md](../../deployment.md))
  - `firebase.json` / `.firebaserc` (project aliases for `firebase use`)
- **Technical Instructions**:
  1. Create the three Firebase projects; deploy the same `firestore.rules` + `firestore.indexes.json`
     to each (the security model doesn't change per environment, only the data), per
     [../../deployment.md](../../deployment.md).
  2. Set each environment's `NEXT_PUBLIC_FIREBASE_*` / `FIREBASE_ADMIN_*` (and integration secrets)
     in the matching Vercel scope so a Preview build authenticates against staging, Production
     against prod - never crossed. Keep `.env.example` the source of truth for key names.
  3. Add project aliases (`.firebaserc`) so `firebase use dev|staging|prod` works, and automate
     `firebase deploy --only firestore:rules,firestore:indexes --project <env>` in CI on merge (or a
     documented manual runbook if a CI service account isn't available), since Vercel only ships the
     Next.js app.
  4. Document the full setup + the rules/indexes deploy automation in
     [../../deployment.md](../../deployment.md).
- **Acceptance Criteria**:
  - Three separate Firebase projects exist; a Preview deployment reads/writes staging and Production
    reads/writes prod, verifiably (a write in a Preview does not appear in the prod project).
  - `firebase use dev|staging|prod` selects the right project, and a rules/indexes change deploys to
    the correct environment automatically (or via a documented runbook) on merge.
  - Vercel env vars are scoped per environment with no prod credential in a Preview scope.
  - [../../deployment.md](../../deployment.md) documents the environments, env scoping, and the
    rules/indexes deploy automation.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../deployment.md](../../deployment.md) and [../../environment.md](../../environment.md)
        updated with the per-environment setup
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../deployment.md](../../deployment.md),
  [../../environment.md](../../environment.md), and
  [../../decisions.md](../../decisions.md) (ADR-011 Vercel) before starting; must update
  [../../deployment.md](../../deployment.md) and [../../environment.md](../../environment.md).
- **Testing Notes**: Deployment task - verification is operational: create a record via a Preview
  deployment and confirm it lands in the staging project (not prod); push a rules change and confirm
  it deploys to the matching project. The INFRA-012 CI can gate the rules-deploy step.
