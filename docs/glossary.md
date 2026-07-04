# Glossary

Domain terms used across the BalloCRM documentation and codebase. Alphabetical. If a term you
need isn't here, add it in the same change that introduces it elsewhere in `/docs`.

## ABM (Account-Based Marketing)

A go-to-market strategy that targets a defined set of high-value accounts with coordinated,
personalized outreach, rather than broad lead-based marketing. In BalloCRM, ABM surfaces as
account-level targeting lists, campaign-to-account association, and vertical/segment filtering
used to decide which accounts receive coordinated outreach. ABM outreach is executed through
BalloAds (see [Developer Portal API](#developer-portal-api)); BalloCRM's role is planning,
targeting, and tracking results, not sending messages itself.

## Account

The core CRM entity representing a company or organization that BalloCRM's tenant org sells to or
manages a relationship with. An Account has Contacts, Opportunities, Contracts, an optional
externally-supplied [Health Score](#health-score), and a [Customer Journey](#customer-journey)
lifecycle stage. Stored at `organizations/{orgId}/accounts/{accountId}` - see
[database-schema.md](./database-schema.md). Not to be confused with `Organization` (the BalloCRM
tenant itself - see [Organization](#organization-org)).

## Activity

A logged event associated with an Account, Contact, Opportunity, or Contract - a call, an email,
a stage change, a note, or a BalloAds message dispatch triggered from the CRM. Activities are the
single write path for anything that should appear in a [Timeline](#timeline); there is no separate
timeline collection. See [decisions.md](./decisions.md) for why timeline and audit trail share one
collection.

## AI Commercial Intelligence

The umbrella term for BalloCRM's [Brutus AI](#brutus-ai)-powered features: opportunity
qualification scoring, next-best-action recommendations, account/contact summarization, and
cross-sell/upsell signal detection. Each individual invocation runs as an [AI Job](#ai-job).

## AI Job

An asynchronous, Firestore-tracked unit of work representing a single Brutus AI invocation
(`queued -> running -> completed|failed`), stored at
`organizations/{orgId}/aiJobs/{jobId}`. AI Jobs are created by Server Actions and never block a
page render on a long-running model call; UI polls or subscribes to job status instead of holding
a live AI connection open, except where a feature explicitly needs a chat-style streaming panel.

## BalloAds Journey

BalloAds' own trigger-based messaging automation engine (e.g., `new_signup`, `payment_failed`,
`plan_upgraded`, `credits_low`, `inactive_30d` triggers driving SMS/email/WhatsApp sends). This is
a **separate concept from BalloCRM's [Customer Journey](#customer-journey)** and lives entirely
inside BalloAds - BalloCRM never reimplements it. BalloCRM may _trigger_ a BalloAds Journey (for
example, enrolling an account via its `/journeys/enrol`-equivalent developer-portal endpoint when
an Opportunity reaches a given stage) and logs that call as a CRM [Activity](#activity), but it
does not own the automation logic, node graph, or delivery loop. See
[integrations.md](./integrations.md).

## Brutus AI

BalloCRM's AI provider, responsible for all [AI Commercial Intelligence](#ai-commercial-intelligence)
features. Invoked server-side only, from Server Actions, as [AI Jobs](#ai-job).

## CIMS (Customer Information Management System)

The foundational record-keeping layer of BalloCRM: structured storage of
[Accounts](#account), [Contacts](#contact), and their relationships, replacing the fragmented
spreadsheets commercial teams historically used. CIMS is not a separate module in the codebase -
it's the umbrella term for the Accounts + Contacts data model described in
[database-schema.md](./database-schema.md).

## Commercial Analytics

Dashboards and reporting built on CRM data: pipeline velocity, win rate, forecast, account health
distribution, and vertical performance. Computed from Firestore data (optionally cached in
`organizations/{orgId}/analyticsCache`) and rendered with Recharts. Distinct from
[AI Commercial Intelligence](#ai-commercial-intelligence), which produces AI-generated
recommendations rather than aggregate reporting - though analytics views may surface AI-derived
signals like health score trends.

## Contact

An individual person associated with an [Account](#account) - a stakeholder, decision-maker, or
day-to-day point of contact. Stored at `organizations/{orgId}/contacts/{contactId}`, referencing a
parent account. Contacts can have their own [Activity](#activity) timeline and, where BalloAds
exposes it, individual delivery/opt-out status per messaging channel.

## Contract

A binding commercial agreement tied to an [Account](#account) and, typically, a won
[Opportunity](#opportunity) - tracks terms, value, start/end dates, and renewal date. Stored at
`organizations/{orgId}/contracts/{contractId}`. Contract renewal proximity is one of the signals
feeding [Cross-sell / Upsell](#cross-sell--upsell) detection and Customer Success workflows.

## Cross-sell / Upsell

AI-detected commercial signals indicating an existing account is a candidate for additional
product/service revenue: cross-sell (a different product line) or upsell (more of the same). Part
of [AI Commercial Intelligence](#ai-commercial-intelligence), derived from account health,
contract status, opportunity history, and usage/activity signals.

## Customer Journey

BalloCRM's **CRM-native** lifecycle-stage tracking for an Account or Contact (e.g., lead →
qualified → active customer → renewal → churned/expanded). This is a distinct concept from
[BalloAds Journey](#balloads-journey), which is BalloAds' messaging automation engine - the two
share the word "journey" but nothing else. BalloCRM's Customer Journey stage lives in the CRM data
model and can be one of the inputs used to decide _when_ to trigger a BalloAds Journey, but it is
never itself an automation/messaging engine. Always qualify which one you mean in code and docs
(`customerJourneyStage` vs. calling out "BalloAds Journey" explicitly) to avoid the naming
confusion this term invites.

## Developer Portal API

The `/v1/developer-portal/*` REST surface exposed by BalloAds - the **only** integration path
BalloCRM uses to reach BalloAds. Authenticated with a per-organization developer API key stored
encrypted at `organizations/{orgId}/integrations/balloAds`, called exclusively from server-side
code (Route Handlers or Server Actions). See [integrations.md](./integrations.md) for endpoint
details and their confirmation status.

## Health Score

A 0–100 score (default 50) representing an Account's engagement/risk level, computed by BalloAds
from a weighted model (activity recency, credit runway, payment reliability, campaign cadence,
sender verification/platform readiness) with a breakdown stored for auditability. BalloCRM treats
Health Score as an **externally-supplied enrichment field** read via the
[Developer Portal API](#developer-portal-api) and displayed on the Account - it does not
recompute or own this calculation.

## Opportunity

A tracked, in-progress deal associated with an [Account](#account), moving through pipeline
stages toward won/lost. Stored at `organizations/{orgId}/opportunities/{opportunityId}`.
Opportunities carry [Opportunity Qualification](#opportunity-qualification) fields and feed
[Commercial Analytics](#commercial-analytics) (pipeline velocity, forecast).

## Opportunity Qualification

Structured scoring applied to an [Opportunity](#opportunity) using BANT- or MEDDIC-style fields
(budget, authority, need, timeline / metrics, economic buyer, decision criteria, etc.), used to
gate stage progression and improve forecast reliability. Qualification scoring can be manual
(rep-entered) or AI-assisted via [Brutus AI](#brutus-ai) as part of
[AI Commercial Intelligence](#ai-commercial-intelligence).

## Organization (Org)

The BalloCRM tenant - a single customer of BalloCRM, not to be confused with an [Account](#account)
(a company that tenant sells to). All CRM data is scoped under
`organizations/{orgId}/...` subcollections; a BalloCRM user (`users/{uid}`) belongs to exactly one
organization and holds a [Role](#role) within it. Each Organization holds its own BalloAds and
Brutus AI integration credentials, isolated from every other Organization.

## Role

A user's permission level within an [Organization](#organization-org): `owner`, `admin`,
`manager`, `rep`, or `viewer`, in descending order of privilege. Enforced in Firestore security
rules and re-checked in Server Actions; see [firestore-rules.md](./firestore-rules.md) for the
exact rule set per role and collection.

## Timeline

The chronological view of everything that happened on an Account, Contact, Opportunity, or
Contract, rendered from a query over the shared [Activity](#activity) collection filtered by
`relatedTo.type` and `relatedTo.id`. There is deliberately no separate `timeline` collection -
see [decisions.md](./decisions.md).

## Vertical Sales Indexing

Segmentation of Accounts and Opportunities by industry vertical (e.g., healthcare, retail,
fintech), used to slice [Commercial Analytics](#commercial-analytics), target
[ABM](#abm-account-based-marketing) campaigns, and benchmark pipeline performance across
verticals rather than only in aggregate.
