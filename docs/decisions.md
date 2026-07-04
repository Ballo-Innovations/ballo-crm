# Architecture Decision Records

This log captures the significant technical decisions behind BalloCRM, in the lightweight ADR
format: **Context** (what forced the decision), **Decision** (what we chose), **Consequences /
Tradeoffs** (what we accept in exchange). New ADRs are appended chronologically; we do not edit
history — if a decision is reversed, a new ADR supersedes the old one and links back to it.

Related: [architecture.md](./architecture.md), [tech-stack.md](./tech-stack.md),
[risks.md](./risks.md), [glossary.md](./glossary.md).

---

## ADR-001: Next.js 15 App Router with Server Components first, Server Actions over client fetch

**Date:** 2026 (Sprint 0/1)

**Context:** BalloCRM needs a fast-to-build, fast-to-render enterprise dashboard for a hackathon
timeline, with a small team of three developers working in parallel across features. We need a
framework that minimizes client-server plumbing boilerplate (hand-rolled REST endpoints + fetch

- loading/error state for every internal mutation) so contributors can ship CRUD screens quickly
  without re-deriving data-fetching patterns each time.

**Decision:** Build on Next.js 15's App Router with React Server Components as the default for
every route. Client Components (`"use client"`) are used only where interactivity, browser APIs,
or React state/hooks are unavoidable. For internal mutations (create/update/delete against our
own Firestore data), we use **Server Actions** called directly from forms/components, not
client-side `fetch` against internal Route Handlers. Route Handlers are reserved for two cases:
endpoints a third party calls into (BalloAds webhooks) and any surface that must be a plain HTTP
endpoint by contract.

**Consequences / Tradeoffs:**

- Less client-side JavaScript shipped by default; data fetching co-located with the components
  that render it, which reduces waterfall requests.
- Server Actions give us progressive enhancement and built-in CSRF protections from Next.js,
  removing a whole class of hand-written API route + fetch wiring.
- Tradeoff: Server Actions are less visible in network tooling than REST calls, which can make
  debugging and API-contract documentation slightly less obvious to newcomers — mitigated by
  documenting every action's inputs/outputs in [api.md](./api.md).
- Tradeoff: teams more familiar with a traditional REST/SPA split have a small ramp-up cost;
  mitigated by [coding-standards.md](./coding-standards.md) and [folder-structure.md](./folder-structure.md)
  spelling out where Server Actions live per feature.

---

## ADR-002: Strict feature-based layering — UI → actions/ → services/ → repositories/ → Firestore

**Date:** 2026 (Sprint 0/1)

**Context:** Three developers (and AI coding agents) work on different CRM features
(Accounts, Opportunities, Contracts, Campaigns) concurrently. Without an enforced boundary, it is
easy for UI code to reach directly into Firestore, causing duplicated query logic, inconsistent
validation, and merge conflicts when the persistence layer changes.

**Decision:** Every feature under `features/<feature>/` follows a strict one-directional layering:
UI components call `actions/` (thin Server Action entry points) → which call `services/`
(business logic, orchestration, cross-repository composition) → which call `repositories/`
(the _only_ layer permitted to import `firebase/firestore` or `firebase-admin/firestore`
directly). UI code and services never import Firestore SDKs directly; this is treated as a lint/
review-blocking rule, not a suggestion.

**Consequences / Tradeoffs:**

- Firestore query logic is centralized and reusable/testable in isolation from UI; swapping or
  mocking the database layer for future tests only requires stubbing `repositories/`.
- Business rules (e.g., "creating an opportunity must also write an activity") live in one place
  (`services/`) instead of being scattered across components.
- Tradeoff: adds a small amount of ceremony (an extra file per operation) for what would otherwise
  be a one-line Firestore call — accepted deliberately because the repo is written to be
  navigable by both humans and AI agents working in parallel, where explicit small files beat
  compact god-files.
- Enforcement is currently by code review convention only (see ADR-006 on no CI yet); a future
  ESLint boundary rule (e.g. `eslint-plugin-boundaries`) is a candidate roadmap item.

---

## ADR-003: Firebase Auth + Firestore over a SQL database

**Date:** 2026 (Sprint 0)

**Context:** The hackathon timeline gives the team days, not weeks, to reach a working
multi-tenant CRM with auth, real-time updates, and a data model that will keep evolving as
features (Accounts, Opportunities, Contracts, AI Jobs) are added. Standing up a hosted Postgres
instance, an ORM/migration pipeline, and a separate auth provider would consume time better spent
on CRM features.

**Decision:** Use Firebase Authentication for CRM user identity and Firebase Firestore as the
primary datastore, with a multi-tenant document model (`users/{uid}` holding `orgId`/`role`, and
`organizations/{orgId}/...` subcollections per entity). This is deliberately **separate** from
BalloAds' own authentication — BalloCRM users are CRM users, not BalloAds accounts; BalloCRM calls
BalloAds only via server-held developer API keys (see ADR-007).

**Consequences / Tradeoffs:**

- Fast to stand up: no schema migrations to write, generous free tier for a hackathon-scale
  dataset, real-time listeners available for free where useful (e.g. live pipeline boards),
  and first-class integration with Vercel/Next.js and the Admin SDK for server-side trust.
- Tradeoff: Firestore's document model and lack of native joins push relational-style queries
  (e.g. "opportunities by industry vertical across accounts") toward denormalization,
  composite indexes ([indexes.md](./indexes.md)), or client-side composition — more design
  discipline required than a relational schema would need.
- Tradeoff: complex authorization (multi-tenant org isolation, per-role access) must be encoded
  entirely in [firestore-rules.md](./firestore-rules.md) rather than SQL row-level security or an
  ORM layer, which raises the stakes of a rules regression (tracked in [risks.md](./risks.md)).
- **Future migration consideration:** if BalloCRM's analytics/reporting needs grow beyond what
  Firestore's query model comfortably supports (heavy aggregation, ad-hoc joins across entities),
  a future ADR should evaluate exporting to a warehouse (e.g. BigQuery via Firestore export) or
  introducing a SQL read-replica for analytics workloads, without necessarily migrating the
  transactional/write path off Firestore.

---

## ADR-004: Redux Toolkit for client UI state only; TanStack Query owns all server data

**Date:** 2026 (Sprint 0/1)

**Context:** A common anti-pattern in React apps is using a global client store (Redux, Zustand,
etc.) to cache server data, which then requires hand-rolled invalidation, loading/error state, and
refetch logic that a dedicated server-cache library already solves well.

**Decision:** Redux Toolkit is scoped **exclusively** to client-only UI state that has no server
representation — currently `sidebarCollapsed` and `commandMenuOpen` in `store/slices/ui-slice.ts`.
All server data (accounts, opportunities, contracts, AI job status, anything that lives in
Firestore) is fetched, cached, and invalidated through TanStack Query. We explicitly do **not**
use Redux for server data caching, and no feature should introduce a Redux slice that mirrors a
Firestore collection.

**Consequences / Tradeoffs:**

- Avoids the classic dual-source-of-truth bug class where a Redux cache and the real backend
  drift out of sync.
- TanStack Query gives us request deduplication, background refetch, and cache invalidation for
  free, which is a large amount of code we don't have to write or maintain under hackathon time
  pressure.
- Tradeoff: two state systems exist in the codebase, so contributors must know which one to reach
  for. Mitigated by this ADR plus explicit guidance in
  [coding-standards.md](./coding-standards.md): "does this data come from Firestore? Use TanStack
  Query. Is it purely ephemeral UI state? Use Redux."

---

## ADR-005: shadcn/ui `radix-nova` style over the newer experimental `base-nova` (Base UI) style

**Date:** 2026 (Sprint 0)

**Context:** shadcn/ui now ships two component styles: the long-standing `radix-nova` style built
on Radix UI primitives, and a newer `base-nova` style built on the experimental `@base-ui/react`
library. `base-nova` is newer, less battle-tested, and has a smaller ecosystem of examples,
Stack Overflow answers, and third-party extensions.

**Decision:** `components.json` is configured with style `radix-nova`, base color `neutral`, and
icon library `lucide`. We chose the Radix-based style over `base-nova` for ecosystem stability
and familiarity — Radix primitives are widely used, well-documented, and any hackathon
contributor (or AI agent) is far more likely to have accurate training data and community
references for Radix-based patterns than for the newer Base UI primitives.

**Consequences / Tradeoffs:**

- Lower risk of hitting undocumented edge cases or accessibility gaps in a library that is still
  stabilizing.
- Broader compatibility with existing shadcn/ui component recipes, blog posts, and Stack Overflow
  answers, which speeds up building the many CRUD/table/form screens the product needs.
- Tradeoff: we forgo whatever incremental improvements `base-nova`/Base UI eventually offers
  (e.g., potentially smaller bundle size or different composition ergonomics); revisiting this
  choice post-hackathon, once Base UI matures, is a reasonable future ADR.

---

## ADR-006: No separate `timeline` collection — Customer Journey is a query over `activities`

**Date:** 2026 (Sprint 0)

**Context:** BalloCRM needs a "Customer Journey" / timeline view per Account and Contact showing
a chronological feed of what happened (calls logged, emails sent via BalloAds, stage changes,
notes). A naive design would write every event twice: once to an `activities` collection for the
audit trail, and again to a `timeline` collection shaped for the UI feed.

**Decision:** There is exactly one collection, `organizations/{orgId}/activities`, that serves
both the audit trail and the timeline/Customer Journey UI. The timeline is implemented as a
filtered query over `activities` (by `relatedTo.type` + `relatedTo.id`), backed by a composite
index already defined in `firestore.indexes.json`. No separate `timeline` collection exists or is
planned.

**Consequences / Tradeoffs:**

- Eliminates dual-write inconsistency risk entirely: it is structurally impossible for the
  timeline and the audit log to disagree, because they are the same underlying data read two
  ways.
- Simpler mental model and less Firestore write volume/cost — one write per event, not two.
- Tradeoff: the `activities` document shape must be generic enough to serve both an audit
  record and a rendered timeline entry (e.g., carrying enough denormalized display data —
  actor name, a human-readable summary — to avoid N+1 lookups when rendering the feed). This
  constraint is documented in [database-schema.md](./database-schema.md).
- Tradeoff: if audit and timeline needs diverge significantly in the future (e.g., timeline needs
  aggressive pagination/filtering that conflicts with audit retention requirements), this
  decision may need revisiting in a superseding ADR.

---

## ADR-007: BalloAds integration exclusively via `/v1/developer-portal/*` REST APIs, server-side only

**Date:** 2026 (Sprint 0)

**Context:** BalloAds is an existing, production C#/.NET messaging platform with its own SMS,
WhatsApp, Email delivery, automation/journey engine, and authentication. BalloCRM's explicit
non-goals rule out reimplementing any messaging delivery, opt-out tracking, or a second
authentication system for messaging.

**Decision:** BalloCRM talks to BalloAds **only** through its documented `/v1/developer-portal/*`
REST API surface, using per-organization developer API keys stored encrypted at
`organizations/{orgId}/integrations/balloAds` in Firestore. All calls happen server-side (Server
Actions or Route Handlers for inbound webhooks) — the developer API key is never sent to or
readable by the browser. When a CRM workflow needs to trigger messaging (e.g., "send onboarding
sequence" on an opportunity stage change), it calls the relevant BalloAds endpoint and logs the
call as a CRM `Activity`; it does not implement its own send loop. Read-only data BalloAds can
plausibly expose (health score, delivery/opt-out status) is treated as an external enrichment
field, not something BalloCRM computes or owns.

**Consequences / Tradeoffs:**

- Avoids duplicating a production system: no second SMS/WhatsApp/Email pipeline, no second
  opt-out ledger, no second automation engine to build, test, and keep compliant.
- Keeps a single source of truth for delivery status and opt-outs (BalloAds), preventing
  BalloCRM's UI from ever showing stale or contradictory delivery state.
- API keys never reaching the client eliminates an entire class of credential-leak risk (see
  [risks.md](./risks.md) for the specific mitigation around accidental client-bundle imports).
- Tradeoff: BalloCRM is fully dependent on BalloAds' API availability and rate limits for any
  messaging-triggering feature and for enrichment data (health score, opt-outs) — tracked as an
  external-dependency risk in [risks.md](./risks.md). Exact endpoint paths/payloads are marked
  "to be confirmed" in [integrations.md](./integrations.md) until the OpenAPI spec is supplied.

---

## ADR-008: AI work modeled as async, trackable `aiJobs` documents

**Date:** 2026 (Sprint 0)

**Context:** Brutus AI powers opportunity qualification scoring, next-best-action
recommendations, summarization, cross-sell/upsell detection, and natural-language analytics.
Some of these calls can be slow or rate-limited, and a hackathon demo cannot afford a UI that
blocks on a synchronous AI call inside a Server Action request/response cycle, nor the
reliability risk of losing a result if a request times out.

**Decision:** AI work is modeled as `aiJobs` documents in Firestore
(`organizations/{orgId}/aiJobs`) with a `queued -> running -> completed|failed` lifecycle. A
Server Action enqueues a job and returns immediately; the job is processed and its status/result
updated in Firestore, which the UI observes via a live listener or TanStack Query polling. True
synchronous, long-lived client-side streaming is reserved only for cases with a specific
interactive UI need, such as a chat-style assistant panel.

**Consequences / Tradeoffs:**

- Resilient to slow or flaky AI calls: a failed job is visible and retryable state, not a lost
  request.
- Keeps Server Actions fast and avoids tying up serverless function execution time/cost waiting
  on a third-party AI call.
- Gives the product a natural place to show progress ("Brutus is analyzing this account...") and
  a natural audit trail of AI usage per org.
- Tradeoff: adds latency-to-first-result compared to a hypothetical synchronous call, and
  requires the UI to handle a pending/loading state per job rather than a simple await — accepted
  because it is more robust for a live demo and for production AI provider variability (see
  [risks.md](./risks.md) on Brutus availability/rate limits).

---

## ADR-009: Zod as the single source of truth for data shapes, with inferred TypeScript types

**Date:** 2026 (Sprint 0)

**Context:** Data crosses several trust boundaries in this app — form input, Server Action
payloads, Firestore documents, and external API responses (BalloAds, Brutus). Hand-maintaining
separate TypeScript interfaces and runtime validators for the same shape is a common source of
drift bugs (the type says a field is required; the runtime check forgot to enforce it).

**Decision:** Every user-supplied or boundary-crossing shape is defined once as a Zod schema in
`schemas/`, and the corresponding TypeScript type is inferred via `z.infer<...>` rather than
hand-written. React Hook Form uses `@hookform/resolvers/zod` to validate forms against the same
schema that validates the Server Action payload and, where relevant, the Firestore document
shape.

**Consequences / Tradeoffs:**

- One definition per shape means the compiler and the runtime validator can never disagree.
- Validation errors are consistent and reusable across the form layer, the action layer, and any
  future API layer.
- Tradeoff: Zod schemas for complex nested Firestore documents can become verbose; this is
  accepted in exchange for the safety guarantee, and shared sub-schemas are factored out to keep
  them manageable (see [coding-standards.md](./coding-standards.md)).

---

## ADR-010: Strict TypeScript, no `any`

**Date:** 2026 (Sprint 0)

**Context:** The codebase is built to be navigable and safely extendable by multiple humans and
AI coding agents working in parallel across features, often without a live conversation to
resolve ambiguity. Loose typing (`any`, implicit `any`, unchecked casts) is the single easiest way
for an AI agent or a rushed contributor to introduce a silent runtime bug under time pressure.

**Decision:** TypeScript is configured in strict mode across the project, and `any` is
disallowed (enforced via ESLint). Boundary-crossing values are typed via Zod inference (ADR-009)
rather than manual annotation or casting.

**Consequences / Tradeoffs:**

- Compile-time errors catch a large class of mistakes before they reach a demo, which matters
  disproportionately given there is no test suite yet (see [risks.md](./risks.md)).
- Makes the codebase substantially easier for an AI agent to reason about correctly, since types
  encode real constraints rather than acting as documentation that can silently go stale.
- Tradeoff: occasionally slower to write code against a genuinely dynamic or third-party
  untyped shape (e.g., a BalloAds API response before its contract is confirmed) — the
  convention is to model the _expected_ shape as a Zod schema and validate/parse at the
  boundary rather than reaching for `any` as an escape hatch.

---

## ADR-011: Vercel as the hosting target

**Date:** 2026 (Sprint 0)

**Context:** The team needs zero-friction deploys during a fast-moving hackathon, with preview
deployments per pull request so three developers can review each other's work without merging
first, and first-class support for the exact framework features being used (App Router, Server
Actions, Server Components, middleware).

**Decision:** Deploy BalloCRM to Vercel, using its native Next.js integration (preview
deployments per branch/PR, environment variable management per environment, Edge middleware
support).

**Consequences / Tradeoffs:**

- Every feature branch gets a shareable preview URL for demos and review with zero deploy
  configuration, which matters for a judged hackathon.
- Vercel's first-party Next.js support means Server Actions, RSC streaming, and middleware behave
  exactly as documented, avoiding the platform-compatibility debugging that a generic Node host
  might introduce.
- Tradeoff: introduces a degree of platform coupling (some Vercel-specific behaviors, e.g. Edge
  runtime constraints referenced in `middleware.ts`); acceptable given the team is not
  optimizing for portability during the hackathon. See [deployment.md](./deployment.md) for
  environment-specific configuration.
