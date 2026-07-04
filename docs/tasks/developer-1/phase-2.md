# Developer 1 - Phase 2: Platform Services & Security

With the Phase 1 foundation live (real Firebase project, working sign-in + session verification,
finalized core rules), Phase 2 turns that foundation into a shared platform the whole team builds
on: reusable role-based access control helpers, the multi-user org/invite flow, account-recovery
flows, security rules + composite indexes for **every** business subcollection (not just the
Sprint 1 core), a centralized Admin-SDK audit-logging service, the first automated test framework
(closing the R1 gap so later tasks can reference it), and a structured error-handling / logging
utility with a typed Server Action result envelope.

INFRA-012 is the pivot point in this phase: before it, "Testing Notes" mean manual steps only;
after it, tasks may reference the Vitest/Playwright harness it introduces. Confirm each task's
Definition of Ready in [../../sprint-plan.md](../../sprint-plan.md) before starting, and close each
against the project-wide Definition of Done there. Field order follows
[../task-template.md](../task-template.md).

---

### INFRA-007: Role-based access control helpers (`requireRole`, permission matrix) in `lib/auth/`

- **Task ID**: `INFRA-007`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Role-based access control helpers (`requireRole`, permission matrix) in `lib/auth/`
- **Objective**: Provide a single, typed authorization layer in `lib/auth/` - a permission matrix
  keyed by role (`owner`/`admin`/`manager`/`rep`/`viewer`) plus `requireRole(session, roles)` /
  `can(session, action)` helpers - so `services/` and Server Actions enforce the same authorization
  the Firestore rules mirror, without re-implementing role checks per feature.
- **Business Value**: The rules are defense-in-depth; the primary authorization layer is the
  `services/` layer (per [../../firestore-rules.md](../../firestore-rules.md)). This gives every
  developer one place to call for "is this user allowed to do this," keeping authorization
  consistent as CRM features multiply.
- **Dependencies**: INFRA-003 (the verified `Session` type these helpers act on), INFRA-004 (the
  role/permission shape they encode).
- **Target Files**:
  - `lib/auth/rbac.ts` (new - permission matrix + `requireRole` / `can`)
  - `lib/auth/index.ts` (extend barrel export)
  - `schemas/role.ts` or `lib/auth/roles.ts` (new - `RoleSchema = z.enum([...])`, inferred `Role` type)
- **Technical Instructions**:
  1. Define `RoleSchema = z.enum(["owner","admin","manager","rep","viewer"])` and
     `type Role = z.infer<typeof RoleSchema>` - the single source of truth for the role strings,
     reused by rules-adjacent code and the `users/{uid}` schema.
  2. Encode a permission matrix mapping a business action (e.g. `"contract:write"`,
     `"account:write"`, `"settings:write"`, `"auditLog:read"`) to the allowed role set, matching
     the matrix in [../../firestore-rules.md](../../firestore-rules.md) exactly (reps read-only on
     contracts/campaigns/templates; owner/admin only on settings; etc.).
  3. Provide `requireRole(session, roles)` that returns the typed `{ ok:false, error }` result (per
     [../../coding-standards.md](../../coding-standards.md)) or throws only for genuinely
     unexpected states, and `can(session, action)` returning a boolean for UI affordance gating.
  4. Consume the verified `Session` from `lib/auth/session.ts` (INFRA-003); never accept a
     client-supplied role.
- **Acceptance Criteria**:
  - A `rep` session passes `can(session, "account:write")` but fails `can(session, "contract:write")`,
    matching the rules matrix.
  - `requireRole` returns a typed non-throwing failure result for a disallowed role and success for
    an allowed one.
  - The `Role` type is inferred from a Zod enum (no hand-written union) and reused wherever a role
    appears.
  - The permission matrix and the Firestore rules agree for every listed collection (spot-checked
    in review).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../firestore-rules.md](../../firestore-rules.md) cross-references the `lib/auth/` matrix
        as the `services/`-layer counterpart; [../../coding-standards.md](../../coding-standards.md)
        noted if a new convention is introduced
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../firestore-rules.md](../../firestore-rules.md),
  [../../architecture.md](../../architecture.md), and
  [../../coding-standards.md](../../coding-standards.md) before starting; must update
  [../../firestore-rules.md](../../firestore-rules.md).
- **Testing Notes**: INFRA-012 introduces the test framework; if it has landed, add unit tests for
  the matrix (per-role allow/deny per action) - `services/`-layer logic is the highest-priority
  test surface per [../../coding-standards.md](../../coding-standards.md). Until then, manual: call
  `can`/`requireRole` from a throwaway Server Action with a seeded user of each role and confirm the
  allow/deny outcomes.

---

### INFRA-008: Organization + user invite flow (invite, accept, assign role)

- **Task ID**: `INFRA-008`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Organization + user invite flow (invite teammate, accept invite, assign role) - Server Actions + rules
- **Objective**: Let an `owner`/`admin` invite a teammate into their organization, have the invitee
  accept and get a `users/{uid}` document with the assigned role and matching `orgId`, all via
  Admin-SDK Server Actions (since `users` `create` and `role`/`orgId` changes are client-locked by
  the rules).
- **Business Value**: BalloCRM is multi-tenant and role-based; a single bootstrapped owner isn't a
  usable CRM. This is what makes "a team using one org" real, and demonstrates the role model to
  judges (an admin inviting a rep who then sees only what a rep can).
- **Dependencies**: INFRA-005 (a first org/owner to invite from), INFRA-007 (`requireRole` to gate
  who can invite), INFRA-011 (audit-log the role assignment - soft; can log later). Soft:
  invite-acceptance UI is a Developer 2/shell surface but the actions are ownable independently.
- **Target Files**:
  - `actions/invites.ts` (new - `inviteTeammate`, `acceptInvite`, `assignRole` Server Actions)
  - `services/invites.ts` (new - business logic: create invite, resolve on accept, set role)
  - `repositories/invites.ts` (new - Firestore reads/writes for invite records)
  - `schemas/invite.ts` (new - `InviteSchema`, `AssignRoleSchema`)
  - `firestore.rules` (add rules for the invite storage location - see instruction 1)
  - `firestore.indexes.json` (add an index if invites are listed/filtered - see instruction 4)
- **Technical Instructions**:
  1. Store invites as a per-org record (e.g. `organizations/{orgId}/settings/{settingId}` is for
     config - instead use a dedicated invite doc; if a new subcollection is introduced, add it to
     [../../database-schema.md](../../database-schema.md) and `firestore.rules` in the same change,
     read = org member, `create`/`update`/`delete` server-only via Admin SDK).
  2. `inviteTeammate` (gated by `requireRole(session, ["owner","admin"])`) records an invite with
     the invitee email + intended role + `orgId`. Sending the invite email/notification goes
     through BalloAds per [../../integrations.md](../../integrations.md) if a message is sent - never
     a BalloCRM-built mailer.
  3. `acceptInvite` verifies the invite, creates (or links) the Firebase Auth user, and writes
     `users/{uid}` with the assigned `role` and `orgId` via the Admin SDK (this is the only path
     allowed to set `role`/`orgId`, per INFRA-004).
  4. `assignRole` (owner/admin only) updates an existing member's `role` server-side and writes an
     audit log (INFRA-011). If invites are listed in a management UI, add the necessary composite
     index to `firestore.indexes.json` and document it in [../../indexes.md](../../indexes.md).
  5. All actions return the typed result envelope; validate inputs with the Zod schemas.
- **Acceptance Criteria**:
  - An `owner`/`admin` can create an invite; a `rep`/`viewer` calling `inviteTeammate` gets a
    typed permission-denied result.
  - Accepting an invite produces a `users/{uid}` doc with the correct `role` and the inviter's
    `orgId`, and the new user can sign in and see only role-appropriate data.
  - `assignRole` changes a member's role server-side and the change is reflected in their session on
    next sign-in; a client-side attempt to change `role` is still denied by the rules.
  - Any new invite collection is documented in schema + rules and passes the emulator playground.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md),
        [../../firestore-rules.md](../../firestore-rules.md), [../../api.md](../../api.md), and (if
        indexed) [../../indexes.md](../../indexes.md) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: L
- **Estimated Hours**: 6-9
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md),
  [../../firestore-rules.md](../../firestore-rules.md),
  [../../architecture.md](../../architecture.md), and
  [../../integrations.md](../../integrations.md) (for any invite messaging) before starting; must
  update [../../database-schema.md](../../database-schema.md),
  [../../firestore-rules.md](../../firestore-rules.md), and [../../api.md](../../api.md).
- **Testing Notes**: With INFRA-012 landed, add `services/invites.ts` unit tests (role gating,
  role-assignment logic) with the repository mocked. Manual: invite a teammate from the owner
  account created by INFRA-005, accept as a second user, confirm the role and org isolation end to
  end.

---

### INFRA-009: Password reset + email verification flows

- **Task ID**: `INFRA-009`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Password reset + email verification flows
- **Objective**: Wire Firebase Auth's password-reset and email-verification flows into BalloCRM so
  users can recover access and confirm their address, with the app's own routing/redirects and
  action-code handling.
- **Business Value**: A CRM login users can't recover from is a demo liability and a real
  usability gap. Cheap to add on top of Firebase Auth and rounds out a credible auth experience for
  judging.
- **Dependencies**: INFRA-002 (sign-in flow + client SDK auth), INFRA-001 (Auth project with the
  relevant providers/templates). Soft: the reset/verify UI pages are a Developer 2/shell surface;
  the action-code handling and Server Actions are ownable here.
- **Target Files**:
  - `actions/auth.ts` (extend - `requestPasswordReset`, `confirmPasswordReset`,
    `sendEmailVerification` Server Actions)
  - `app/(auth)/reset-password/` and `app/(auth)/verify-email/` route handlers/pages (new - or
    coordinate the UI with Developer 2; action-code resolution logic stays in Developer 1's scope)
  - `config/env.ts` / `.env.example` (only if a new redirect/base-URL key is needed; `NEXT_PUBLIC_APP_URL`
    already exists for building absolute action links)
- **Technical Instructions**:
  1. Use the Firebase client SDK (`firebaseAuth`) for `sendPasswordResetEmail` and
     `sendEmailVerification`; build absolute continue/redirect URLs from `NEXT_PUBLIC_APP_URL` (per
     [../../environment.md](../../environment.md)).
  2. Configure the Firebase console action-code settings / email templates to point back at the
     app's `reset-password` / `verify-email` routes. If BalloAds is used to deliver any custom
     messaging, route it through the BalloAds client per
     [../../integrations.md](../../integrations.md) - do not build a mailer.
  3. Handle the returned `oobCode` on the reset/verify routes (verify code, apply new password /
     mark verified) and redirect to `/login` with a success state.
  4. Wrap Server Actions in the typed result envelope; expected failures (expired/invalid code)
     return `{ ok:false, error }`, never a throw.
- **Acceptance Criteria**:
  - Requesting a reset for a known email sends a reset email; following the link lets the user set a
    new password and sign in with it.
  - An expired/invalid reset or verification code produces a typed error state, not an unhandled
    exception.
  - A newly-created user can trigger and complete email verification, and the verified state is
    reflected in Firebase Auth.
  - No server secret or admin credential is exposed in any client-visible flow.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../api.md](../../api.md) (new auth actions) and, if any redirect/env key changed,
        [../../environment.md](../../environment.md) + `.env.example` updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: S
- **Estimated Hours**: 2-4
- **Documentation References**: Must read [../../architecture.md](../../architecture.md)
  (Authentication), [../../environment.md](../../environment.md), and
  [../../integrations.md](../../integrations.md) before starting; must update
  [../../api.md](../../api.md).
- **Testing Notes**: With INFRA-012 landed, unit-test the action-code result handling (valid /
  expired) with the Firebase SDK mocked. Manual: trigger a reset against a real dev user, complete
  it via the emailed link, sign in with the new password; repeat for email verification.

---

### INFRA-010: Firestore security rules + composite indexes for all business subcollections

- **Task ID**: `INFRA-010`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Firestore security rules + composite indexes for all business subcollections
- **Objective**: Ensure `firestore.rules` and `firestore.indexes.json` fully and correctly cover
  every business subcollection the product will use - `accounts`, `contacts`, `opportunities`,
  `tasks`, `contracts`, `campaigns`, `activities`, `notifications`, `auditLogs`, `aiJobs`,
  `templates`, `analyticsCache`, `settings`, `integrations` - beyond the Sprint 1 core confirmed in
  INFRA-004, so every downstream feature has a matching, pre-deployed rule and index.
- **Business Value**: Developers 2 and 3 shouldn't hit a runtime "missing index" error or an
  authorization gap mid-feature. Landing the complete rule + index set up front removes a recurring
  mid-sprint blocker and keeps the security model coherent as features arrive.
- **Dependencies**: INFRA-004 (extends the confirmed core rules). Soft: exact query patterns for
  later features (opportunities pipeline, campaigns list) come from Developer 3's CRM tasks - index
  shapes are already specified in [../../indexes.md](../../indexes.md), so this can proceed against
  that catalog.
- **Target Files**:
  - `firestore.rules` (complete every subcollection match block)
  - `firestore.indexes.json` (every composite index in the catalog)
- **Technical Instructions**:
  1. Reconcile `firestore.rules` against the full permissions matrix in
     [../../firestore-rules.md](../../firestore-rules.md) - confirm `campaigns` (owner/admin/manager
     write), `templates` (owner/admin/manager write), `settings` (owner/admin write),
     `analyticsCache` (write `false`), and `integrations` (`read, write: if false`) are all present
     and correct, not just the Sprint 1 core.
  2. Reconcile `firestore.indexes.json` against the complete catalog in
     [../../indexes.md](../../indexes.md): `accounts` (`vertical,healthScore` and
     `ownerId,updatedAt`); `opportunities` (`stage,expectedCloseDate`; `accountId,stage`;
     `ownerId,expectedCloseDate`); `activities` (`relatedTo.type,relatedTo.id,occurredAt`); `tasks`
     (`assigneeId,dueDate`; `status,dueDate`); `contracts` (`status,renewalDate`); `campaigns`
     (`status,startDate`); `notifications` (`targetUserId,read,createdAt`); `auditLogs`
     (`actorId,createdAt`); `aiJobs` (`status,createdAt`) - each with the exact field order and
     ASC/DESC directions.
  3. Confirm all indexes are `queryScope: "COLLECTION"` (no `COLLECTION_GROUP`), consistent with the
     multi-tenant model.
  4. Deploy `firebase deploy --only firestore:rules,firestore:indexes` and verify no errors and no
     drift between the catalog docs and the JSON.
- **Acceptance Criteria**:
  - Every subcollection in [../../database-schema.md](../../database-schema.md) has a matching rule
    block consistent with the [../../firestore-rules.md](../../firestore-rules.md) matrix.
  - Every index in the [../../indexes.md](../../indexes.md) catalog exists in
    `firestore.indexes.json` with the exact fields/order/direction; no catalog index is missing and
    no stray index is present.
  - `firebase deploy --only firestore:rules,firestore:indexes` succeeds.
  - Emulator spot-checks confirm representative allowed/denied writes and that the timeline query
    (`relatedTo.type` + `relatedTo.id` + `occurredAt`) runs without an index error.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../firestore-rules.md](../../firestore-rules.md) and [../../indexes.md](../../indexes.md)
        catalogs reconciled with the deployed files
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../firestore-rules.md](../../firestore-rules.md),
  [../../indexes.md](../../indexes.md), and [../../database-schema.md](../../database-schema.md)
  before starting; must update [../../firestore-rules.md](../../firestore-rules.md) and
  [../../indexes.md](../../indexes.md).
- **Testing Notes**: With INFRA-012 landed, its rules-unit harness (Firestore emulator) is the
  right place to assert allow/deny per collection. Until/alongside that, manual emulator playground
  verification per [../../firestore-rules.md](../../firestore-rules.md), plus running each catalog
  query against the emulator to confirm the index satisfies it.

---

### INFRA-011: Centralized audit logging service (Admin SDK writes to `auditLogs`)

- **Task ID**: `INFRA-011`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Centralized audit logging service (Admin SDK writes to `auditLogs`)
- **Objective**: Provide one server-side service that writes compliance-grade entries to
  `organizations/{orgId}/auditLogs/{logId}` via the Admin SDK for sensitive actions (role changes,
  contract deletions, integration credential rotation), matching the immutable, client-write-locked
  design in [../../database-schema.md](../../database-schema.md).
- **Business Value**: An audit trail the actor being audited cannot forge is a real
  enterprise-CRM signal for judges and the correct home for the role-change and credential events
  other Phase 2/3 tasks generate. Centralizing it prevents inconsistent, ad-hoc logging.
- **Dependencies**: INFRA-004 (the `auditLogs` rule: read owner/admin, write `false`), INFRA-003
  (verified session to source `actorId`). Consumed by INFRA-008 (role changes) and COMM-002
  (credential rotation).
- **Target Files**:
  - `services/audit-log.ts` (new - `writeAuditLog(...)` composing the repository)
  - `repositories/audit-logs.ts` (new - the only place that writes the `auditLogs` collection, via
    `firestoreAdmin`)
  - `schemas/audit-log.ts` (new - `AuditLogSchema`)
- **Technical Instructions**:
  1. Define `AuditLogSchema` matching the exact shape in
     [../../database-schema.md](../../database-schema.md): `logId`, `actorId`, `action` (e.g.
     `"role_changed"`, `"contract_deleted"`, `"integration_credential_rotated"`), `targetType`,
     `targetId`, `before`, `after`, `createdAt` (server timestamp).
  2. `writeAuditLog` runs server-only via the Admin SDK (`firestoreAdmin`), takes the verified
     session's `uid` as `actorId` and the `orgId` from the session - never client input.
  3. Keep it append-only: the repository only ever creates; there is no update/delete path
     (matching `allow update, delete: if false` intent and the rules' `write: if false`).
  4. Expose a small, typed API other services call (e.g. `services/invites.ts` on `assignRole`,
     COMM-002 on credential rotation) so audit writes are consistent.
- **Acceptance Criteria**:
  - Calling `writeAuditLog` from a Server Action creates an `auditLogs` doc with the correct
    `actorId`/`orgId`/`before`/`after` and a server `createdAt`.
  - A client SDK attempt to write `auditLogs` is denied (write-locked); reads are limited to
    owner/admin per the rules.
  - The `actorId,createdAt` index supports the per-actor audit view (query runs without an index
    error).
  - `assignRole` (INFRA-008) produces a `role_changed` audit entry when wired.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`auditLogs`) referenced/kept in sync
        and [../../api.md](../../api.md) updated if the service is exposed as a documented surface
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`auditLogs`), [../../firestore-rules.md](../../firestore-rules.md), and
  [../../architecture.md](../../architecture.md) before starting; must update
  [../../database-schema.md](../../database-schema.md) if the shape is refined.
- **Testing Notes**: With INFRA-012 landed, unit-test `services/audit-log.ts` (correct shape,
  server-sourced `actorId`) with the repository mocked. Manual: trigger a role change (INFRA-008),
  confirm the `auditLogs` entry in the console, and confirm a client SDK write is denied in the
  emulator.

---

### INFRA-012: Testing framework setup (Vitest unit + Playwright E2E) + wire a test step into CI

- **Task ID**: `INFRA-012`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Testing framework setup (Vitest unit + Playwright E2E) + wire a test step into CI
- **Objective**: Install and configure the project's first automated test framework - Vitest for
  unit tests (`services/`, `schemas/`, `lib/auth/`) and Playwright for a smoke E2E (sign-in →
  dashboard) - add `test` scripts to `package.json`, and add a test step to the INFRA-006 CI
  workflow, closing the R1 "no test framework" gap in [../../risks.md](../../risks.md).
- **Business Value**: Until this lands, the only quality gate is lint/typecheck/build and manual
  clicking. A minimal automated suite catches regressions in the highest-value logic (auth, RBAC,
  services) and lets every task after this one reference real tests instead of manual-only steps.
- **Dependencies**: INFRA-006 (the CI workflow the test step is added to). Soft: benefits from
  having a few real `services/`/`lib/auth/` modules to test (INFRA-003/007/011), but the harness
  itself can land first.
- **Target Files**:
  - `package.json` (add `test`, `test:watch`, `test:e2e` scripts + dev dependencies)
  - `vitest.config.ts` (new)
  - `playwright.config.ts` (new)
  - `.github/workflows/ci.yml` (add a test step after typecheck/build)
  - `lib/auth/*.test.ts`, `services/*.test.ts` (new - first colocated unit tests, per the
    colocation convention in [../../coding-standards.md](../../coding-standards.md))
  - `e2e/` (new - first Playwright smoke spec)
- **Technical Instructions**:
  1. Install Vitest (with the React/TS transform the project needs) and Playwright as dev
     dependencies; add `test` (Vitest run), `test:watch`, and `test:e2e` (Playwright) scripts.
  2. Colocate `*.test.ts` next to source (not a parallel `__tests__` tree) and prioritize
     `services/` + `schemas/` + `lib/auth/` per [../../coding-standards.md](../../coding-standards.md);
     write at least one real unit test (e.g. the INFRA-007 permission matrix) to prove the harness.
  3. Add a Playwright smoke test for the critical path (visit `/login`, sign in with a seeded user,
     land on the dashboard) - can run against the Firebase emulator to avoid touching a real
     project.
  4. Add `- npm run test` (and optionally the E2E step) to `.github/workflows/ci.yml` after build;
     ensure it runs in CI without real secrets (use the emulator / dummy env).
  5. Update the docs that currently say "no test framework is installed" so they no longer claim
     that, and note the chosen framework in [../../decisions.md](../../decisions.md).
- **Acceptance Criteria**:
  - `npm run test` runs Vitest and passes with at least one meaningful unit test present.
  - `npm run test:e2e` runs the Playwright sign-in smoke test successfully (against the emulator).
  - CI runs the test step on every PR and a failing test blocks merge.
  - The "no test framework" claim is removed/updated in the relevant docs and an ADR records the
    choice.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../coding-standards.md](../../coding-standards.md) (Testing),
        [../../tech-stack.md](../../tech-stack.md) ("Not yet set up"),
        [../../risks.md](../../risks.md) (R1), and [../../decisions.md](../../decisions.md) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: L
- **Estimated Hours**: 5-8
- **Documentation References**: Must read [../../coding-standards.md](../../coding-standards.md)
  (Testing), [../../tech-stack.md](../../tech-stack.md), [../../risks.md](../../risks.md), and
  [../../deployment.md](../../deployment.md) (CI) before starting; must update all four plus
  [../../decisions.md](../../decisions.md).
- **Testing Notes**: This task **is** the testing framework - verification is self-referential: the
  suite must actually run locally (`npm run test`, `npm run test:e2e`) and in CI. From here on,
  other tasks' Testing Notes may reference this harness instead of manual-only steps.

---

### INFRA-013: Server error handling + structured logging utility (`lib/errors`, typed Server Action result envelope)

- **Task ID**: `INFRA-013`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Server error handling + structured logging utility (`lib/errors`, typed Server Action result envelope)
- **Objective**: Provide the shared, typed Server Action result envelope
  (`{ ok: true, data } | { ok: false, error }`) and a structured server-side logging utility so
  every action/service handles expected vs. unexpected errors consistently, per
  [../../coding-standards.md](../../coding-standards.md) and the result-shape contract in
  [../../api.md](../../api.md).
- **Business Value**: Consistent error handling is what keeps a fast-moving, three-developer
  codebase debuggable - expected failures surface as toasts/inline errors, unexpected ones hit the
  `error.tsx` boundary, and structured logs make a demo-time bug traceable. Everyone else builds on
  this contract.
- **Dependencies**: none hard (the pattern is referenced by INFRA-002 onward). Soft: ideally lands
  early so all Phase 2/3 actions adopt it; realistically formalized here once the pattern has a few
  users.
- **Target Files**:
  - `lib/errors/index.ts` (new - `Result<T>` type, `ok()`/`err()` constructors, typed error codes)
  - `lib/errors/logger.ts` (new - structured server logger honoring a `LOG_LEVEL` env)
  - `config/env.ts` / `.env.example` (add `LOG_LEVEL` to `serverEnvSchema` - currently documented in
    [../../environment.md](../../environment.md) but not yet in the schema)
  - `types/` (only if a shared ambient type is needed; otherwise `n/a`)
- **Technical Instructions**:
  1. Define the canonical `Result<T>` (`type Result<T> = { ok: true; data: T } | { ok: false; error: AppError }`)
     and helper constructors, matching the shape already described in [../../api.md](../../api.md);
     type error codes as a Zod enum / string-literal union (no `any`).
  2. Distinguish expected errors (validation, not-found, business-rule, permission - returned as
     `{ ok:false }`) from unexpected ones (throw, let `error.tsx` catch), per
     [../../coding-standards.md](../../coding-standards.md) error-handling rules.
  3. Add a structured logger that emits leveled JSON logs and reads `LOG_LEVEL` (add it to
     `serverEnvSchema` in `config/env.ts` + keep `.env.example` in sync - the var is already
     documented in [../../environment.md](../../environment.md)). Never log secrets or full
     credential values.
  4. Refactor existing auth actions (INFRA-002/009) to import the shared `Result`/constructors
     rather than inlining the shape, and note the utility as the standard in
     [../../coding-standards.md](../../coding-standards.md).
- **Acceptance Criteria**:
  - Server Actions across the codebase import one shared `Result<T>` and `ok()`/`err()` rather than
    re-declaring the shape.
  - An expected failure returns `{ ok:false, error }` with a typed code; an unexpected throw
    surfaces at the nearest `error.tsx` boundary rather than being swallowed.
  - `LOG_LEVEL` is validated by `getServerEnv()` and controls logger verbosity; logs contain no
    secrets.
  - Type-level: consuming code can `if (result.ok)` narrow to `data` with no casts.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../api.md](../../api.md) (result envelope), [../../coding-standards.md](../../coding-standards.md)
        (error handling), and [../../environment.md](../../environment.md) + `.env.example`
        (`LOG_LEVEL`) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../coding-standards.md](../../coding-standards.md)
  (Error handling), [../../api.md](../../api.md), and
  [../../environment.md](../../environment.md) before starting; must update all three plus
  `.env.example`.
- **Testing Notes**: With INFRA-012 landed, unit-test the `ok()`/`err()` constructors and type
  narrowing, and the logger's level filtering. Manual: force an expected error in an action and
  confirm the toast/inline path; force an unexpected throw and confirm the `error.tsx` boundary
  renders.
