# Integrations

BalloCRM has exactly two external integrations: **BalloAds** (messaging/automation, the parent
company's production platform) and **Brutus AI** (commercial intelligence). This document is the
contract for both. Read it alongside [`architecture.md`](./architecture.md) (layering rules) and
[`environment.md`](./environment.md) (full env var reference).

## The non-negotiable rule

**BalloCRM never reimplements SMS, WhatsApp, Email delivery, template rendering, or its own
messaging authentication.** Every time this document describes a capability, it is describing a
call _into_ BalloAds — never a parallel implementation inside BalloCRM. This is repeated
throughout this file deliberately, because it is the single most important architectural boundary
in the product: if a feature spec ever implies "send an SMS from BalloCRM," the correct reading is
"call the BalloAds developer-portal API to send an SMS," full stop. See
[Integration boundaries](#integration-boundaries) below for the checklist form of this rule.

## BalloAds Developer Portal API

### What it is

BalloAds is Infratel's existing, production C#/.NET messaging platform. It has its own
authentication, its own SMS/WhatsApp/Email delivery infrastructure, and its own automation engine
("Journeys"). BalloCRM does not fork, embed, or reimplement any of it. BalloCRM integrates with
BalloAds **exclusively** through its `/v1/developer-portal/*` REST surface, using a per-organization
developer API key.

### Configuration and credential storage

| Concern                        | Value                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL env var               | `BALLOADS_API_BASE_URL` (e.g. `https://api.balloads.com/v1/developer-portal`)                                                                     |
| API key env var                | `BALLOADS_DEVELOPER_API_KEY`                                                                                                                      |
| Where validated                | `config/env.ts`, `getServerEnv()` (Zod)                                                                                                           |
| Where credentials live at rest | Firestore: `organizations/{orgId}/integrations/balloAds`                                                                                          |
| Firestore access rule          | `allow read, write: if false` — no client SDK path can ever read or write this document; all access is via the Admin SDK from trusted server code |

Both env vars are **server-only**. They must never be read from a Client Component, never appear
in a `NEXT_PUBLIC_*` variable, and never be serialized into a prop passed from a Server Component
to a Client Component. Per-organization keys stored in `organizations/{orgId}/integrations/balloAds`
let each tenant connect their own BalloAds account; `BALLOADS_DEVELOPER_API_KEY` in `.env` is the
fallback/dev-time key used before per-org credential management ships.

### Where the client code lives

`lib/balloads/` is the designated home for the BalloAds API client (per `lib/README.md`). **This
client does not exist yet** — it is a Sprint task (see [`tasks/backlog.md`](./tasks/backlog.md) /
the relevant sprint file), not shipped code. When built, it is the _only_ module allowed to hold
`BALLOADS_API_BASE_URL` / `BALLOADS_DEVELOPER_API_KEY` and make HTTP calls to BalloAds; `services/`
composes it into business operations (e.g. "advance opportunity stage and trigger onboarding
sequence"), and `actions/`/`features/*/actions/` are the only callers of those services. UI code
never imports `lib/balloads/` directly, and no BalloAds call is ever made from a Client Component,
a browser `fetch`, or Edge middleware — always a Server Action or Route Handler running in a
Node.js server runtime.

### Realistic capability surface

The hackathon has not supplied a live OpenAPI spec for the developer-portal API. The capabilities
below are grounded in real BalloAds internal engineering notes
([`reference/balloads-crm-backend-notes.md`](./reference/balloads-crm-backend-notes.md)) describing
what the platform actually computes and tracks server-side — they describe what is _plausible to
expose_ via a developer API, not a confirmed contract. Every endpoint path and payload shape below
is marked **TBC against the live BalloAds developer-portal OpenAPI spec** and must not be treated
as final until that spec is confirmed.

1. **Send a message / trigger a journey.** BalloCRM calls a `/v1/developer-portal/*` endpoint to
   enrol a company/contact into a BalloAds journey or fire a one-off send (e.g. "send onboarding
   sequence" when a CRM opportunity moves to Closed-Won). Path/payload: TBC. Every such call is
   logged as a CRM `Activity` (see [`database-schema.md`](./database-schema.md)) so the
   Account/Contact timeline shows "Onboarding journey triggered via BalloAds" — BalloCRM does not
   run the journey itself, it only requests it and records that it did.
2. **Read delivery status / message logs.** BalloAds tracks per-send status (`queued`,
   `logged_only`, `opted_out`, and presumably `delivered`/`failed` states) in its own
   `CrmMessageLog`. BalloCRM reads this back via the developer API to render delivery status in the
   Contact/Account timeline — it does not maintain its own delivery ledger. Endpoint: TBC.
3. **Read opt-out status.** BalloAds tracks opt-outs per `(CompanyId, Channel)`
   (`CrmCompanyOptOut`). BalloCRM reads opt-out state via the developer API before _displaying_ a
   "send" affordance in the UI (e.g. graying out "Send SMS" for an opted-out contact) — it never
   maintains a second, possibly-stale opt-out list of its own. Endpoint: TBC.
4. **Read a company's Health Score (optional enrichment).** BalloAds computes a `HealthScore`
   (0-100, default 50) from a weighted model (activity recency, credit runway, payment reliability,
   campaign cadence, sender/platform readiness) with a `HealthScoreBreakdownJson` for auditability.
   If the developer API exposes this, BalloCRM's Accounts feature surfaces it as a **read-only,
   externally-supplied enrichment field** on the Account record — labeled clearly as coming from
   BalloAds (e.g. "BalloAds Health Score") — and BalloCRM never computes its own version of this
   score. If the field isn't exposed by the time it's needed, the Account UI simply omits it rather
   than approximating it locally.

### Naming collision: "Journey" means two different things

This is a recurring source of confusion and must be actively guarded against in code, docs, and
UI copy:

- **BalloAds Journey** — BalloAds' own automation/workflow engine (trigger catalog like
  `new_signup`, `payment_failed`, `credits_low`, `inactive_30d`; node types like `sms`, `delay`,
  `condition`, `stop`). This is BalloAds' product, not BalloCRM's. BalloCRM only _triggers_ these
  from the outside, via the developer API.
- **BalloCRM Customer Journey** — a CRM-native concept: lifecycle stage tracking for an
  Account/Contact (e.g. Lead → Qualified → Onboarding → Active → At Risk → Churned). This lives
  entirely in BalloCRM's own Firestore data model and has no relationship to BalloAds' internal
  state machine beyond the fact that a BalloCRM lifecycle-stage change may be the _trigger_ for
  calling a BalloAds journey.

**Naming convention to prevent collision:** any code, type, variable, or UI string referring to the
BalloAds concept is prefixed `balloAds` (e.g. `balloAdsJourneyId`, `triggerBalloAdsJourney()`,
`lib/balloads/journeys.ts`). Anything referring to the CRM concept uses `customerJourney` /
`lifecycleStage` (e.g. `customerJourneyStage`, `features/customer-journey/`). Never use the bare
word "journey" unqualified in a shared module, a Zod schema field name, or a Firestore field —
always qualify it. Reviewers should treat an unqualified `journey` identifier as a review blocker.

## Brutus AI

### What it's used for

Brutus AI is BalloCRM's AI provider for commercial intelligence, not messaging. Concretely:

- **Opportunity qualification scoring** — structured BANT/MEDDIC-style scoring of an opportunity
  from its recorded fields and activity history.
- **Next-best-action** — a recommended next step for a rep on a given Account/Opportunity.
- **Summarization** — condensing an Account or Contact's activity/communication history into a
  short brief (e.g. for a rep prepping for a call).
- **Cross-sell / upsell signal detection** — flagging accounts that look like candidates based on
  usage/health/plan signals.
- **Natural-language commercial analytics** — "ask a question about your pipeline" style querying
  over CRM data.

### Configuration and client location

| Concern          | Value                                            |
| ---------------- | ------------------------------------------------ |
| Base URL env var | `BRUTUS_AI_API_BASE_URL`                         |
| API key env var  | `BRUTUS_AI_API_KEY`                              |
| Where validated  | `config/env.ts`, `getServerEnv()` (Zod)          |
| Client location  | `lib/brutus/` — **not yet built**, a Sprint task |

Both env vars are server-only, validated by the same `getServerEnv()` Zod schema as the BalloAds
credentials, and must never reach the browser. As with `lib/balloads/`, `lib/brutus/` will be the
only module making HTTP calls to Brutus AI; `services/` composes it into business operations.

### The async AI Job pattern

Brutus AI calls are modeled as asynchronous, Firestore-tracked jobs — never as a request the UI
blocks on synchronously (with the narrow exception of a future chat-style assistant panel that
might stream a response directly). The collection is `organizations/{orgId}/aiJobs/{jobId}`
(already reserved in `firestore.rules` — `allow read: if isOrgMember(orgId); allow write: if
false`, since only trusted server code via the Admin SDK ever writes an AI job). See
[`database-schema.md`](./database-schema.md) for the full document shape.

States: `queued -> running -> completed | failed`.

Typical sequence for, say, "qualify this opportunity":

1. **UI action.** A rep clicks "Qualify with Brutus AI" on an Opportunity detail page. This calls a
   Server Action (e.g. `features/opportunities/actions/qualify-opportunity.ts`).
2. **Job creation.** The Server Action's service function writes an `aiJobs` document with
   `status: "queued"`, `type: "opportunity_qualification"`, a reference to the target entity
   (`relatedTo: { type: "opportunity", id }`), `requestedBy`, and a `createdAt` timestamp. It
   returns the shared Server Action result shape immediately (`{ ok: true, data: { jobId } }`) —
   the rep is not kept waiting on the AI call itself.
3. **Background invocation.** Something advances the job to `running` and calls Brutus AI via
   `lib/brutus/`. For this hackathon's scale, that "something" is expected to be either a follow-up
   step in the same Server Action (fire-and-forget after returning, where the platform allows it)
   or a Route Handler invoked as a lightweight background trigger — the exact mechanism is a
   Sprint-level implementation decision to record in [`decisions.md`](./decisions.md) once made, but
   the Firestore job document is the contract either way.
4. **Result write-back.** On success, the job document is updated to `status: "completed"` with a
   `result` payload (e.g. the qualification score and rationale) and `completedAt`. On failure, it's
   updated to `status: "failed"` with an `error` field — the failure is never silently dropped.
5. **UI observes completion.** The UI either polls the job via a TanStack Query query keyed on
   `jobId` (short interval while `status` is `queued`/`running`, stopped once terminal) or subscribes
   to the Firestore document directly with an `onSnapshot` listener for near-real-time updates. Either
   approach reads only from `aiJobs`; there is no separate "AI result" collection.

This pattern keeps the UI responsive, keeps AI latency off the request/response critical path, and
gives every AI-driven insight an audit trail (who requested it, when, what came back) for free.

## Integration boundaries

Restating the non-goals from [`vision.md`](./vision.md) as an explicit checklist — every PR that
touches messaging or AI should be checked against this:

- [ ] BalloCRM does **not** build SMS, WhatsApp, or Email sending/delivery infrastructure of any
      kind — all sends go through the BalloAds developer-portal API.
- [ ] BalloCRM does **not** build message template rendering — that stays inside BalloAds.
- [ ] BalloCRM does **not** implement a second authentication system for messaging — BalloAds auth
      stays inside BalloAds; BalloCRM has its own Firebase Auth for CRM users only, and calls
      BalloAds as a service using per-organization developer API credentials.
- [ ] BalloCRM does **not** duplicate BalloAds' journey/automation engine (no CRM-side trigger
      scanner, dispatch service, or opt-out ledger that re-implements `CrmJourneyTriggerService` /
      `ICrmDispatchService` / `CrmCompanyOptOut`). If a workflow needs to send a message, it calls a
      BalloAds endpoint; it reads status/opt-outs back rather than tracking them independently.
- [ ] `BALLOADS_DEVELOPER_API_KEY`, `BRUTUS_AI_API_KEY`, and any per-org integration credentials in
      `organizations/{orgId}/integrations/*` never reach a Client Component, a browser network
      request, or a `NEXT_PUBLIC_*` env var.
- [ ] The word "journey" is never used unqualified in shared code — see the naming-collision
      section above.
