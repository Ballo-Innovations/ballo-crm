# Developer 1 — Phase 1: Foundation

Phase 1 is the root of the whole project's critical path. Nothing else in BalloCRM — the app
shell (Developer 2), Accounts CRUD (Developer 3), AI jobs, analytics — can run against a real
backend or a real user until the tasks below land. This phase stands up the actual Firebase
project behind the already-scaffolded `lib/firebase/client.ts` / `lib/firebase/admin.ts`, wires
Firebase Auth sign-in and the `__session` cookie, adds server-side session verification, finalizes
the multi-tenant Firestore security rules for the `users` + `organizations` role model, provides a
bootstrap script so there is a first org + owner to log in as, and (stretch) adds a minimal CI
gate.

Task order here follows [../developer-1.md](../developer-1.md)'s Sprint 1 table exactly. Before
starting any task, confirm it meets the Definition of Ready in
[../../sprint-plan.md](../../sprint-plan.md); every task closes against the project-wide Definition
of Done in the same file. The template for every field below is
[../task-template.md](../task-template.md).

---

### INFRA-001: Configure Firebase project and wire environment variables

- **Task ID**: `INFRA-001`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Configure Firebase project and wire environment variables
- **Objective**: Stand up the actual Firebase project (Auth + Firestore) behind the
  already-scaffolded `lib/firebase/client.ts` and `lib/firebase/admin.ts`, and populate real
  credentials through `config/env.ts` so every later task (auth, Firestore reads/writes) has a
  working backend to target instead of placeholder env values.
- **Business Value**: Nothing else in the app — login, Accounts CRUD, AI jobs — can run against
  real data until this lands. It is the single hardest blocker for the Sprint 1 demo.
- **Dependencies**: none (this is the root of the critical path — see
  [../../sprint-plan.md](../../sprint-plan.md)).
- **Target Files**:
  - `.env.local` (untracked, created locally from `.env.example`)
  - `.env.example` (add any newly-required key names, no real values)
  - `config/env.ts` (extend the Zod schema only if a new required key is introduced)
  - `firebase.json`, `firestore.rules`, `firestore.indexes.json` (deploy target project ID only —
    do not change rule logic in this task)
- **Technical Instructions**:
  1. Create the Firebase project (or confirm the hackathon-provided one) with Authentication
     (Email/Password + Google provider) and Firestore (production mode, `us-central` or nearest
     region) enabled.
  2. Generate a Web App config for the client SDK and a Service Account key for the Admin SDK;
     populate `.env.local` per the keys already read by `config/env.ts` (`getClientEnv()` /
     `getServerEnv()`) — the six `NEXT_PUBLIC_FIREBASE_*` values plus `FIREBASE_ADMIN_PROJECT_ID`
     / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` escapes literal
     as `lib/firebase/admin.ts` expects). Do not invent new env var names without updating
     `.env.example` and the Zod schema together.
  3. Run `firebase use --add` to bind the CLI to the project and confirm
     `firebase deploy --only firestore:rules,firestore:indexes` succeeds against it.
  4. Verify `lib/firebase/client.ts` and `lib/firebase/admin.ts` both initialize without throwing
     by hitting a throwaway Server Component/Route Handler that calls each.
- **Acceptance Criteria**:
  - A real Firebase project exists with Auth (Email/Password, Google) and Firestore enabled.
  - `.env.example` lists every required key with a placeholder value and a comment on where to
    find it in the Firebase console.
  - `npm run dev` boots with no `config/env.ts` Zod validation errors.
  - `firebase deploy --only firestore:rules,firestore:indexes` completes without error against the
    configured project.
  - A throwaway smoke check (documented in the PR description) confirms both the client and admin
    SDK initialize successfully.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/environment.md` and `docs/deployment.md` updated with the real setup steps taken
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
        (lint/typecheck/build, PR reviewed per [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md),
        `docs/progress.md` + `docs/changelog.md` updated, task moved to `completed.md`)
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../tech-stack.md](../../tech-stack.md) and
  [../../environment.md](../../environment.md) before starting; must update
  [../../environment.md](../../environment.md) and [../../deployment.md](../../deployment.md) as
  part of the same change.
- **Testing Notes**: No automated test framework is installed yet (see
  [../../risks.md](../../risks.md)); the framework arrives in INFRA-012. Manual verification: run
  `npm run dev`, confirm no env validation crash; add a temporary `console.log` in a Server
  Component calling `authAdmin`/`firestoreAdmin` to confirm the Admin SDK connects, then remove it
  before opening the PR.

---

### INFRA-002: Implement Firebase Auth sign-in Server Actions and `__session` cookie issuance

- **Task ID**: `INFRA-002`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Implement Firebase Auth sign-in Server Actions and `__session` cookie issuance
- **Objective**: Provide the server-side sign-in / sign-out surface that turns a Firebase ID token
  (obtained client-side) into an HTTP-only `__session` cookie the rest of the app can trust, and
  clears it on sign-out — the mechanism `middleware.ts` already assumes exists (it checks for the
  `__session` cookie's presence).
- **Business Value**: This is what makes "logging in" actually do something. Developer 2's
  `/login` page has nothing to call and the dashboard gate does nothing useful until these actions
  and the cookie exist. It unblocks the entire authenticated half of the demo.
- **Dependencies**: INFRA-001 (needs a real Firebase Auth project + Admin SDK credentials).
  Soft/coordination: Developer 2's `/login` page UI (SHELL track) consumes these actions, but can
  be built in parallel against the action signatures before they are fully polished.
- **Target Files**:
  - `actions/auth.ts` (new — `signIn` / `signOut` Server Actions, `"use server"`)
  - `app/api/auth/session/route.ts` (new — Route Handler to mint/clear the `__session` cookie from
    a posted ID token; this path is already whitelisted as public in `middleware.ts`)
  - `lib/firebase/admin.ts` (reuse `authAdmin`; no change expected beyond import)
  - `config/site.ts` (only if a post-login redirect path constant needs to live there — otherwise
    `n/a`)
- **Technical Instructions**:
  1. Client-side sign-in happens with the Firebase client SDK (`firebaseAuth` from
     `lib/firebase/client.ts`) on Developer 2's `/login` page, producing a Firebase ID token.
  2. Exchange that ID token for a session cookie server-side: call
     `authAdmin.createSessionCookie(idToken, { expiresIn })` in the Route Handler
     `app/api/auth/session/route.ts` (POST) and set it as an **HTTP-only, Secure, SameSite=Lax**
     cookie named exactly `__session` (the name `middleware.ts` checks). Choose a session lifetime
     (e.g. 5 days) and record it in `docs/architecture.md`.
  3. Expose thin `signIn` / `signOut` Server Actions in `actions/auth.ts` per the layering in
     [../../architecture.md](../../architecture.md) and the result-shape rule in
     [../../coding-standards.md](../../coding-standards.md): validate input with a Zod schema, call
     into the auth flow, and return `{ ok: true, data }` / `{ ok: false, error }` — never throw for
     an expected failure (bad credentials). `signOut` clears the `__session` cookie (set empty /
     expired) and, where relevant, calls `authAdmin.revokeRefreshTokens(uid)`.
  4. Do NOT add token verification to `middleware.ts` — that is INFRA-003 and cannot run on the
     Edge runtime. Middleware stays a presence-only gate.
- **Acceptance Criteria**:
  - Signing in with a valid Firebase user sets an HTTP-only `__session` cookie (verifiable in
    browser devtools → Application → Cookies; the value is not readable from JS).
  - Signing out clears the `__session` cookie and a subsequent request to a protected path
    redirects to `/login`.
  - `signIn` returns `{ ok: false, error }` (not a thrown exception) for wrong-password / unknown-user.
  - `BALLOADS_*` / `BRUTUS_*` / any server secret never appears in the cookie or any client-visible
    payload.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/architecture.md` (Authentication section) and [../../api.md](../../api.md) (the new
        `signIn`/`signOut` actions + the session Route Handler) updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../architecture.md](../../architecture.md)
  (Authentication) and [../../coding-standards.md](../../coding-standards.md) (Server Actions,
  error handling) before starting; must update [../../architecture.md](../../architecture.md) and
  [../../api.md](../../api.md).
- **Testing Notes**: No automated framework until INFRA-012. Manual: create a test user in the
  Firebase console, sign in through a throwaway form (or Developer 2's `/login` once available),
  confirm the `__session` cookie appears; sign out and confirm it is cleared and the dashboard
  redirects to `/login`.

---

### INFRA-003: Build server-side session/token verification helper (`lib/auth/`) for protected Server Components

- **Task ID**: `INFRA-003`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Build server-side session/token verification helper (`lib/auth/`) for protected Server Components
- **Objective**: Provide the one trusted helper every protected Server Component / Server Action
  calls to verify the `__session` cookie is a valid, unexpired Firebase session and resolve it to
  `{ uid, orgId, role }` (by reading `users/{uid}`), since `middleware.ts` only checks cookie
  presence, not validity.
- **Business Value**: Without this there is no real authentication — the middleware redirect is not
  a security boundary. Every screen that shows one org's data (Accounts, dashboard) depends on
  resolving the caller to a verified `uid`/`orgId`, so Developer 3 can stop stubbing the session.
- **Dependencies**: INFRA-002 (a `__session` cookie must exist to verify). Soft: the `users/{uid}`
  document shape from [../../database-schema.md](../../database-schema.md) — the bootstrap script
  (INFRA-005) creates a real one, but this helper can be built against a manually-seeded user doc.
- **Target Files**:
  - `lib/auth/session.ts` (new — `getSession()` / `requireSession()` reading + verifying the cookie)
  - `lib/auth/index.ts` (new — barrel export)
  - `lib/firebase/admin.ts` (reuse `authAdmin`, `firestoreAdmin`)
- **Technical Instructions**:
  1. In `lib/auth/session.ts`, read the `__session` cookie via `next/headers` `cookies()`, and
     verify it with `authAdmin.verifySessionCookie(cookie, true)` (the `true` checks for
     revocation). Return `null` when absent/invalid.
  2. On a valid session, look up `users/{uid}` via `firestoreAdmin` to attach `orgId` and `role`,
     returning a typed `Session = { uid, orgId, role, email }`. Type the return via a Zod schema /
     `z.infer` per [../../coding-standards.md](../../coding-standards.md) — no `any`.
  3. Provide `requireSession()` that returns the session or triggers a redirect to `/login` (via
     `next/navigation` `redirect`) for use at the top of protected Server Components / layouts.
  4. Every `orgId` used by downstream repositories/services must come from this verified session,
     never from client-supplied input — state this in the helper's doc comment (the "why").
  5. Guard the module so it is only ever imported server-side (it transitively imports the
     `server-only`-guarded Admin SDK, which already enforces this).
- **Acceptance Criteria**:
  - A protected Server Component calling `requireSession()` with no/invalid cookie redirects to
    `/login`; with a valid cookie it renders and exposes `{ uid, orgId, role }`.
  - Tampering with the `__session` cookie value causes verification to fail (redirect), proving the
    check is cryptographic, not presence-only.
  - The helper returns a fully-typed session object (no `any`), and `orgId`/`role` reflect the
    signed-in user's `users/{uid}` document.
  - Importing `lib/auth/session.ts` from a Client Component fails the build (via the `server-only`
    transitive guard).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/architecture.md` (Authentication) updated to document `lib/auth/` as the canonical
        server-side verification point
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../architecture.md](../../architecture.md)
  (Authentication), [../../database-schema.md](../../database-schema.md) (`users/{uid}` shape), and
  [../../coding-standards.md](../../coding-standards.md) before starting; must update
  [../../architecture.md](../../architecture.md).
- **Testing Notes**: No automated framework until INFRA-012. Manual: sign in, load a temporary
  protected page that prints `requireSession()`; confirm the correct `uid`/`orgId`/`role`. Edit the
  cookie value in devtools and reload — confirm the redirect. Verify with a signed-out browser.

---

### INFRA-004: Finalize Firestore security rules for `users/{uid}` + `organizations/{orgId}` roles

- **Task ID**: `INFRA-004`
- **Epic**: Infrastructure & Auth
- **Priority**: P0
- **Owner**: Developer 1
- **Title**: Finalize Firestore security rules for `users/{uid}` + `organizations/{orgId}` roles (owner/admin/manager/rep/viewer)
- **Objective**: Confirm and lock the multi-tenant, role-gated security model in `firestore.rules`
  for the core Sprint 1 collections (`users`, `organizations`, and the `accounts`/`contacts`/
  `opportunities`/`tasks`/`contracts`/`activities`/`notifications`/`auditLogs`/`aiJobs`/etc.
  subcollections already stubbed there), so Developer 3 designs Server Actions against a known,
  stable authorization model instead of guessing.
- **Business Value**: The rules are the defense-in-depth backstop behind the `services/` layer and
  the only thing preventing cross-tenant data leakage if a client SDK write ever slips through.
  Landing them early and flagging the rule shape in [../../decisions.md](../../decisions.md) lets
  Developer 3 build safely in parallel.
- **Dependencies**: INFRA-001 (needs a project to deploy rules to). Soft: role list must be
  confirmed against [../../decisions.md](../../decisions.md) before writing rule logic (per the
  Definition of Ready in [../../sprint-plan.md](../../sprint-plan.md)).
- **Target Files**:
  - `firestore.rules` (the org/role model — already scaffolded; this task confirms/finishes it)
  - `firebase.json` (only if the rules file reference needs adjusting — otherwise `n/a`)
- **Technical Instructions**:
  1. Verify the helper functions (`isSignedIn`, `userDoc`, `isOrgMember(orgId)`,
     `hasRole(orgId, roles)`, `isOwnerOrAdmin(orgId)`) match
     [../../firestore-rules.md](../../firestore-rules.md) and enumerate roles explicitly (no
     `role >= manager`-style comparisons).
  2. Confirm the exact per-collection matrix from [../../firestore-rules.md](../../firestore-rules.md):
     `accounts`/`contacts`/`opportunities`/`tasks` write = `["owner","admin","manager","rep"]`;
     `contracts`/`campaigns`/`templates` write = `["owner","admin","manager"]` (reps read-only);
     `activities` create for `["owner","admin","manager","rep"]`, `update`/`delete` = `false`;
     `notifications` gated by `resource.data.targetUserId == request.auth.uid` with a
     `diff().affectedKeys().hasOnly(["read","readAt"])` update; `auditLogs` read = owner/admin,
     write = `false`; `aiJobs`/`analyticsCache` write = `false`, read = org member;
     `integrations` `read, write: if false`.
  3. Confirm the `users/{uid}` rule write-locks `role` and `orgId`
     (`request.resource.data.role == resource.data.role`, same for `orgId`) so membership can't be
     self-escalated client-side; `create`/`delete` = `false`.
  4. Deploy: `firebase deploy --only firestore:rules --project <target>` and verify in the emulator
     playground for at least one document per role across two orgs.
  5. Record the confirmed role/permission shape in [../../decisions.md](../../decisions.md) so
     Developer 3 can design against it.
- **Acceptance Criteria**:
  - `firestore.rules` matches the permissions matrix in
    [../../firestore-rules.md](../../firestore-rules.md) exactly for every listed collection.
  - In the emulator playground: a `rep` can write an `accounts` doc but is denied writing a
    `contracts` doc; a user from org A is denied reading org B's `accounts`; a client write to
    `auditLogs`/`aiJobs`/`integrations` is denied for every role.
  - A `users/{uid}` self-update that changes `role` or `orgId` is denied; a profile-only update is
    allowed.
  - `firebase deploy --only firestore:rules` succeeds against the target project.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../firestore-rules.md](../../firestore-rules.md) and
        [../../decisions.md](../../decisions.md) updated to reflect the confirmed model
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../firestore-rules.md](../../firestore-rules.md),
  [../../database-schema.md](../../database-schema.md), and
  [../../decisions.md](../../decisions.md) before starting; must update
  [../../firestore-rules.md](../../firestore-rules.md) and
  [../../decisions.md](../../decisions.md).
- **Testing Notes**: No automated rules-test harness until INFRA-012 (which adds one). Until then,
  manual verification via the Firebase Emulator Suite (`firebase emulators:start`, UI at
  `http://localhost:4000`): seed one document per role (`owner`/`admin`/`manager`/`rep`/`viewer`)
  across two orgs and confirm both allowed and denied cases in the rules playground, per
  [../../firestore-rules.md](../../firestore-rules.md).

---

### INFRA-005: Bootstrap script — create first organization + owner user for local/demo use

- **Task ID**: `INFRA-005`
- **Epic**: Infrastructure & Auth
- **Priority**: P1
- **Owner**: Developer 1
- **Title**: Bootstrap script — create first organization + owner user for local/demo use
- **Objective**: Provide a repeatable Admin-SDK script that creates the first
  `organizations/{orgId}` document and a matching `users/{uid}` owner (in both Firebase Auth and
  Firestore), since org/user `create` is `false` in the rules and there is otherwise no way to get
  a first account to log in with.
- **Business Value**: Turns an empty Firebase project into a demoable one — without it, nobody can
  sign in and no org-scoped data can be created. It is what makes the Sprint 1 demo reproducible on
  a fresh project.
- **Dependencies**: INFRA-002 (auth flow to sign in as the created user), INFRA-004 (the rules that
  make org/user creation server-only, which is why a script is needed).
- **Target Files**:
  - `scripts/bootstrap-org.ts` (new — Admin SDK script)
  - `package.json` (add a `bootstrap` script entry, e.g. `"bootstrap": "..."` — coordinate so it
    doesn't collide with existing scripts)
  - `.env.local` (reads the same `FIREBASE_ADMIN_*` creds; no new keys)
- **Technical Instructions**:
  1. Using `firebase-admin` (`authAdmin`, `firestoreAdmin` from `lib/firebase/admin.ts`, or a
     standalone Admin init if run outside Next), create a Firebase Auth user (email/password from
     script args or env), then write `organizations/{orgId}` (`orgId`, `name`, `plan`,
     `createdAt`, `updatedAt`) and `users/{uid}` (`uid`, `email`, `displayName`, `orgId`,
     `role: "owner"`, `createdAt`, `updatedAt`) exactly matching the shapes in
     [../../database-schema.md](../../database-schema.md).
  2. Use server timestamps for `createdAt`/`updatedAt` (never client `Date.now()`), per the schema
     naming conventions.
  3. Make it idempotent-ish: if the org/user already exists, print a clear message rather than
     duplicating. Accept args (email, password, org name) with sensible demo defaults.
  4. Document the invocation in `docs/deployment.md` (or `docs/environment.md` local-setup) so the
     team can reproduce it.
- **Acceptance Criteria**:
  - Running the script against a fresh project creates one `organizations/{orgId}` and one
    `users/{uid}` with `role: "owner"` and matching `orgId`, plus a Firebase Auth user.
  - The created credentials can sign in via the INFRA-002 flow and `requireSession()` (INFRA-003)
    resolves them to `{ role: "owner", orgId }`.
  - Re-running the script does not create duplicates (prints an already-exists message).
  - The created documents pass the INFRA-004 rules (e.g. the owner can read their org).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/deployment.md` (or `docs/environment.md`) documents how to run the bootstrap script
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: S
- **Estimated Hours**: 2-3
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`users`/`organizations` shapes) and [../../environment.md](../../environment.md) before
  starting; must update [../../deployment.md](../../deployment.md) or
  [../../environment.md](../../environment.md).
- **Testing Notes**: No automated framework until INFRA-012. Manual: run against a dev project (or
  the emulator), confirm the two documents + Auth user exist in the console, then sign in with the
  created credentials end to end.

---

### INFRA-006: GitHub Actions CI workflow (lint, typecheck, build)

- **Task ID**: `INFRA-006`
- **Epic**: Infrastructure & Auth
- **Priority**: P3 (stretch)
- **Owner**: Developer 1
- **Title**: GitHub Actions CI workflow (lint, typecheck, build)
- **Objective**: Add the first CI workflow that runs `npm ci`, `npm run lint`, `npm run typecheck`,
  and `npm run build` on every PR against `main`, giving a required status check before Vercel's
  Preview build is trusted — closing the "no CI" gap tracked in [../../risks.md](../../risks.md)
  (R1).
- **Business Value**: Prevents a broken PR from silently shipping a broken Preview/Production
  deployment (Vercel deploys regardless of lint/typecheck today). Cheap insurance for a
  three-developer parallel build.
- **Dependencies**: none (works against the existing scripts). Explicitly a stretch goal — pick up
  only after INFRA-001–INFRA-004 are demo-ready per [../developer-1.md](../developer-1.md).
- **Target Files**:
  - `.github/workflows/ci.yml` (new)
- **Technical Instructions**:
  1. Create `.github/workflows/ci.yml` triggered on `pull_request` targeting `main`.
  2. Single job on `ubuntu-latest`: checkout, set up Node (match the version the project builds
     with), `npm ci`, then run in order `npm run lint`, `npm run typecheck`, `npm run build`.
  3. Keep it deliberately minimal — do NOT add a test step yet; no test framework exists until
     INFRA-012 (that task wires the test step in). Do not require secrets for `build` if it can
     compile without live env (or provide dummy/CI-scoped env vars sufficient for `next build`).
  4. Make it a required status check on `main` (branch protection) so a red run blocks merge.
- **Acceptance Criteria**:
  - Opening a PR triggers the workflow, which runs lint, typecheck, and build in order.
  - A PR that fails lint/typecheck/build shows a red required check and cannot be merged.
  - The workflow contains no test step (deferred to INFRA-012) and leaks no real secrets in logs.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] `docs/deployment.md` ("No lint/typecheck/build gate yet" section) updated to reflect that CI
        now exists, and [../../risks.md](../../risks.md) R1 status updated
  - [ ] Project-wide Definition of Done in [../../sprint-plan.md](../../sprint-plan.md) satisfied
- **Estimated Complexity**: S
- **Estimated Hours**: 1-2
- **Documentation References**: Must read [../../deployment.md](../../deployment.md) (CI section)
  and [../../roadmap.md](../../roadmap.md) (Known Gaps) before starting; must update
  [../../deployment.md](../../deployment.md) and [../../risks.md](../../risks.md).
- **Testing Notes**: No app-level tests involved. Verify by opening a throwaway PR that
  deliberately fails typecheck and confirming the check goes red and blocks merge, then a passing
  PR goes green.
