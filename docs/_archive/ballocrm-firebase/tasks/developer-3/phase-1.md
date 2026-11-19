# Phase 1 - Accounts vertical slice

Phase 1 proves the entire `repositories/` → `services/` → `actions/` → `features/*` stack end to
end against Firestore, using **Accounts** as the single vertical slice. This is the Sprint 1
"deployable skeleton" proof point: sign in, see real Firestore data in a list, create a record, and
read it back - the whole layered architecture from [ADR-002](../../decisions.md#adr-002-strict-feature-based-layering--ui--actions--services--repositories--firestore)
exercised once, so every later entity (Contacts, Opportunities, Contracts) is a mechanical copy of
a pattern that already works. CRM-006 scaffolds the Opportunities/Contracts schema shells so Phase 2
can start from the same skeleton without a cold start.

Phase-1 task IDs and titles match the Sprint 1 table in [../developer-3.md](../developer-3.md)
exactly. See [README.md](./README.md#id-reconciliation-note) for how these relate to the IDs in
[../backlog.md](../backlog.md).

---

### CRM-001: Define `Account` Zod schema and Firestore repository (`repositories/accounts.ts`)

- **Task ID**: `CRM-001`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Define the Account Zod schema and Firestore repository
- **Objective**: Define the single source of truth for an Account's shape (`schemas/`) and the only
  module allowed to read/write `organizations/{orgId}/accounts/{accountId}` in Firestore
  (`repositories/accounts.ts`), establishing the exact layering pattern every later entity reuses.
- **Business Value**: This is the data-model foundation for the Sprint 1 demo's proof point ("one
  CRM entity has working Create/Read against Firestore") and the template the whole team copies for
  every subsequent entity - getting the shape and layering right here pays off across the hackathon.
- **Dependencies**: `INFRA-004` (Firestore rules on `accounts`) - **soft**: schema/type work has no
  runtime dependency, and repository functions can be verified against the Firestore emulator or a
  dev project independently of the finalized rules; and `INFRA-001` (real Firebase project) - soft,
  only needed to round-trip against real Firestore rather than types alone.
- **Target Files**:
  - `features/accounts/schemas/account-schema.ts` (new)
  - `repositories/accounts.ts` (new)
- **Technical Instructions**:
  1. In `account-schema.ts`, define `accountSchema` (Zod) matching the canonical
     `organizations/{orgId}/accounts/{accountId}` shape in
     [../../database-schema.md](../../database-schema.md): `accountId` (string), `name` (string,
     `min(1)`), `vertical` (string - full `z.enum` taxonomy is deferred to `VSI-001`; keep it a
     permissive `z.string()` for now so no migration is needed later), `tier`
     (`z.enum(["smb","mid_market","enterprise","strategic"])`), `ownerId` (string),
     `healthScore` (`z.number().min(0).max(100)`, optional - the **externally-supplied BalloAds
     enrichment field** per [../../integrations.md](../../integrations.md), never computed by
     BalloCRM), `healthScoreSource` (`z.literal("balloAds")`, optional), `lifecycleStage`
     (`z.enum(["lead","qualified","onboarding","active_customer","at_risk","renewal","churned"])` -
     the CRM-native **Customer Journey** concept; never name any field `journey`, per the
     naming-collision rule in [../../integrations.md](../../integrations.md) and
     [../../glossary.md](../../glossary.md)), `website` (optional URL), `billingCountry` (optional
     ISO-2 string), `createdAt`, `updatedAt` (ISO-8601 strings at the API boundary per the
     timestamp convention in [../../database-schema.md](../../database-schema.md)).
  2. Export `type Account = z.infer<typeof accountSchema>` - never a hand-written parallel `type`
     ([ADR-009](../../decisions.md#adr-009-zod-as-the-single-source-of-truth-for-data-shapes-with-inferred-typescript-types)).
  3. Add `createAccountInputSchema` that omits server/external-set fields
     (`accountId`, `healthScore`, `healthScoreSource`, `ownerId`, `createdAt`, `updatedAt`) - the
     shape the create form and `createAccount` action validate against in CRM-002/CRM-004.
  4. `repositories/accounts.ts` is the **only** file that imports `firebase-admin/firestore` for
     accounts (via `lib/firebase/admin.ts` - repository access is server-side; do **not** import the
     client SDK). Export plain functions taking/returning `Account`-typed data:
     `createAccount(orgId, input)`, `getAccountById(orgId, accountId)`,
     `listAccounts(orgId, { limit, cursor })`. Parse every Firestore read back through
     `accountSchema` before returning. No business rules and no referential-integrity checks here -
     those live in CRM-002's service.
  5. Every function is org-scoped by an `orgId` parameter supplied by the caller; `orgId` is never
     inferred inside the repository.
- **Acceptance Criteria**:
  - `accountSchema` and `createAccountInputSchema` exist, contain no `any`, and cover exactly the
    fields listed above with the enum values named.
  - `repositories/accounts.ts` exports `createAccount`, `getAccountById`, `listAccounts`, each
    parsing Firestore data through `accountSchema` before returning it.
  - No file outside `repositories/` imports `firebase-admin/firestore` for accounts.
  - Repository functions are org-scoped strictly by their `orgId` parameter.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) `accounts` section confirmed to match
        the shipped schema (fix whichever drifts, per its "do not let them drift" rule)
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../architecture.md](../../architecture.md) §2
  (layering), [../../database-schema.md](../../database-schema.md) (`accounts`), and
  [../../glossary.md](../../glossary.md) (Customer Journey vs. BalloAds Journey) before starting;
  must update [../../database-schema.md](../../database-schema.md) in the same change if the shape
  differs.
- **Testing Notes**: No test framework installed yet (arrives via `INFRA-012` - see
  [../../risks.md](../../risks.md)). Manual verification: write a throwaway Route Handler or script
  that calls `createAccount` then `getAccountById`/`listAccounts` against the Firestore emulator (or
  a dev project once `INFRA-001` lands), confirm the round-tripped document parses cleanly through
  `accountSchema`, then delete the throwaway code before opening the PR.

---

### CRM-002: Accounts service + Server Actions - `createAccount`, `listAccounts`

- **Task ID**: `CRM-002`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Implement the Accounts service and the `createAccount` / `listAccounts` Server Actions
- **Objective**: Add the business-logic layer between the repository and the UI - validating input,
  deriving `orgId`/`ownerId` from the verified session (never client input), and exposing the two
  thin Server Actions the Accounts list and create form call into.
- **Business Value**: This is the write + read spine of the Sprint 1 "Accounts CRUD proving the
  stack end to end" proof point; without it the UI has nothing to call.
- **Dependencies**: `CRM-001`; `INFRA-003` (session helper for `orgId`/`uid`) - **soft**: until it
  lands, derive `orgId`/`ownerId` from a hardcoded dev constant marked
  `// TODO(INFRA-003): replace with requireCurrentUser()`, swapped in one small change later.
- **Target Files**:
  - `services/accounts.ts` (new)
  - `features/accounts/actions/create-account.ts` (new)
  - `features/accounts/actions/list-accounts.ts` (new)
- **Technical Instructions**:
  1. `services/accounts.ts` exports `createAccountForOrg(orgId, ownerId, input)`: validates `input`
     against `createAccountInputSchema`, applies any business rules (e.g. reject a duplicate account
     `name` within the org - a referential/uniqueness check the DB can't enforce, per the "no joins"
     note in [../../database-schema.md](../../database-schema.md)), then calls the repository's
     `createAccount`. Also export `listAccountsForOrg(orgId, opts)` wrapping the repository's
     `listAccounts`. Default new accounts to `lifecycleStage: "lead"`.
  2. `create-account.ts` is a `"use server"` action: calls `requireCurrentUser()` (`INFRA-003`) to
     get `{ uid, orgId }`, parses `FormData` with `createAccountInputSchema`, calls
     `createAccountForOrg(orgId, uid, input)`, and returns `{ ok: true, data } | { ok: false,
error }` per the shared result convention in [../../coding-standards.md](../../coding-standards.md)
     - **never throws for an expected error** (validation, duplicate).
  3. `list-accounts.ts` is a `"use server"` action wrapping `listAccountsForOrg`, scoped to the
     session `orgId`. Use the `ownerId ASC, updatedAt DESC` composite index
     ([../../indexes.md](../../indexes.md)) when scoping to "my accounts".
  4. `revalidatePath("/accounts")` on successful create so CRM-003's list reflects the new record.
  5. Actions contain no Firestore calls and no business rules - those live in the service/repository
     ([../../architecture.md](../../architecture.md) §2).
- **Acceptance Criteria**:
  - `createAccount` with valid `FormData` writes a doc under the caller's `orgId` and returns
    `{ ok: true, data }`; with invalid input (empty `name`) it returns `{ ok: false, error }` and
    writes nothing.
  - A duplicate `name` within the same org is rejected by the service with `{ ok: false, error }`.
  - `orgId` and `ownerId` are always derived server-side from the verified session, never accepted
    as form fields.
  - `listAccounts` returns only the caller's org's accounts.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../api.md](../../api.md) updated with the `createAccount` / `listAccounts` action entries
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../architecture.md](../../architecture.md) §2-3 and
  [../../coding-standards.md](../../coding-standards.md) (Server Action result shape) before
  starting; must update [../../api.md](../../api.md) in the same change.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: submit valid and
  invalid `FormData` from a throwaway form, plus a duplicate-name payload, and confirm Firestore
  writes and `{ ok }` shapes match the acceptance criteria.

---

### CRM-003: Accounts list view (table of accounts, empty state)

- **Task ID**: `CRM-003`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Build the `/accounts` list view reading from Firestore
- **Objective**: Build the read half of the Sprint 1 proof point - a real page at `/accounts`
  listing every Account in the caller's org in a table, with a proper empty state, backed by the
  `listAccounts` action and a TanStack Query hook.
- **Business Value**: This is the page a judge sees to confirm the stack works end to end: sign in,
  see the shell, see real Firestore data rendered in a table.
- **Dependencies**: `CRM-002`; `SHELL-004` (shared `DataTable` primitive) and `SHELL-002`
  (dashboard shell) - **soft**: build against the raw `components/ui/table.tsx` primitive and a
  standalone `app/accounts/page.tsx` first, then re-parent under `app/(dashboard)/accounts/page.tsx`
  and swap in `DataTable` once the shell/table land (tracked as a DoD follow-up below).
- **Target Files**:
  - `features/accounts/hooks/use-accounts.ts` (new)
  - `features/accounts/components/accounts-table.tsx` (new)
  - `features/accounts/components/accounts-empty-state.tsx` (new)
  - `app/accounts/page.tsx` (new - temporary location, re-parented later)
- **Technical Instructions**:
  1. `use-accounts.ts` is a TanStack Query hook (`useQuery`) calling `list-accounts.ts`, keyed
     `["accounts", orgId]` per the query-key convention in
     [../../coding-standards.md](../../coding-standards.md), invalidated by CRM-002's create success.
  2. `accounts-table.tsx` renders columns: `name`, `vertical` (as a `badge.tsx` tag), `tier`,
     `healthScore` (a badge/ring, read-only - labeled as BalloAds-sourced per CRM-050),
     `lifecycleStage`, and owner. Use `components/shared/data-table.tsx` (`SHELL-004`) once it
     lands; until then render against `components/ui/table.tsx` directly.
  3. `accounts-empty-state.tsx` renders a friendly zero-state ("No accounts yet - create your
     first") with a call to the CRM-004 create dialog.
  4. `app/accounts/page.tsx` is a Server Component that prefetches the list (TanStack Query
     server-prefetch + `HydrationBoundary`) and renders the table; render standalone (no shell)
     until `SHELL-002` lands.
- **Acceptance Criteria**:
  - `/accounts` renders every Account belonging to the signed-in user's `orgId`, and none from any
    other org.
  - Creating an account (CRM-004) updates this list without a manual reload.
  - Loading, empty (brand-new org, zero accounts), and populated states each render correctly.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) `/accounts` row updated to reflect the shipped list
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Follow-up logged (here or in [../backlog.md](../backlog.md)) to re-parent
        `app/accounts/page.tsx` under `app/(dashboard)/` and swap in `DataTable` once
        `SHELL-002`/`SHELL-004` merge
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: Must read [../../architecture.md](../../architecture.md) §3 (Server
  Components vs. Client Components), [../../coding-standards.md](../../coding-standards.md)
  (Queries), and [../../routes.md](../../routes.md) before starting; must update
  [../../routes.md](../../routes.md) in the same change.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: sign in as two
  different orgs, confirm each only ever sees its own accounts; create several accounts and confirm
  list correctness; throttle the network in devtools to confirm the loading state; verify the empty
  state on a fresh org.

---

### CRM-004: Account create form (React Hook Form + Zod resolver, dialog or route)

- **Task ID**: `CRM-004`
- **Epic**: Accounts
- **Priority**: P0
- **Owner**: Developer 3
- **Title**: Build the Create Account form wired to the `createAccount` action
- **Objective**: Give users a UI entry point to CRM-002's `createAccount` action - a dialog form on
  `/accounts` using React Hook Form + the Zod resolver against the same `createAccountInputSchema`
  the server validates with.
- **Business Value**: Completes the "Create" half of "Accounts has working Create/Read"; without it
  the demo has no way to add data live.
- **Dependencies**: `CRM-002`, `CRM-003`.
- **Target Files**:
  - `features/accounts/components/create-account-dialog.tsx` (new)
  - `features/accounts/components/create-account-form.tsx` (new)
- **Technical Instructions**:
  1. `create-account-dialog.tsx` uses `components/ui/dialog.tsx`, opened by a "New Account" button
     in the list toolbar/page header.
  2. `create-account-form.tsx` uses `react-hook-form` + `@hookform/resolvers/zod` against
     `createAccountInputSchema` (CRM-001), rendered with `components/ui/field.tsx` primitives
     (`FieldSet`/`FieldGroup`/`FieldLabel`/`FieldError`) - this shadcn version has no legacy
     `Form`/`FormField` wrapper, per [../../coding-standards.md](../../coding-standards.md) (Forms).
     Fields: `name` (required), `vertical`, `tier` (select), `website`, `billingCountry`,
     `lifecycleStage` (select). **One schema, two uses** - same schema for the resolver and the
     server action, never two copies.
  3. On submit, call `create-account.ts`; on `{ ok: true }` close the dialog and show a `sonner`
     success toast; on `{ ok: false, error }` surface the error inline (map field errors where the
     error identifies a field, e.g. duplicate `name`).
- **Acceptance Criteria**:
  - Clicking "New Account" opens a dialog with a validated form.
  - Valid data creates the account, closes the dialog, shows a success toast, and the new row
    appears in the list (via CRM-003's invalidation) without a manual refresh.
  - Invalid data (empty required field) shows inline validation errors and does not call the server
    action; a server-side duplicate rejection surfaces on the `name` field without closing the
    dialog.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) `/accounts` capabilities updated if changed
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../coding-standards.md](../../coding-standards.md)
  (Forms, Error handling) before starting; update [../../routes.md](../../routes.md) if the page's
  documented capabilities change.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: full create flow from
  empty list to populated, the empty-required-field path, and a simulated server error (temporarily
  throw in the action) to confirm the error surfaces and the dialog does not silently close.

---

### CRM-005: Account detail view (read-only, single record)

- **Task ID**: `CRM-005`
- **Epic**: Accounts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the read-only Account detail view at `/accounts/[id]`
- **Objective**: Render a single Account's record read-only at `/accounts/[id]` - profile fields,
  vertical/tier, owner, and the BalloAds health score - proving the single-record read path. (The
  `activities`-backed timeline is a separate task, **CRM-009** - see
  [README.md](./README.md#id-reconciliation-note).)
- **Business Value**: Gives the demo a "drill into one account" moment and establishes the detail
  layout every other entity's detail page reuses.
- **Dependencies**: `CRM-002` (needs a `getAccount` read path); `SHELL-005`/`SHELL-013` (page
  header + detail card/tab layout primitives) - **soft**: build against raw `components/ui/card.tsx`
  first, then swap in the shared layout.
- **Target Files**:
  - `features/accounts/actions/get-account.ts` (new)
  - `features/accounts/components/account-detail.tsx` (new)
  - `app/accounts/[id]/page.tsx` (new - temporary location, re-parented under `app/(dashboard)/`
    with CRM-003)
- **Technical Instructions**:
  1. `get-account.ts` is a `"use server"` action wrapping the repository's `getAccountById`, scoped
     to the session `orgId`; returns `{ ok: false, error }` (not a throw) when the account is
     missing or belongs to another org.
  2. `account-detail.tsx` renders the account summary read-only: name, `vertical` badge, `tier`,
     `lifecycleStage` (Customer Journey stage), owner, `website`, `billingCountry`, and a
     health-score display clearly labeled "BalloAds Health Score" (read-only - the enrichment
     treatment is completed in CRM-050).
  3. `app/accounts/[id]/page.tsx` is a Server Component that reads the account via the service and
     renders `account-detail.tsx`; render a not-found state (Next.js `notFound()` / `not-found.tsx`)
     when the action returns `{ ok: false }`.
- **Acceptance Criteria**:
  - `/accounts/[id]` renders the correct account's fields for an ID in the caller's org.
  - Requesting an ID from another org, or a non-existent ID, renders a not-found state - never
    another org's data.
  - The health score is displayed read-only and labeled as BalloAds-sourced.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) `/accounts/[id]` row updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../routes.md](../../routes.md) (`/accounts/[id]`) and
  [../../architecture.md](../../architecture.md) §4 (org scoping from the verified session) before
  starting; update [../../routes.md](../../routes.md) in the same change.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: open a valid account
  detail; attempt a cross-org ID and a made-up ID and confirm the not-found path; confirm no field
  is editable in this task.

---

### CRM-006: Scaffold `features/opportunities/` and `features/contracts/` schemas only (no UI)

- **Task ID**: `CRM-006`
- **Epic**: Opportunities / Contracts
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Scaffold Opportunity and Contract Zod schemas + folder structure (no UI, no repository
  logic)
- **Objective**: Lay down the `features/opportunities/` and `features/contracts/` folder skeletons
  and their Zod schemas so Phase 2's full CRUD (CRM-020+, CRM-030+) starts from an agreed shape
  rather than a blank folder - with **no** UI, actions, or repository logic yet.
- **Business Value**: De-risks Phase 2 by locking the Opportunity/Contract document shapes against
  [../../database-schema.md](../../database-schema.md) early, while the Accounts pattern is fresh,
  avoiding a later schema-migration scramble.
- **Dependencies**: `CRM-001` (pattern reference - mirror the Account schema/type/inference style).
- **Target Files**:
  - `features/opportunities/schemas/opportunity-schema.ts` (new)
  - `features/contracts/schemas/contract-schema.ts` (new)
  - `features/opportunities/README.md`, `features/contracts/README.md` (new - one line noting these
    are Phase-2 features scaffolded in CRM-006)
- **Technical Instructions**:
  1. `opportunity-schema.ts` defines `opportunitySchema` matching the canonical
     `organizations/{orgId}/opportunities/{opportunityId}` shape: `opportunityId`, `accountId`,
     `ownerId`, `name`, `stage` (`z.enum(["prospecting","qualification","proposal","negotiation",
"closed_won","closed_lost"])` - the default pipeline from `settings/pipeline` in
     [../../database-schema.md](../../database-schema.md)), `amount` (number), `currency` (string),
     `expectedCloseDate` (date string), `qualification` (a nested object:
     `{ budgetConfirmed: boolean, authorityContactId: string optional, need: string optional,
timeline: string optional, score: number 0-100 optional }`), `aiInsightJobId` (optional),
     `createdAt`, `updatedAt`. Export `type Opportunity = z.infer<...>`.
  2. `contract-schema.ts` defines `contractSchema` matching
     `organizations/{orgId}/contracts/{contractId}`: `contractId`, `accountId`, `opportunityId`
     (optional - the deal that produced it), `status`
     (`z.enum(["draft","active","expired","renewed","cancelled"])`), `value` (number), `currency`,
     `startDate`, `renewalDate` (date strings), `autoRenew` (boolean), `ownerId`, `createdAt`,
     `updatedAt`. Export `type Contract = z.infer<...>`.
  3. Do **not** create repositories, services, actions, or components in this task - schema files
     and folder READMEs only. Note in each README that the `stage`/`status` enums and the
     `authorityContactId` reference will be exercised by CRM-020+/CRM-030+.
- **Acceptance Criteria**:
  - `opportunitySchema` and `contractSchema` exist with inferred types, no `any`, and field names +
    enum values exactly matching [../../database-schema.md](../../database-schema.md).
  - The two feature folders exist with a schema file and a one-line README each; no UI, action, or
    repository files were added.
  - `tsc --noEmit` passes with the new schemas imported nowhere yet (dead-but-valid is acceptable
    for a scaffold).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) `opportunities`/`contracts` sections
        confirmed to match the scaffolded schemas
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: S
- **Estimated Hours**: 1-2
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`opportunities`, `contracts`) and [../../glossary.md](../../glossary.md) (Opportunity
  Qualification) before starting; no doc updates expected beyond confirming schema parity.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: `tsc --noEmit` and
  `npm run lint` pass; a quick `zod` `.parse()` of the example documents from
  [../../database-schema.md](../../database-schema.md) succeeds in a throwaway script, then removed.
