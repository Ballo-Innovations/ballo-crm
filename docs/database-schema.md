# Database Schema

BalloCRM persists all application data in **Cloud Firestore**, using a multi-tenant model: one
top-level `users` collection, one top-level `organizations` collection, and every CRM business
object nested under `organizations/{orgId}/...` as a subcollection. This document is the
canonical description of that schema. If code and this file ever disagree, fix whichever one is
wrong — do not let them drift (see [decisions.md](./decisions.md)).

Related docs: [firestore-rules.md](./firestore-rules.md) (who can read/write what),
[indexes.md](./indexes.md) (composite indexes referenced below), [architecture.md](./architecture.md)
(repository/service layer that is the _only_ code allowed to touch Firestore directly).

> **No joins.** Firestore has no relational joins or foreign-key enforcement. Every relationship
> below is a plain document ID stored as a string field (e.g. `accountId`). Referential integrity
> (the referenced document exists, isn't orphaned) is enforced in the `services/` layer at write
> time, not by the database.

## Collection map

```
users/{uid}
organizations/{orgId}
organizations/{orgId}/accounts/{accountId}
organizations/{orgId}/contacts/{contactId}
organizations/{orgId}/opportunities/{opportunityId}
organizations/{orgId}/tasks/{taskId}
organizations/{orgId}/contracts/{contractId}
organizations/{orgId}/campaigns/{campaignId}
organizations/{orgId}/activities/{activityId}
organizations/{orgId}/notifications/{notificationId}
organizations/{orgId}/auditLogs/{logId}
organizations/{orgId}/aiJobs/{jobId}
organizations/{orgId}/templates/{templateId}
organizations/{orgId}/analyticsCache/{cacheKey}
organizations/{orgId}/settings/{settingId}
organizations/{orgId}/integrations/{provider}
```

---

## `users/{uid}`

**Purpose:** One document per Firebase Auth user. Holds CRM identity, org membership, and role —
the two fields every security rule and every server-side authorization check reads first.

```json
{
  "uid": "u_8f21a",
  "email": "jane.rep@acme-crm.com",
  "displayName": "Jane Odhiambo",
  "photoURL": null,
  "orgId": "org_ballo01",
  "role": "rep",
  "createdAt": "2026-06-01T08:12:00.000Z",
  "updatedAt": "2026-07-02T14:03:11.000Z"
}
```

- **Relationships:** `orgId` → `organizations/{orgId}`. Referenced by nearly every other
  collection via `ownerId`, `actorId`, `assigneeId`, `targetUserId`.
- **Indexes:** none defined — `users` is always read by document ID (`uid`), never queried.
- **Security note:** `role` and `orgId` are write-locked on the client (rule requires
  `request.resource.data.role == resource.data.role` and same for `orgId`); changing either
  requires a Server Action using the Admin SDK, preventing client-side self-escalation. See
  [firestore-rules.md](./firestore-rules.md).

## `organizations/{orgId}`

**Purpose:** The tenant root. One document per customer organization using BalloCRM.

```json
{
  "orgId": "org_ballo01",
  "name": "Acme Distribution Ltd",
  "plan": "growth",
  "createdAt": "2026-05-20T09:00:00.000Z",
  "updatedAt": "2026-06-30T11:45:00.000Z"
}
```

- **Relationships:** parent of every subcollection listed below.
- **Indexes:** none — read/updated by ID only.
- **Security note:** `create`/`delete` are `false` client-side (org provisioning is a controlled
  server-side operation); `update` requires `owner` or `admin` role.

## `organizations/{orgId}/accounts/{accountId}`

**Purpose:** An enterprise account (company) — the core CIMS entity. Owns contacts,
opportunities, and contracts.

```json
{
  "accountId": "acct_7c31",
  "name": "Kestrel Freight Co.",
  "vertical": "logistics",
  "tier": "enterprise",
  "ownerId": "u_8f21a",
  "healthScore": 78,
  "healthScoreSource": "balloAds",
  "lifecycleStage": "active_customer",
  "website": "https://kestrelfreight.example",
  "billingCountry": "KE",
  "createdAt": "2026-05-22T10:00:00.000Z",
  "updatedAt": "2026-07-03T16:20:00.000Z"
}
```

- **Relationships:** `ownerId` → `users/{uid}`. Referenced by `contacts.accountId`,
  `opportunities.accountId`, `contracts.accountId`, `activities.relatedTo.id` (when
  `relatedTo.type == "account"`).
- **Indexes:** `vertical ASC, healthScore DESC` (vertical sales indexing — segment accounts by
  industry, ranked by health); `ownerId ASC, updatedAt DESC` (a rep's account list, most
  recently touched first). See [indexes.md](./indexes.md).
- **Security note:** `healthScore` is treated as an externally-supplied enrichment field written
  by a server-side sync job from BalloAds, never computed or trusted from the client (see
  [integrations.md](./integrations.md)); writes require `owner`/`admin`/`manager`/`rep`.

## `organizations/{orgId}/contacts/{contactId}`

**Purpose:** A person at an account — the CRM's individual-level CIMS record.

```json
{
  "contactId": "cont_44de",
  "accountId": "acct_7c31",
  "firstName": "Peter",
  "lastName": "Wanjiru",
  "title": "Head of Procurement",
  "email": "peter.wanjiru@kestrelfreight.example",
  "phone": "+254700123456",
  "isPrimary": true,
  "ownerId": "u_8f21a",
  "optedOutChannels": [],
  "createdAt": "2026-05-22T10:05:00.000Z",
  "updatedAt": "2026-06-15T09:30:00.000Z"
}
```

- **Relationships:** `accountId` → `accounts`, `ownerId` → `users`.
- **Indexes:** none dedicated yet; contact lists are typically fetched by `accountId` via a
  simple equality query (no composite index required). Add one if a sorted/filtered contact list
  view is built later — see the "adding a new index" guide in [indexes.md](./indexes.md).
- **Security note:** write requires `owner`/`admin`/`manager`/`rep` (same tier as accounts).

## `organizations/{orgId}/opportunities/{opportunityId}`

**Purpose:** A sales pipeline deal against an account, including structured qualification data
(BANT/MEDDIC-style) that feeds Brutus AI scoring.

```json
{
  "opportunityId": "opp_1a92",
  "accountId": "acct_7c31",
  "ownerId": "u_8f21a",
  "name": "Kestrel — Fleet Telematics Renewal",
  "stage": "negotiation",
  "amount": 42000,
  "currency": "KES",
  "expectedCloseDate": "2026-08-15",
  "qualification": {
    "budgetConfirmed": true,
    "authorityContactId": "cont_44de",
    "need": "Replace legacy tracking vendor before Q4",
    "timeline": "2026-Q3",
    "score": 72
  },
  "aiInsightJobId": "job_9f02",
  "createdAt": "2026-06-01T12:00:00.000Z",
  "updatedAt": "2026-07-04T08:10:00.000Z"
}
```

- **Relationships:** `accountId` → `accounts`, `ownerId` → `users`,
  `qualification.authorityContactId` → `contacts`, `aiInsightJobId` → `aiJobs`.
- **Indexes:** `stage ASC, expectedCloseDate ASC` (pipeline-by-stage forecast view);
  `accountId ASC, stage ASC` (an account's deals grouped by stage); `ownerId ASC,
expectedCloseDate ASC` (a rep's deals sorted by close date).
- **Security note:** write requires `owner`/`admin`/`manager`/`rep`.

## `organizations/{orgId}/tasks/{taskId}`

**Purpose:** Follow-up/action items assigned to a user, optionally tied to any other entity.

```json
{
  "taskId": "task_c210",
  "title": "Send renewal quote to Kestrel",
  "assigneeId": "u_8f21a",
  "relatedTo": { "type": "opportunity", "id": "opp_1a92" },
  "status": "open",
  "priority": "high",
  "dueDate": "2026-07-08",
  "createdAt": "2026-07-04T08:15:00.000Z",
  "updatedAt": "2026-07-04T08:15:00.000Z"
}
```

- **Relationships:** `assigneeId` → `users`; `relatedTo.id` polymorphically references whichever
  collection `relatedTo.type` names (`account`, `contact`, `opportunity`, `contract`, ...).
- **Indexes:** `assigneeId ASC, dueDate ASC` (my task list, soonest due first);
  `status ASC, dueDate ASC` (open-tasks-by-due-date board view).
- **Security note:** write requires `owner`/`admin`/`manager`/`rep`.

## `organizations/{orgId}/contracts/{contractId}`

**Purpose:** A signed commercial agreement tied to an account, tracked through renewal.

```json
{
  "contractId": "ctr_501f",
  "accountId": "acct_7c31",
  "opportunityId": "opp_1a92",
  "status": "active",
  "value": 42000,
  "currency": "KES",
  "startDate": "2026-01-01",
  "renewalDate": "2027-01-01",
  "autoRenew": true,
  "ownerId": "u_8f21a",
  "createdAt": "2026-01-01T09:00:00.000Z",
  "updatedAt": "2026-06-01T09:00:00.000Z"
}
```

- **Relationships:** `accountId` → `accounts`, `opportunityId` → `opportunities` (the deal that
  produced it), `ownerId` → `users`.
- **Indexes:** `status ASC, renewalDate ASC` (contracts up for renewal, soonest first — the
  primary renewal-risk view).
- **Security note:** write requires `owner`/`admin`/`manager` only — reps can read but not edit
  contract terms, a stricter tier than accounts/opportunities.

## `organizations/{orgId}/campaigns/{campaignId}`

**Purpose:** An Account-Based Marketing (ABM) campaign definition. BalloCRM stores campaign
targeting/config here; actual message sends happen in BalloAds, triggered via the developer API
(see [integrations.md](./integrations.md)).

```json
{
  "campaignId": "camp_33aa",
  "name": "Logistics Vertical — Q3 Renewal Push",
  "status": "running",
  "targetVertical": "logistics",
  "targetAccountIds": ["acct_7c31", "acct_9b02"],
  "balloAdsJourneyRef": "jr_onboarding_v2",
  "startDate": "2026-07-01",
  "endDate": "2026-09-30",
  "ownerId": "u_8f21a",
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-07-04T07:00:00.000Z"
}
```

- **Relationships:** `targetAccountIds[]` → `accounts`; `balloAdsJourneyRef` is an opaque
  external identifier for a BalloAds journey/trigger, not a Firestore reference.
- **Indexes:** `status ASC, startDate DESC` (active/upcoming campaigns list, newest first).
- **Security note:** write requires `owner`/`admin`/`manager` (same tier as contracts —
  campaigns commit budget and customer-facing messaging).

## `organizations/{orgId}/activities/{activityId}`

**Purpose:** The append-only event log for everything that happens to any CRM entity. This is
**both the audit trail and the data source for every "timeline" UI** (account timeline, contact
timeline, opportunity history). See "No `timeline` collection" below.

```json
{
  "activityId": "act_e10d",
  "relatedTo": { "type": "opportunity", "id": "opp_1a92" },
  "type": "stage_changed",
  "actorId": "u_8f21a",
  "occurredAt": "2026-07-04T08:10:00.000Z",
  "payload": {
    "fromStage": "proposal",
    "toStage": "negotiation"
  }
}
```

Other `type` values include `note_added`, `email_logged`, `call_logged`, `contract_signed`,
`balloads_campaign_triggered`, `ai_insight_generated`. `payload` is a loosely-typed, `type`-specific
bag validated by a discriminated Zod union in `schemas/` — not a fixed shape across all activities.

- **Relationships:** `relatedTo.id` polymorphically references any entity (`account`, `contact`,
  `opportunity`, `contract`, `campaign`); `actorId` → `users`.
- **Indexes:** `relatedTo.type ASC, relatedTo.id ASC, occurredAt DESC` — this single composite
  index is what makes "show me the timeline for this account" a fast, cheap query.
- **Security note:** `create` requires `owner`/`admin`/`manager`/`rep`; `update` and `delete` are
  `false` unconditionally — activities are immutable once written, by design.

### No separate `timeline` collection (deliberate)

BalloCRM does **not** maintain a dedicated `timeline` collection. "Customer Journey"/timeline UI
is implemented as a query over `activities` filtered by `relatedTo.type` + `relatedTo.id` and
sorted by `occurredAt`, backed by the composite index above. Duplicating the same event into a
second `timeline` collection would mean every write path has to remember to write twice, and the
two collections would inevitably drift. This is a recorded architectural decision — see
[decisions.md](./decisions.md) for the full rationale and the conditions under which it would be
revisited (see "Future migration strategy" below).

## `organizations/{orgId}/notifications/{notificationId}`

**Purpose:** In-app notifications targeted at a single user (e.g. "task assigned to you",
"opportunity you own is stalling").

```json
{
  "notificationId": "notif_ab90",
  "targetUserId": "u_8f21a",
  "type": "task_assigned",
  "title": "New task: Send renewal quote to Kestrel",
  "relatedTo": { "type": "task", "id": "task_c210" },
  "read": false,
  "readAt": null,
  "createdAt": "2026-07-04T08:15:05.000Z"
}
```

- **Relationships:** `targetUserId` → `users`; `relatedTo.id` polymorphic, as in `activities`.
- **Indexes:** `targetUserId ASC, read ASC, createdAt DESC` (a user's unread-first notification
  feed).
- **Security note:** a user may only read their own notifications (`resource.data.targetUserId
== request.auth.uid`), and may only update the `read`/`readAt` keys on their own notification
  (enforced via `diff().affectedKeys().hasOnly([...])`) — the "self-serve read receipt" pattern.
  `create`/`delete` are server-only. See [firestore-rules.md](./firestore-rules.md).

## `organizations/{orgId}/auditLogs/{logId}`

**Purpose:** A compliance-grade record of sensitive actions (role changes, contract deletions,
integration credential rotation) distinct from the business-facing `activities` feed.

```json
{
  "logId": "log_2210",
  "actorId": "u_2f00",
  "action": "role_changed",
  "targetType": "user",
  "targetId": "u_8f21a",
  "before": { "role": "viewer" },
  "after": { "role": "rep" },
  "createdAt": "2026-06-10T12:00:00.000Z"
}
```

- **Relationships:** `actorId`, `targetId` → typically `users`, but can reference any entity type
  depending on `action`.
- **Indexes:** `actorId ASC, createdAt DESC` (who-did-what audit view per actor).
- **Security note:** written only by trusted server code via the Admin SDK — `allow write: if
false` unconditionally in rules. Client SDK cannot write audit logs even with the right role,
  which is the point: audit trails must not be forgeable by the actor being audited. Read is
  restricted to `owner`/`admin`.

## `organizations/{orgId}/aiJobs/{jobId}`

**Purpose:** Tracks asynchronous Brutus AI work (qualification scoring, next-best-action,
summarization, cross-sell signals) as `queued -> running -> completed|failed` jobs, invoked from
Server Actions per [architecture.md](./architecture.md) and [integrations.md](./integrations.md).

```json
{
  "jobId": "job_9f02",
  "type": "opportunity_qualification",
  "status": "completed",
  "input": { "opportunityId": "opp_1a92" },
  "output": {
    "score": 72,
    "nextBestAction": "Schedule a renewal call before 2026-07-20",
    "rationale": "Budget confirmed, authority engaged, timeline within quarter."
  },
  "error": null,
  "requestedBy": "u_8f21a",
  "createdAt": "2026-07-04T08:09:40.000Z",
  "startedAt": "2026-07-04T08:09:41.000Z",
  "completedAt": "2026-07-04T08:09:58.000Z"
}
```

- **Relationships:** `input`/`output` reference other entities by ID depending on `type` (e.g.
  `opportunityId`, `accountId`); `requestedBy` → `users`.
- **Indexes:** `status ASC, createdAt DESC` (an org's AI job queue/history view, newest first).
- **Security note:** `allow write: if false` — jobs are created, transitioned, and completed
  exclusively by server-side Server Actions/Route Handlers via the Admin SDK, since a client
  writing `status: "completed"` directly would let a user fabricate AI output. Read is open to
  all org members so UI can poll/subscribe for job completion.

## `organizations/{orgId}/templates/{templateId}`

**Purpose:** Reusable content templates (e.g. proposal templates, campaign message templates
referenced when triggering a BalloAds send).

```json
{
  "templateId": "tmpl_0091",
  "name": "Renewal Reminder — 30 Days",
  "kind": "campaign_message",
  "body": "Hi {{contact.firstName}}, your contract with us renews on {{contract.renewalDate}}...",
  "createdBy": "u_2f00",
  "createdAt": "2026-05-01T09:00:00.000Z",
  "updatedAt": "2026-06-01T09:00:00.000Z"
}
```

- **Relationships:** `createdBy` → `users`; referenced by `campaigns` and by BalloAds trigger
  payloads (not a hard Firestore reference).
- **Indexes:** none yet — templates are listed by `kind` via simple equality, or fetched in full
  (org-scale template counts are small).
- **Security note:** write requires `owner`/`admin`/`manager`.

## `organizations/{orgId}/analyticsCache/{cacheKey}`

**Purpose:** Precomputed/cached aggregates for dashboards (pipeline velocity, forecast totals,
vertical breakdowns) so the UI doesn't recompute expensive aggregations from raw collections on
every page load.

```json
{
  "cacheKey": "pipeline_velocity_2026_q3",
  "computedAt": "2026-07-04T05:00:00.000Z",
  "expiresAt": "2026-07-04T11:00:00.000Z",
  "data": {
    "avgDaysInStage": { "prospecting": 12, "proposal": 9, "negotiation": 6 },
    "totalOpenValue": 318000
  }
}
```

- **Relationships:** none by ID — this is a derived/denormalized read model, intentionally
  decoupled from source documents.
- **Indexes:** none — always fetched by known `cacheKey`.
- **Security note:** `allow write: if false` — populated only by a scheduled server job/Server
  Action, never by client writes, so a stale or malicious client can never poison dashboard data
  other org members see.

## `organizations/{orgId}/settings/{settingId}`

**Purpose:** Per-organization configuration (pipeline stage names, notification preferences,
feature flags) that admins can tune without a deploy.

```json
{
  "settingId": "pipeline",
  "stages": [
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost"
  ],
  "defaultCurrency": "KES",
  "updatedBy": "u_2f00",
  "updatedAt": "2026-06-01T09:00:00.000Z"
}
```

- **Relationships:** `updatedBy` → `users`.
- **Indexes:** none — fetched by known `settingId` (typically read in full at org load time).
- **Security note:** write requires `owner`/`admin` only.

## `organizations/{orgId}/integrations/{provider}`

**Purpose:** Encrypted third-party credentials — one document per provider (`balloAds`,
`brutusAi`). `provider` is the document ID (e.g. `organizations/{orgId}/integrations/balloAds`).

```json
{
  "provider": "balloAds",
  "encryptedApiKey": "AQICAHi...==",
  "scope": ["developer-portal"],
  "connectedBy": "u_2f00",
  "connectedAt": "2026-05-20T09:10:00.000Z",
  "lastVerifiedAt": "2026-07-01T09:00:00.000Z"
}
```

- **Relationships:** `connectedBy` → `users`.
- **Indexes:** none — fetched by known `provider` document ID only.
- **Security note:** `allow read, write: if false` unconditionally — this collection is **never**
  touched by the client SDK in either direction. All access is server-side via the Admin SDK
  (which bypasses Firestore Security Rules entirely), so a raw API key never has a code path that
  could serve it to a browser. See [integrations.md](./integrations.md) and
  [firestore-rules.md](./firestore-rules.md).

---

## Naming conventions

- **Collections:** always plural, `camelCase` when multi-word (`analyticsCache`, `auditLogs`,
  `aiJobs`) — no snake_case, no hyphens.
- **Fields:** always `camelCase` (`healthScore`, `expectedCloseDate`), matching the TypeScript
  types inferred from the corresponding Zod schema in `schemas/`.
- **Document ID fields:** every document stores its own ID redundantly as a field matching the
  collection's singular name + `Id`-free form is not used for the doc's own ID at top level
  in some collections (e.g. `accounts` documents include `accountId` for convenience in
  denormalized reads); a reference to _another_ document is always `<singularEntity>Id`
  (`accountId`, `ownerId`, `assigneeId`, `actorId`, `targetUserId`, `authorityContactId`).
  Never store a `DocumentReference` object — always a plain string ID, so documents remain
  trivially serializable to/from Zod schemas and JSON API payloads.
- **Timestamps:** every document has `createdAt`; every mutable document has `updatedAt`.
  Immutable/append-only documents (`activities`, `auditLogs`) use a single meaningful instant
  field instead (`occurredAt`, `createdAt`) since there's nothing to "update." Stored as
  Firestore `Timestamp`, serialized to ISO-8601 strings at the API boundary — never Unix epoch
  numbers, never client-generated `Date.now()` for `createdAt` (always server timestamp).
- **Polymorphic references:** any field that can point at more than one collection is a
  `{ type: string, id: string }` object named `relatedTo`, never a bare string — this keeps
  the target collection explicit and queryable (see the `activities` composite index).
- **Enums as strings:** `stage`, `status`, `role`, `tier`, `vertical` are lowercase
  `snake_case`-free plain strings (`"negotiation"`, `"closed_won"`) validated against a Zod
  `z.enum([...])` — never numeric codes, so raw Firestore data stays human-readable in the
  console during the hackathon.

## Future migration strategy

Firestore is the right choice for the hackathon and initial production launch: it's schemaless
enough for fast iteration across three parallel developers, has first-class Firebase Auth
integration, and the query patterns above are all satisfiable with per-collection composite
indexes. That said, two realistic pressure points would force a change later:

1. **Cross-account / cross-org analytics at scale.** `analyticsCache` works as a precomputed
   read-model for dashboards, but it's a workaround, not a query engine. If commercial analytics
   grows into genuine ad-hoc BI (arbitrary group-by/joins across accounts, opportunities, and
   contracts, across many orgs), the realistic path is **not** replacing Firestore as the
   system-of-record, but adding a **read-side export**: stream Firestore changes (via Cloud
   Functions or the Firestore-to-BigQuery extension) into BigQuery, and point analytics/reporting
   UI at BigQuery instead of `analyticsCache`. Firestore stays authoritative for transactional
   writes.
2. **Collection-group query limits.** All current indexes are scoped `COLLECTION`, not
   `COLLECTION_GROUP` — queries never need to span all orgs' `opportunities` at once, which keeps
   the current model simple and avoids Firestore's collection-group index costs. If a future
   requirement needs cross-org queries (e.g. a super-admin console reporting across every
   tenant), that would require switching relevant indexes to `COLLECTION_GROUP` scope and
   re-auditing security rules, since collection-group queries can accidentally leak
   cross-tenant data if rules aren't tightened first.

Neither scenario justifies moving off Firestore entirely pre-launch; both are additive
(export/replicate), not a rewrite. If the org/account/opportunity volume ever reaches a point
where per-document reads for referential-integrity checks (`services/` verifying a referenced
`accountId` exists) become a bottleneck, that's the signal to introduce a lightweight relational
store (Postgres) specifically for reporting, fed by the same BigQuery export pipeline, rather
than trying to make Firestore do relational joins it was never designed for.
