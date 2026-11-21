# Phase 2 - Core CRM CRUD

Phase 2 grows the proven Phase-1 Accounts slice into the full core CRM: it completes Account
Update/Delete, adds the append-only **Activities** log that powers every Customer-Journey timeline
(no separate `timeline` collection, per
[ADR-006](../../decisions.md#adr-006-no-separate-timeline-collection--customer-journey-is-a-query-over-activities)),
and builds out Contacts, Opportunities (with the pipeline stage model + kanban), Contracts, Tasks,
lifecycle-stage management, server-side Notifications, Templates, and Org Settings. Every task is a
mechanical reuse of the Phase-1 `repositories/` → `services/` → `actions/` → `features/*` pattern;
the new complexity is referential integrity across entities (enforced in `services/`, since
Firestore has no joins) and the polymorphic `relatedTo` model shared by `activities`, `tasks`, and
`notifications`.

See [README.md](./README.md#id-reconciliation-note) for how these IDs relate to
[../backlog.md](../backlog.md) (notably CRM-007 = the edit/soft-delete work that backlog files under
CRM-004, and CRM-009 = the timeline UI split out of backlog CRM-005).

---

### CRM-007: Account edit + soft-delete (Update/Delete)

- **Task ID**: `CRM-007`
- **Epic**: Accounts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Add Account update and soft-delete to the service, actions, and detail UI
- **Objective**: Complete Accounts CRUD by adding an `updateAccount` and a **soft-delete**
  (`deletedAt` / `isDeleted` flag, never a hard Firestore delete) path through the full stack, plus
  an edit affordance on the detail view.
- **Business Value**: Rounds out the core entity to full CRUD and keeps records recoverable/auditable
  (soft-delete) rather than destructively removed mid-demo.
- **Dependencies**: `CRM-002`, `CRM-005`; `SHELL-014` (slide-over/sheet edit primitive) - **soft**:
  use raw `components/ui/sheet.tsx`/`dialog.tsx` first.
- **Target Files**:
  - `features/accounts/schemas/account-schema.ts` (extend - add `updateAccountInputSchema`,
    optional `deletedAt`)
  - `repositories/accounts.ts` (extend - `updateAccount`, `softDeleteAccount`; exclude
    soft-deleted from `listAccounts` by default)
  - `services/accounts.ts` (extend - `updateAccountForOrg`, `softDeleteAccountForOrg` with a
    referential-integrity guard)
  - `features/accounts/actions/update-account.ts`, `features/accounts/actions/delete-account.ts`
    (new)
  - `features/accounts/components/edit-account-sheet.tsx` (new)
- **Technical Instructions**:
  1. `updateAccountInputSchema` = `createAccountInputSchema.partial()` restricted to
     client-editable fields (never `healthScore`/`healthScoreSource`/`ownerId` unless a reassign
     path is explicitly added). Add optional `deletedAt` (nullable ISO string) to `accountSchema`.
  2. Repository `updateAccount(orgId, id, patch)` sets `updatedAt`; `softDeleteAccount` sets
     `deletedAt`/`isDeleted: true`; `listAccounts` filters out soft-deleted docs by default.
  3. Service `softDeleteAccountForOrg` enforces the business rule "cannot delete an account with
     open (non-`closed_*`) opportunities or `active` contracts" - return `{ ok: false, error }`,
     don't throw (per [../../coding-standards.md](../../coding-standards.md) Error handling). This
     is a cross-repository referential-integrity check, so it lives in the service.
  4. Both actions verify `orgId` from the session and (per the `accounts` write rule - owner/admin/
     manager/rep in [../../firestore-rules.md](../../firestore-rules.md)) rely on the Admin SDK
     write path; `revalidatePath("/accounts")` and `revalidatePath("/accounts/[id]")` on success.
  5. `edit-account-sheet.tsx` reuses the CRM-004 form component against `updateAccountInputSchema`.
- **Acceptance Criteria**:
  - Editing an account persists changes and the detail/list reflect them without a manual reload.
  - Soft-deleting removes the account from the default list but leaves the document in Firestore
    with `deletedAt` set.
  - Attempting to delete an account with an open opportunity or active contract returns a clear
    `{ ok: false, error }` and does not delete.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../api.md](../../api.md) + [../../database-schema.md](../../database-schema.md)
        (`deletedAt` field) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../firestore-rules.md](../../firestore-rules.md)
  (`accounts` write roles) and [../../coding-standards.md](../../coding-standards.md) before
  starting; update [../../api.md](../../api.md) and [../../database-schema.md](../../database-schema.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: edit round-trip;
  soft-delete then confirm the doc still exists in the Firestore console with `deletedAt`; create an
  open opportunity, then confirm delete is refused.

---

### CRM-008: Activities logging service + repository (append-only) + timeline query helper

- **Task ID**: `CRM-008`
- **Epic**: Activities / Customer Journey
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the append-only Activities repository/service and the per-entity timeline query
- **Objective**: Create the single write path for the `activities` log and the read helper every
  timeline UI uses - a query over `organizations/{orgId}/activities` filtered by `relatedTo.type` +
  `relatedTo.id`, ordered by `occurredAt` - per the "no separate `timeline` collection" decision.
- **Business Value**: This is the shared spine for every Customer-Journey timeline (Account,
  Contact, Opportunity, Contract) and the audit trail - one write path, no dual-write drift.
- **Dependencies**: `CRM-001` (pattern); `INFRA-004` (activities rules) - **soft**.
- **Target Files**:
  - `features/activities/schemas/activity-schema.ts` (new - discriminated union on `type`)
  - `repositories/activities.ts` (new)
  - `services/activities.ts` (new)
- **Technical Instructions**:
  1. `activity-schema.ts` defines `activitySchema` matching
     `organizations/{orgId}/activities/{activityId}`: `activityId`, `relatedTo`
     (`{ type: z.enum(["account","contact","opportunity","contract","campaign"]), id: string }`),
     `type`, `actorId`, `occurredAt` (ISO string - activities are **immutable/append-only**, so
     there is no `updatedAt`), and a `type`-specific `payload`. Model `payload` as a **discriminated
     Zod union** keyed on `type` (per [../../database-schema.md](../../database-schema.md)): e.g.
     `note_added` → `{ text }`, `email_logged`/`call_logged` → `{ summary }`, `stage_changed` →
     `{ fromStage, toStage }`, `lifecycle_changed` → `{ fromStage, toStage }`, `contract_signed`
     → `{ contractId }`, `renewal_reminder` → `{ contractId, renewalDate }`,
     `balloads_campaign_triggered` → `{ balloAdsJourneyRef, campaignId? }`, `ai_insight_generated`
     → `{ jobId }`. Carry enough denormalized display data (actor name, a human-readable summary) to
     avoid N+1 lookups when rendering the feed (the tradeoff called out in
     [ADR-006](../../decisions.md#adr-006-no-separate-timeline-collection--customer-journey-is-a-query-over-activities)).
  2. `repositories/activities.ts` exports `appendActivity(orgId, activity)` (create only - **no
     update/delete**, matching the `activities` rule `update/delete: if false`) and
     `listActivitiesFor(orgId, relatedType, relatedId, { limit, cursor })` backed by the composite
     index `relatedTo.type ASC, relatedTo.id ASC, occurredAt DESC`
     ([../../indexes.md](../../indexes.md)).
  3. `services/activities.ts` exports `logActivity(orgId, actorId, relatedTo, type, payload)` - the
     helper other services call whenever they need to record an event (account created, stage
     changed, campaign triggered), validating the discriminated payload before append. Also export
     `getTimeline(orgId, relatedTo)` wrapping the repository read.
- **Acceptance Criteria**:
  - `logActivity` appends a schema-valid activity and rejects a payload that doesn't match its
    `type` branch.
  - `getTimeline` returns only the activities for the given `(type, id)` pair, newest first, using
    the composite index (no in-memory sort of the whole collection).
  - There is no code path that updates or deletes an activity.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) `activities` `type`/`payload` union
        documented; [../../indexes.md](../../indexes.md) confirms the activities index exists
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Must read
  [../../decisions.md](../../decisions.md#adr-006-no-separate-timeline-collection--customer-journey-is-a-query-over-activities),
  [../../database-schema.md](../../database-schema.md) (`activities`), and
  [../../indexes.md](../../indexes.md) before starting; update
  [../../database-schema.md](../../database-schema.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: append several
  activities of different `type`s to one account, confirm `getTimeline` returns them newest-first
  and scoped correctly; confirm an invalid payload for a `type` is rejected.

---

### CRM-009: Account detail activity timeline UI (Customer Journey timeline) wired to `activities`

- **Task ID**: `CRM-009`
- **Epic**: Activities / Customer Journey
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Add the Customer-Journey timeline tab to the Account detail view
- **Objective**: Surface CRM-008's `getTimeline` on `/accounts/[id]` as a chronological
  Customer-Journey feed, and add a "log note/call/email" affordance that appends an activity.
- **Business Value**: The timeline is the visible "Customer Journey" the pitch leans on - a
  single-pane history of everything that happened to an account.
- **Dependencies**: `CRM-005`, `CRM-008`; `SHELL-013` (tab/detail layout) - **soft**.
- **Target Files**:
  - `features/activities/hooks/use-timeline.ts` (new)
  - `features/activities/components/timeline.tsx` (new)
  - `features/activities/actions/log-activity.ts` (new - thin action over `services/activities.ts`)
  - `features/accounts/components/account-detail.tsx` (extend - add Timeline tab)
- **Technical Instructions**:
  1. `log-activity.ts` is a `"use server"` action taking `relatedTo`, `type`, `payload`; derives
     `actorId`/`orgId` from the session; calls `logActivity`; returns the shared result shape.
  2. `use-timeline.ts` is a TanStack Query hook keyed `["timeline", orgId, relatedType, relatedId]`
     calling a read action over `getTimeline`; invalidated after `log-activity` succeeds.
  3. `timeline.tsx` renders each activity with an icon per `type`, the actor, a relative timestamp,
     and the human-readable summary from the denormalized payload. It is the shared component the
     Contact/Opportunity/Contract detail views reuse in later tasks (parameterized by `relatedTo`).
  4. Add a "Log activity" control (note/call/email) writing through `log-activity.ts`.
- **Acceptance Criteria**:
  - The Account detail Timeline tab shows that account's activities newest-first, scoped to the
    account.
  - Logging a note/call/email appends an activity that appears in the feed without a manual reload.
  - The same `timeline.tsx` component renders correctly when passed a different `relatedTo` (verify
    it is not hardcoded to accounts).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) `/accounts/[id]` timeline behavior documented
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../routes.md](../../routes.md) (`/accounts/[id]`) and
  [../../glossary.md](../../glossary.md) (Timeline, Customer Journey) before starting; update
  [../../routes.md](../../routes.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: log a note and a
  call, confirm both appear newest-first; open a second account and confirm its timeline is
  independent.

---

### CRM-010: `Contact` Zod schema + repository, linked to `accounts/{accountId}`

- **Task ID**: `CRM-010`
- **Epic**: Contacts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Define the Contact schema and repository linked to an Account
- **Objective**: Add the `contacts` schema and repository, mirroring the Accounts pattern, with a
  hard link to a parent account via `accountId` (referential integrity enforced in the service).
- **Business Value**: Contacts are the individual-level CIMS record the pitch needs alongside
  company-level Accounts; low novelty risk since it extends the Accounts pattern directly.
- **Dependencies**: `CRM-001` (pattern), `CRM-002` (needs `getAccountById` for the FK check).
- **Target Files**:
  - `features/contacts/schemas/contact-schema.ts` (new)
  - `repositories/contacts.ts` (new)
- **Technical Instructions**:
  1. `contact-schema.ts` matches `organizations/{orgId}/contacts/{contactId}`: `contactId`,
     `accountId`, `firstName`, `lastName`, `title` (optional), `email` (optional, validated),
     `phone` (optional), `isPrimary` (boolean, default false), `ownerId`, `optedOutChannels`
     (`z.array(z.enum(["sms","whatsapp","email"]))`, default `[]` - mirrors the BalloAds opt-out
     concept, surfaced in CRM-013), `createdAt`, `updatedAt`. Export `type Contact = z.infer<...>`
     and `createContactInputSchema`.
  2. `repositories/contacts.ts` exports `createContact`, `getContactById`,
     `listContactsByAccount(orgId, accountId)` (a simple equality query on `accountId` - no
     composite index needed, per [../../indexes.md](../../indexes.md)), `updateContact`,
     `softDeleteContact`.
  3. No FK check in the repository - that's the service's job in CRM-011.
- **Acceptance Criteria**:
  - `contactSchema`/`createContactInputSchema` exist with inferred types, no `any`, fields matching
    [../../database-schema.md](../../database-schema.md).
  - `listContactsByAccount` returns only contacts for the given account within the org.
  - `repositories/contacts.ts` is the only file importing `firebase-admin/firestore` for contacts.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) `contacts` section confirmed
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 2-4
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`contacts`) before starting; update it if the shape differs.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: create contacts under
  an account, confirm `listContactsByAccount` scopes correctly.

---

### CRM-011: Contact CRUD screens (list, create, edit)

- **Task ID**: `CRM-011`
- **Epic**: Contacts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build Contact list/create/edit screens with referential-integrity on `accountId`
- **Objective**: Ship the `contacts` service + Server Actions and the `/contacts` list plus
  create/edit forms, with the service verifying the referenced `accountId` exists before write.
- **Business Value**: Completes the CIMS surface - reps can manage people, not just companies.
- **Dependencies**: `CRM-010`, `CRM-004` (form pattern), `SHELL-004` (`DataTable`) - **soft**.
- **Target Files**:
  - `services/contacts.ts` (new)
  - `features/contacts/actions/*.ts` (`create-contact.ts`, `list-contacts.ts`, `update-contact.ts`,
    `get-contact.ts`) (new)
  - `features/contacts/hooks/use-contacts.ts` (new)
  - `features/contacts/components/*` (`contacts-table.tsx`, `contact-form.tsx`) (new)
  - `app/(dashboard)/contacts/page.tsx`, `app/(dashboard)/contacts/[id]/page.tsx` (new)
- **Technical Instructions**:
  1. `services/contacts.ts` `createContactForOrg` verifies `accountId` resolves to an existing,
     non-deleted account in the org (the FK check Firestore can't do), returning `{ ok: false,
error }` if not; enforces "only one `isPrimary` contact per account" (demote the previous
     primary on set).
  2. Actions are thin `"use server"` wrappers returning the shared result shape; org-scoped from the
     session; `revalidatePath` the relevant contact routes on mutation.
  3. `contacts-table.tsx` links the account column to `/accounts/[id]`; `contact-form.tsx` reuses
     the RHF+Zod pattern against `createContactInputSchema`.
- **Acceptance Criteria**:
  - `/contacts` lists the org's contacts; create/edit persist and refresh without reload.
  - Creating a contact against a non-existent/other-org `accountId` is rejected.
  - Setting a contact primary demotes any prior primary on the same account.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) (`/contacts`, `/contacts/[id]`) + [../../api.md](../../api.md)
        updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: Must read [../../routes.md](../../routes.md) (`/contacts*`) and
  [../../coding-standards.md](../../coding-standards.md) before starting; update
  [../../routes.md](../../routes.md) and [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: full CRUD; bad-FK
  rejection; primary-contact demotion.

---

### CRM-012: Contact-to-Account relationship UI (primary contact, roles)

- **Task ID**: `CRM-012`
- **Epic**: Contacts
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Surface the contact↔account relationship (primary contact + role) on both details
- **Objective**: Show an account's contacts on the Account detail (with the primary flagged) and the
  parent account on the Contact detail, plus a per-contact `role` on the account relationship.
- **Business Value**: Makes the CIMS relationship navigable both directions - a core "who do we know
  here" CRM affordance for the demo.
- **Dependencies**: `CRM-005`, `CRM-011`.
- **Target Files**:
  - `features/contacts/schemas/contact-schema.ts` (extend - add optional
    `role: z.enum(["decision_maker","champion","influencer","user","gatekeeper"])`)
  - `features/accounts/components/account-detail.tsx` (extend - Contacts tab)
  - `features/contacts/components/contact-account-panel.tsx` (new)
- **Technical Instructions**:
  1. Add optional `role` to the contact schema (backward-compatible; existing docs default to
     unset).
  2. Account detail gains a Contacts tab listing `listContactsByAccount`, primary contact badged
     first, each row showing `role`, with a "set primary" action calling CRM-011's update path.
  3. Contact detail shows the parent account (link to `/accounts/[id]`) via `contact-account-panel`.
- **Acceptance Criteria**:
  - Account detail lists its contacts with the primary clearly flagged and each role shown.
  - Changing the primary from the account view updates both views.
  - Contact detail links back to the correct parent account.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`contacts.role`) + [../../routes.md](../../routes.md)
        updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: S
- **Estimated Hours**: 2-3
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`contacts`, `accounts` relationships) before starting; update it for the new `role` field.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: add two contacts, set
  each primary in turn, confirm both details stay consistent.

---

### CRM-013: Contact timeline - surface BalloAds opt-out/delivery status

- **Task ID**: `CRM-013`
- **Epic**: Contacts
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Add the Contact timeline tab and surface BalloAds opt-out/delivery status (read-only)
- **Objective**: Reuse CRM-009's timeline component on the Contact detail (`relatedTo.type ==
"contact"`) and display per-channel opt-out/delivery status read from BalloAds - never a
  BalloCRM-maintained ledger.
- **Business Value**: Gives reps a per-person communication history and a compliance-safe "is this
  person opted out" signal before offering a send.
- **Dependencies**: `CRM-009`, `CRM-011`; `COMM-004` (opt-out/delivery read-back) - **soft**: until
  the BalloAds client (`COMM-001`) and `COMM-004` land, render the `optedOutChannels` field already
  on the contact and stub the delivery-status panel with an "awaiting BalloAds" empty state.
- **Target Files**:
  - `features/contacts/components/contact-detail.tsx` (extend - Timeline + opt-out panel)
  - `features/contacts/components/optout-status-panel.tsx` (new)
- **Technical Instructions**:
  1. Add a Timeline tab passing `relatedTo: { type: "contact", id: contactId }` to the shared
     `timeline.tsx`.
  2. `optout-status-panel.tsx` shows per-channel (`sms`/`whatsapp`/`email`) opt-out status; the
     **source of truth is BalloAds** (read via `COMM-004`) - BalloCRM never maintains a second
     opt-out list ([../../integrations.md](../../integrations.md) integration boundaries). Grey out
     any "Send via BalloAds" affordance for an opted-out channel.
  3. Do **not** implement any sending here - that is always a call into BalloAds.
- **Acceptance Criteria**:
  - Contact detail shows that contact's timeline, scoped correctly.
  - Opt-out status renders per channel; when `COMM-004` is unavailable, the panel shows a clear
    "awaiting BalloAds" state rather than fabricating data.
  - No opt-out ledger or delivery ledger is written by BalloCRM.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../integrations.md](../../integrations.md) boundary checklist re-confirmed in the PR;
        [../../routes.md](../../routes.md) (`/contacts/[id]`) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../integrations.md](../../integrations.md) (opt-out /
  delivery read-back, integration boundaries) before starting; update [../../routes.md](../../routes.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: confirm the timeline
  is contact-scoped; with `COMM-004` stubbed, confirm the panel degrades gracefully and never
  invents opt-out state.

---

### CRM-020: `Opportunity` schema + pipeline stage model (stages driven by `settings/{pipeline}`)

- **Task ID**: `CRM-020`
- **Epic**: Opportunities
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Promote the Opportunity scaffold to a full schema/repository/service with configurable
  stages
- **Objective**: Build the `opportunities` repository + service on top of CRM-006's schema, with the
  pipeline stage list read from `settings/{pipeline}` (not hardcoded) and a stage-change path that
  logs an activity.
- **Business Value**: Opportunities are the core "sales pipeline" narrative; sourcing stages from
  org settings lets the demo show a configurable pipeline.
- **Dependencies**: `CRM-006` (schema scaffold), `CRM-008` (activity logging), `CRM-002` (account
  FK check), `CRM-044` (settings domain) - **soft**: default to the canonical stage list
  (`prospecting`, `qualification`, `proposal`, `negotiation`, `closed_won`, `closed_lost`) until
  `settings/pipeline` is readable.
- **Target Files**:
  - `features/opportunities/schemas/opportunity-schema.ts` (extend from CRM-006 as needed)
  - `repositories/opportunities.ts` (new)
  - `services/opportunities.ts` (new)
  - `features/opportunities/actions/*.ts` (`create-opportunity.ts`, `list-opportunities.ts`,
    `update-opportunity.ts`, `move-opportunity-stage.ts`, `get-opportunity.ts`) (new)
- **Technical Instructions**:
  1. Repository exposes `createOpportunity`, `getOpportunityById`,
     `listOpportunitiesByStage(orgId)` (index `stage ASC, expectedCloseDate ASC`),
     `listOpportunitiesByAccount(orgId, accountId)` (index `accountId ASC, stage ASC`),
     `listOpportunitiesByOwner(orgId, ownerId)` (index `ownerId ASC, expectedCloseDate ASC`),
     `updateOpportunity` - all per [../../indexes.md](../../indexes.md).
  2. `services/opportunities.ts` verifies `accountId` (and `qualification.authorityContactId`, when
     set) exist in the org before write; `moveOpportunityStage(orgId, id, toStage)` validates
     `toStage` is in the org's configured stage list (from `settings/pipeline`, else the canonical
     default) and calls `logActivity` with `type: "stage_changed"`, payload `{ fromStage, toStage }`.
  3. Actions are thin `"use server"` wrappers, org-scoped, returning the shared result shape.
- **Acceptance Criteria**:
  - Opportunities can be created/read/updated with FK checks on `accountId`/`authorityContactId`.
  - A stage change validates against the configured stage list and appends a `stage_changed`
    activity visible on the account/opportunity timeline.
  - Each list query uses the documented composite index (no full-collection in-memory sorting).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`opportunities`) + [../../api.md](../../api.md)
        updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-6
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`opportunities`, `settings`), [../../indexes.md](../../indexes.md), and
  [../../integrations.md](../../integrations.md) (Journey naming) before starting; update
  [../../database-schema.md](../../database-schema.md) and [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: create an opportunity,
  move its stage, confirm the activity is logged and list queries return correctly grouped results.

---

### CRM-021: Opportunity list + kanban-by-stage view (create/edit; consumes SHELL-015 kanban primitive)

- **Task ID**: `CRM-021`
- **Epic**: Opportunities
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the pipeline kanban (and table toggle) with create/edit and drag-to-move stage
- **Objective**: Render `/opportunities` as a stage-based kanban (columns = configured stages) with
  a table-view toggle, wired to CRM-020's actions, including drag-to-move that calls
  `moveOpportunityStage`.
- **Business Value**: The kanban is the single most recognizable "this is a CRM" visual for judges.
- **Dependencies**: `CRM-020`; `SHELL-015` (kanban primitive), `SHELL-004` (`DataTable` for the
  table toggle) - **soft**: build the board from `components/ui/card.tsx` columns until the shared
  kanban primitive lands, then swap.
- **Target Files**:
  - `features/opportunities/hooks/use-opportunities.ts` (new)
  - `features/opportunities/components/*` (`pipeline-board.tsx`, `opportunity-card.tsx`,
    `opportunities-table.tsx`, `opportunity-form.tsx`) (new)
  - `app/(dashboard)/opportunities/page.tsx` (new)
- **Technical Instructions**:
  1. `use-opportunities.ts` fetches via `list-opportunities.ts`, keyed `["opportunities", orgId,
view]`; a live board may use an `onSnapshot` subscription (allowed by
     [ADR-004](../../decisions.md#adr-004-redux-toolkit-for-client-ui-state-only-tanstack-query-owns-all-server-data)
     - TanStack Query owns server data; no Redux slice mirrors Firestore).
  2. `pipeline-board.tsx` renders one column per configured stage with `opportunity-card.tsx` cards
     (name, amount, `stage`/qualification-score badges). Drag-to-move calls
     `move-opportunity-stage.ts` optimistically and reconciles on result.
  3. `tabs.tsx` toggles Kanban/Table; the table uses `DataTable`.
- **Acceptance Criteria**:
  - `/opportunities` shows opportunities grouped into stage columns matching the configured stages.
  - Dragging a card to another column persists the stage change and logs the `stage_changed`
    activity (CRM-020); the move is reflected without a manual reload.
  - The Kanban/Table toggle shows the same data two ways; create/edit work from both.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) (`/opportunities`) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 6-9
- **Documentation References**: Must read [../../routes.md](../../routes.md) (`/opportunities`) and
  [../../architecture.md](../../architecture.md) §2 (Client vs Server Components) before starting;
  update [../../routes.md](../../routes.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: drag across several
  stages incl. `closed_won`; confirm persistence, activity logging, and the table toggle parity.

---

### CRM-022: BANT/MEDDIC-style qualification fields on Opportunity form (the `qualification` object)

- **Task ID**: `CRM-022`
- **Epic**: Opportunities
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Add the structured qualification fields to the Opportunity form and detail
- **Objective**: Make the `opportunity.qualification` object editable - `budgetConfirmed`,
  `authorityContactId`, `need`, `timeline`, and a manual `score` - so reps can qualify a deal, with
  the shape ready for AI-assisted scoring (AI-003).
- **Business Value**: Qualification data both improves forecast reliability and is the exact input
  Brutus AI's scoring job (AI-003) consumes - this task makes that data exist.
- **Dependencies**: `CRM-020`, `CRM-021`; `CRM-011` (for the `authorityContactId` picker).
- **Target Files**:
  - `features/opportunities/components/opportunity-form.tsx` (extend - Qualification section)
  - `features/opportunities/components/qualification-panel.tsx` (new - detail display)
  - `features/opportunities/schemas/opportunity-schema.ts` (confirm `qualification` sub-schema)
- **Technical Instructions**:
  1. Add a Qualification section to the form: `budgetConfirmed` (switch), `authorityContactId`
     (select sourced from `listContactsByAccount` for the opportunity's account), `need` (textarea),
     `timeline` (text/quarter), `score` (0-100 number - manual entry; AI-003 will also write here).
  2. `qualification-panel.tsx` shows the qualification on the opportunity detail with a completeness
     indicator (`progress.tsx`).
  3. Persist through CRM-020's `updateOpportunity`; the service validates
     `qualification.authorityContactId` resolves to a contact on the same account.
- **Acceptance Criteria**:
  - The qualification fields save and reload correctly on an opportunity.
  - `authorityContactId` can only be set to a contact belonging to the opportunity's account.
  - The detail panel shows qualification state and a completeness indicator.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`opportunities.qualification`)
        confirmed; [../../glossary.md](../../glossary.md) (Opportunity Qualification) cross-checked
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../glossary.md](../../glossary.md) (Opportunity
  Qualification) and [../../database-schema.md](../../database-schema.md) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: fill qualification,
  reload; try setting authority to a contact from another account and confirm rejection.

---

### CRM-030: `Contract` schema + repository, linked to Account/Opportunity

- **Task ID**: `CRM-030`
- **Epic**: Contracts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Promote the Contract scaffold to a full schema/repository/service
- **Objective**: Build the `contracts` repository + service on CRM-006's schema, linked to an
  account and (optionally) the won opportunity that produced it, with the renewal-risk query.
- **Business Value**: Contract tracking is an expected CRM capability and the source of the renewal
  and cross-sell signals later tasks consume.
- **Dependencies**: `CRM-006` (schema), `CRM-002` (account FK), `CRM-020` (opportunity FK).
- **Target Files**:
  - `features/contracts/schemas/contract-schema.ts` (extend from CRM-006 as needed)
  - `repositories/contracts.ts` (new)
  - `services/contracts.ts` (new)
- **Technical Instructions**:
  1. Repository exposes `createContract`, `getContractById`, `listContractsByAccount`,
     `listContractsForRenewal(orgId)` (index `status ASC, renewalDate ASC` - the renewal-risk view,
     [../../indexes.md](../../indexes.md)), `updateContract`.
  2. `services/contracts.ts` verifies `accountId` and, if set, `opportunityId` exist in the org
     before write. **Note the stricter write tier**: per
     [../../firestore-rules.md](../../firestore-rules.md), contracts are writable only by
     `owner`/`admin`/`manager` (reps read-only) - the service must reflect this (re-check role in
     addition to the rule).
  3. Actions in CRM-031.
- **Acceptance Criteria**:
  - Contracts create/read/update with FK checks on `accountId`/`opportunityId`.
  - `listContractsForRenewal` returns active contracts ordered by soonest `renewalDate` using the
    composite index.
  - A `rep`-role write is rejected by the service, matching the rules tier.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`contracts`) + [../../firestore-rules.md](../../firestore-rules.md)
        tier cross-checked
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`contracts`), [../../indexes.md](../../indexes.md), and
  [../../firestore-rules.md](../../firestore-rules.md) (contract write tier) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: create contracts with
  varied renewal dates, confirm the renewal query ordering; confirm a rep-role write is refused.

---

### CRM-031: Contract CRUD screens (list, create, edit, status)

- **Task ID**: `CRM-031`
- **Epic**: Contracts
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build Contract list/create/edit screens with status and renewal-date surfacing
- **Objective**: Ship the `contracts` actions and `/contracts` list + create/edit forms, with a
  renewal-date column and an expiring-soon badge, and a `contract_signed` activity on activation.
- **Business Value**: Gives the demo a contract lifecycle view - active/expiring/renewed - feeding
  the renewal-risk narrative.
- **Dependencies**: `CRM-030`, `CRM-004` (form pattern), `CRM-008` (activity), `SHELL-004` - soft.
- **Target Files**:
  - `features/contracts/actions/*.ts` (`create-contract.ts`, `list-contracts.ts`,
    `update-contract.ts`, `get-contract.ts`) (new)
  - `features/contracts/hooks/use-contracts.ts` (new)
  - `features/contracts/components/*` (`contracts-table.tsx`, `contract-form.tsx`) (new)
  - `app/(dashboard)/contracts/page.tsx`, `app/(dashboard)/contracts/[id]/page.tsx` (new)
- **Technical Instructions**:
  1. Thin `"use server"` actions over `services/contracts.ts`, org-scoped, shared result shape;
     transitioning a contract to `active` logs an activity `type: "contract_signed"` via CRM-008.
  2. `contracts-table.tsx` shows `renewalDate` and an expiry badge (`outline` healthy,
     `destructive` expiring soon); `contract-form.tsx` reuses the RHF+Zod pattern.
  3. Respect the write tier from CRM-030 (hide edit affordances for `rep`/`viewer`).
- **Acceptance Criteria**:
  - `/contracts` lists the org's contracts with renewal date and expiry badge; create/edit persist
    and refresh without reload.
  - Activating a contract logs a `contract_signed` activity on the account timeline.
  - Rep/viewer roles see read-only (no edit/create affordance), matching the rules tier.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../routes.md](../../routes.md) (`/contracts*`) + [../../api.md](../../api.md) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: Must read [../../routes.md](../../routes.md) (`/contracts*`) and
  [../../firestore-rules.md](../../firestore-rules.md) before starting; update
  [../../routes.md](../../routes.md) and [../../api.md](../../api.md).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: full CRUD; activate a
  contract and confirm the activity; sign in as a rep and confirm read-only.

---

### CRM-032: Contract renewal reminders (logged as `activities`, no new collection)

- **Task ID**: `CRM-032`
- **Epic**: Contracts
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Generate contract renewal reminders as activities + notifications (no new collection)
- **Objective**: Add a server-side routine that finds contracts approaching `renewalDate` and writes
  a `renewal_reminder` **activity** (and, via CRM-042, a notification to the owner) - reusing the
  existing `activities`/`notifications` collections, never a new one.
- **Business Value**: Turns contract data into proactive "renewal due" prompts, a strong Customer
  Success demo moment.
- **Dependencies**: `CRM-030`, `CRM-008` (activity), `CRM-042` (notifications) - **soft** for
  scheduling: run the routine from a manually-invoked Server Action / Route Handler until a cron/
  scheduled trigger exists.
- **Target Files**:
  - `services/contracts.ts` (extend - `generateRenewalReminders(orgId, withinDays)`)
  - `features/contracts/actions/run-renewal-reminders.ts` (new - manual trigger)
- **Technical Instructions**:
  1. `generateRenewalReminders` queries `listContractsForRenewal` (index `status ASC, renewalDate
ASC`) for `status == "active"` contracts renewing within `withinDays`, and for each **not
     already reminded within the window** appends an activity `type: "renewal_reminder"`, payload
     `{ contractId, renewalDate }`, `relatedTo: { type: "contract", id }` - idempotency keyed off
     the last reminder activity so re-running doesn't duplicate.
  2. Also create an owner notification via CRM-042 (`type: "renewal_due"`).
  3. Expose a manual `"use server"` trigger for the demo; note the future scheduled trigger in the
     PR (not a new collection - reuse `activities`/`notifications`).
- **Acceptance Criteria**:
  - Running the routine creates one `renewal_reminder` activity per due contract and no duplicates
    on re-run within the window.
  - The contract owner receives a `renewal_due` notification.
  - No new Firestore collection is introduced.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`activities` `renewal_reminder` type)
        documented
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-5
- **Documentation References**: Must read
  [../../decisions.md](../../decisions.md#adr-006-no-separate-timeline-collection--customer-journey-is-a-query-over-activities)
  and [../../database-schema.md](../../database-schema.md) before starting; update the schema doc.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: seed a contract
  renewing soon, run the trigger, confirm one activity + one notification; re-run and confirm no
  duplicate.

---

### CRM-040: Tasks (follow-ups) schema + repository + CRUD + "My tasks" view (`tasks/{taskId}`)

- **Task ID**: `CRM-040`
- **Epic**: Tasks
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the Tasks entity (schema, repository, service, CRUD) and a "My tasks" view
- **Objective**: Add follow-up/action items at `organizations/{orgId}/tasks/{taskId}`, polymorphically
  linked to any entity via `relatedTo`, with a "My tasks" list sorted by due date.
- **Business Value**: Follow-up tasks are the day-to-day driver of rep activity and the hook for the
  "task assigned" notification and renewal reminders.
- **Dependencies**: `CRM-001` (pattern), `CRM-042` (notification on assignment) - soft.
- **Target Files**:
  - `features/tasks/schemas/task-schema.ts` (new)
  - `repositories/tasks.ts` (new)
  - `services/tasks.ts` (new)
  - `features/tasks/actions/*.ts`, `features/tasks/hooks/use-my-tasks.ts`,
    `features/tasks/components/*`, `app/(dashboard)/tasks/page.tsx` (new)
- **Technical Instructions**:
  1. `task-schema.ts` matches `tasks/{taskId}`: `taskId`, `title`, `assigneeId`, `relatedTo`
     (`{ type: z.enum(["account","contact","opportunity","contract"]), id }`, optional), `status`
     (`z.enum(["open","in_progress","done","cancelled"])`), `priority`
     (`z.enum(["low","medium","high"])`), `dueDate`, `createdAt`, `updatedAt`.
  2. Repository: `createTask`, `getTaskById`, `listMyTasks(orgId, assigneeId)` (index `assigneeId
ASC, dueDate ASC`), `listOpenTasks(orgId)` (index `status ASC, dueDate ASC`), `updateTask` -
     per [../../indexes.md](../../indexes.md).
  3. Service verifies `assigneeId` is an org member and, if `relatedTo` set, the referenced entity
     exists; on assignment to another user, calls CRM-042 to create a `task_assigned` notification.
  4. "My tasks" view uses `use-my-tasks.ts` keyed `["tasks", orgId, assigneeId]`.
- **Acceptance Criteria**:
  - Tasks create/read/update; "My tasks" shows the signed-in user's open tasks soonest-due first
    via the composite index.
  - Assigning a task to another user creates a `task_assigned` notification for them.
  - A `relatedTo` pointing at a non-existent entity is rejected.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`tasks`) + [../../routes.md](../../routes.md)
        (`/tasks`) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: L
- **Estimated Hours**: 5-7
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`tasks`) and [../../indexes.md](../../indexes.md) before starting; update the schema + routes docs
  (add a `/tasks` row if not present).
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: create tasks with
  varied due dates/assignees; confirm My-tasks ordering and cross-assignment notification.

---

### CRM-041: Customer Journey lifecycle-stage management on Accounts/Contacts (`lifecycleStage` transitions logged as `activities`)

- **Task ID**: `CRM-041`
- **Epic**: Activities / Customer Journey
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Manage `lifecycleStage` transitions and log each as a `lifecycle_changed` activity
- **Objective**: Add a controlled way to advance an Account's (and, where relevant, a Contact's)
  `lifecycleStage` through the CRM-native Customer Journey, logging each transition as an activity -
  and expose the current stage prominently on the detail view.
- **Business Value**: The Customer Journey lifecycle is the CRM-native narrative (distinct from
  BalloAds Journey) and the trigger source for automated communications (COMM-003).
- **Dependencies**: `CRM-005`/`CRM-007` (account detail/edit), `CRM-008` (activity logging).
- **Target Files**:
  - `services/accounts.ts` (extend - `changeLifecycleStage(orgId, actorId, accountId, toStage)`)
  - `features/customer-journey/components/lifecycle-stage-control.tsx` (new)
  - `features/accounts/components/account-detail.tsx` (extend - stage control)
- **Technical Instructions**:
  1. `changeLifecycleStage` validates `toStage` against the `lifecycleStage` enum
     (`lead`→`qualified`→`onboarding`→`active_customer`→`at_risk`/`renewal`→`churned`), updates the
     account, and calls `logActivity` with `type: "lifecycle_changed"`, payload
     `{ fromStage, toStage }`. **Never name anything `journey`** - use `lifecycleStage`/
     `customerJourney`, per [../../integrations.md](../../integrations.md) /
     [../../glossary.md](../../glossary.md).
  2. `lifecycle-stage-control.tsx` is the reusable stepper/select surfaced on the account detail;
     it is the hook point COMM-003 uses to fire a BalloAds journey on certain transitions.
- **Acceptance Criteria**:
  - Changing an account's lifecycle stage persists and logs a `lifecycle_changed` activity visible
    in the timeline.
  - The current stage is shown prominently on the detail view.
  - No field/variable/UI string uses the bare word "journey" for the CRM concept.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../glossary.md](../../glossary.md) (Customer Journey) cross-checked;
        [../../database-schema.md](../../database-schema.md) (`accounts.lifecycleStage`) confirmed
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../glossary.md](../../glossary.md) and
  [../../integrations.md](../../integrations.md) (Journey naming collision) before starting.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: advance a stage,
  confirm the activity + prominent display; grep the diff for any unqualified `journey` identifier.

---

### CRM-042: Notifications creation service (task assigned, opportunity stalling, renewal due) - server-side writes to `notifications`

- **Task ID**: `CRM-042`
- **Epic**: Notifications
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the server-side notifications creation service
- **Objective**: Add the `notifications` repository + service that writes per-user in-app
  notifications from server code only (clients can read/mark-read their own, never create) for
  events: task assigned, opportunity stalling, renewal due.
- **Business Value**: Notifications turn background signals (assignments, stalls, renewals) into
  visible prompts; the read UI is Developer 2's `SHELL-006`, so this task supplies its data.
- **Dependencies**: `CRM-001` (pattern); consumed by `CRM-032`, `CRM-040`, and CRM-023's stall
  detection; read UI is `SHELL-006` (Developer 2).
- **Target Files**:
  - `features/notifications/schemas/notification-schema.ts` (new)
  - `repositories/notifications.ts` (new)
  - `services/notifications.ts` (new)
- **Technical Instructions**:
  1. `notification-schema.ts` matches `notifications/{notificationId}`: `notificationId`,
     `targetUserId`, `type` (`z.enum(["task_assigned","opportunity_stalling","renewal_due"])`),
     `title`, `relatedTo` (polymorphic `{ type, id }`), `read` (boolean), `readAt` (nullable),
     `createdAt`.
  2. `repositories/notifications.ts` exports `createNotification` (Admin SDK - recall
     `create`/`delete` are `allow write: if false` for clients per
     [../../firestore-rules.md](../../firestore-rules.md); only server code writes) and
     `listForUser(orgId, userId)` (index `targetUserId ASC, read ASC, createdAt DESC`).
  3. `services/notifications.ts` exports `notifyUser(orgId, targetUserId, type, title, relatedTo)` -
     the single helper CRM-032/CRM-040/CRM-023 call. Do **not** implement client-side create/delete.
- **Acceptance Criteria**:
  - `notifyUser` writes a schema-valid notification via the Admin SDK for the given user.
  - `listForUser` returns a user's notifications unread-first, newest-first, via the composite
    index.
  - There is no client-writable create/delete path (matches the rules).
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`notifications`) +
        [../../firestore-rules.md](../../firestore-rules.md) cross-checked
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`notifications`) and [../../firestore-rules.md](../../firestore-rules.md) (self-serve read-receipt
  pattern) before starting; update the schema doc.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: call `notifyUser` from
  a throwaway trigger, confirm the doc, and confirm `listForUser` ordering; confirm a client-SDK
  create attempt is denied in the emulator playground.

---

### CRM-043: Templates schema + CRUD (`templates/{templateId}` - proposal / campaign-message templates)

- **Task ID**: `CRM-043`
- **Epic**: Templates
- **Priority**: P2
- **Owner**: Developer 3
- **Title**: Build the Templates entity (schema, repository, service, CRUD)
- **Objective**: Add reusable content templates at `templates/{templateId}` (`kind`: `proposal` /
  `campaign_message`) that campaigns (ABM-003) and BalloAds triggers reference.
- **Business Value**: Templates are the reusable content layer ABM campaigns and BalloAds sends draw
  from - BalloCRM stores the template; BalloAds does the actual rendering/sending.
- **Dependencies**: `CRM-001` (pattern).
- **Target Files**:
  - `features/templates/schemas/template-schema.ts` (new)
  - `repositories/templates.ts` (new)
  - `services/templates.ts` (new)
  - `features/templates/actions/*.ts`, `features/templates/components/*` (new)
- **Technical Instructions**:
  1. `template-schema.ts` matches `templates/{templateId}`: `templateId`, `name`, `kind`
     (`z.enum(["proposal","campaign_message"])`), `body` (string with `{{placeholder}}` tokens),
     `createdBy`, `createdAt`, `updatedAt`.
  2. Repository: `createTemplate`, `getTemplateById`, `listTemplatesByKind(orgId, kind)` (simple
     equality query - no composite index, per [../../indexes.md](../../indexes.md)), `updateTemplate`.
  3. Service enforces the write tier (`owner`/`admin`/`manager` per
     [../../firestore-rules.md](../../firestore-rules.md)). **BalloCRM never renders/sends** the
     template - rendering stays in BalloAds ([../../integrations.md](../../integrations.md)).
- **Acceptance Criteria**:
  - Templates create/read/update; `listTemplatesByKind` filters correctly.
  - A rep/viewer write is rejected, matching the rules tier.
  - No template-rendering or message-sending logic is implemented in BalloCRM.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`templates`) +
        [../../integrations.md](../../integrations.md) boundary re-confirmed
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 3-4
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`templates`) and [../../integrations.md](../../integrations.md) (no template rendering) before
  starting; update the schema doc.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: CRUD a template of
  each kind; confirm role tier; confirm no send/render path exists.

---

### CRM-044: Org settings domain + admin settings screen (`settings/{settingId}`: pipeline stages, default currency, feature flags)

- **Task ID**: `CRM-044`
- **Epic**: Settings
- **Priority**: P1
- **Owner**: Developer 3
- **Title**: Build the org settings domain and the admin-only settings screen
- **Objective**: Add the `settings` repository + service and an admin screen to manage
  `settings/{pipeline}` (stage list), `defaultCurrency`, and feature flags - the config CRM-020's
  pipeline and other features read.
- **Business Value**: Makes the pipeline and currency configurable per org without a deploy - a
  concrete "multi-tenant, admin-tunable" story for judges, and the dependency CRM-020 reads stages
  from.
- **Dependencies**: `CRM-001` (pattern); integration-credential settings are Developer 1/COMM-002
  scope, not this task (this task is non-secret settings only).
- **Target Files**:
  - `features/settings/schemas/settings-schema.ts` (new)
  - `repositories/settings.ts` (new)
  - `services/settings.ts` (new)
  - `features/settings/actions/*.ts`, `features/settings/components/*`,
    `app/(dashboard)/settings/page.tsx` (new - General tab; Members/Integrations tabs are Dev 1)
- **Technical Instructions**:
  1. `settings-schema.ts` covers the `pipeline` document (`{ settingId: "pipeline", stages:
z.array(z.string()).min(2), defaultCurrency: string, featureFlags:
z.record(z.boolean()).optional(), updatedBy, updatedAt }`) matching
     [../../database-schema.md](../../database-schema.md). Fetched by known `settingId` (no index).
  2. Repository: `getSetting(orgId, settingId)`, `upsertSetting(orgId, settingId, data)`.
  3. Service enforces the `owner`/`admin`-only write tier
     ([../../firestore-rules.md](../../firestore-rules.md)); `getPipelineStages(orgId)` returns the
     configured stages (or the canonical default) - the exact helper CRM-020 consumes.
  4. Settings screen (General tab) lets admins edit stages, default currency, and flags; not visible
     to rep/viewer.
- **Acceptance Criteria**:
  - Admins can edit the pipeline stage list and default currency; changes persist and CRM-020 reads
    them.
  - Non-admin roles cannot write settings (service + rules).
  - `getPipelineStages` returns configured stages or the documented default fallback.
- **Definition of Done**:
  - [ ] Acceptance criteria above all met
  - [ ] [../../database-schema.md](../../database-schema.md) (`settings`) + [../../routes.md](../../routes.md)
        (`/settings`) updated
  - [ ] Project-wide DoD met - see [../../sprint-plan.md](../../sprint-plan.md#definition-of-done)
  - [ ] Status + [../../progress.md](../../progress.md) / [../../changelog.md](../../changelog.md)
        updated
- **Estimated Complexity**: M
- **Estimated Hours**: 4-5
- **Documentation References**: Must read [../../database-schema.md](../../database-schema.md)
  (`settings`), [../../firestore-rules.md](../../firestore-rules.md) (settings tier), and
  [../../routes.md](../../routes.md) (`/settings`) before starting; update the schema + routes docs.
- **Testing Notes**: No test framework yet (`INFRA-012`). Manual verification: edit stages as admin,
  confirm CRM-020's board reflects them; sign in as manager/rep and confirm no write access.
