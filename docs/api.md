# API

BalloCRM has almost no API code written yet - as of this document, `actions/`, `repositories/`,
and `services/` contain only their convention `README.md` files, and `app/` has no route handlers
beyond the root layout/page. This document is therefore **the contract**: the pattern every Server
Action and Route Handler must follow once written, illustrated with worked examples. Treat
deviations from this contract as bugs, not style preferences. See
[`architecture.md`](./architecture.md) for the layering this contract sits on top of
(`actions/` → `services/` → `repositories/`) and [`coding-standards.md`](./coding-standards.md) for
naming/file-organization rules.

## General conventions

### Server Actions are the primary API surface

UI-initiated writes (create/update/delete an Account, advance an Opportunity stage, etc.) go
through **Server Actions** (`"use server"` functions), not a REST endpoint the client `fetch`es.
Reads for Server Components happen via direct server-side data access (repository/service calls in
the Server Component tree); reads for Client Components go through TanStack Query calling a Server
Action. Route Handlers (`app/api/**/route.ts`) are reserved for the narrow case of something a
_third party_ calls into - see [Route Handlers](#route-handlers-webhookscallbacks-only) below.

### Shared result shape

Every Server Action returns a discriminated union - never throws for an _expected_ failure
(validation, authorization, not-found), and never returns raw Firestore data or a raw error object:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string; // e.g. "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR"
        message: string; // safe to show to the user
        fieldErrors?: Record<string, string[]>; // present for VALIDATION_ERROR only
      };
    };
```

This shape is defined once (a shared type in `types/` per `types/README.md`, since it doesn't
derive from a Zod schema) and reused by every action. UI code always checks `result.ok` before
touching `result.data`; it never assumes success.

### Zod validation errors map directly onto the result shape

Every Server Action's first step is parsing its input with a Zod schema from `schemas/` or the
owning feature's `features/<feature>/schemas/`. On `safeParse` failure, `error.flatten().fieldErrors`
maps directly onto `error.fieldErrors` in the result, `error.code` is `"VALIDATION_ERROR"`, and
`error.message` is a generic, user-safe string (e.g. "Please fix the highlighted fields") - the
raw Zod issue messages populate `fieldErrors`, not the top-level `message`, so client code can
render per-field errors next to the offending inputs (React Hook Form + `@hookform/resolvers/zod`
consumes the same schema client-side for instant feedback, but the server re-validates
unconditionally - client-side validation is a UX nicety, never the security boundary).

### Auth context is derived server-side, never trusted from the client

A Server Action never accepts `orgId`, `uid`, or `role` as a parameter from client-supplied
arguments or `FormData`. Instead, every action starts by resolving the caller's identity from the
verified session on the server (reading the Firebase session cookie via `lib/firebase/admin.ts`,
looking up `users/{uid}` for `orgId` and `role`), and every subsequent repository/service call is
scoped to that resolved `orgId`. This mirrors why `middleware.ts` only checks for the _presence_ of
the `__session` cookie (Edge runtime can't run the Admin SDK) - real verification, and the
derivation of `uid`/`orgId`/`role`, happens inside the Server Action/Server Component, not in
middleware and not from anything the client asserts about itself. Role checks (e.g. "only
`owner`/`admin`/`manager`/`rep` may write an Account," matching `firestore.rules`) are enforced in
the service layer using this server-derived role, as defense in depth alongside the Firestore
rules themselves.

## Route Handlers (webhooks/callbacks only)

Route Handlers under `app/api/` exist only for inbound calls from a third party - BalloAds
callbacks today, potentially other webhook sources later. They are never used as a REST API for
BalloCRM's own frontend.

### `POST /api/webhooks/balloads`

BalloAds delivery-status callback - notifies BalloCRM when a previously-triggered send/journey
step changes status (e.g. delivered, failed, opted-out), so the Account/Contact timeline can be
updated without polling.

**Request**

- Method: `POST`
- Headers: a signature/shared-secret header authenticating the sender - **exact header name and
  signing scheme TBC pending BalloAds' webhook documentation** (commonly an HMAC signature header
  such as `X-BalloAds-Signature`, but this must not be hard-coded into implementation until
  confirmed against real BalloAds docs).
- Body (illustrative shape, fields TBC against the live contract):
  ```json
  {
    "eventId": "string (idempotency key)",
    "eventType": "message.delivered | message.failed | opt_out.created | ...",
    "companyId": "string (BalloAds-side identifier)",
    "channel": "sms | whatsapp | email",
    "occurredAt": "ISO 8601 timestamp",
    "payload": { "...": "event-specific fields, TBC" }
  }
  ```

**Response**

- `200 OK` with `{ "received": true }` on successful processing (including "already processed,"
  see idempotency below) - BalloAds should treat a `200` as "stop retrying."
- Non-2xx signals BalloAds to retry per its own retry policy.

**Authentication**

Shared-secret or signature-header verification against a secret stored server-side (co-located
with `BALLOADS_DEVELOPER_API_KEY` handling, never a `NEXT_PUBLIC_*` value). **Exact mechanism is
TBC pending the BalloAds webhook reference** - this handler must reject any request that fails
verification with `401` before doing any further work, including before touching Firestore.

**Validation**

Request body is parsed with a Zod schema (e.g. `schemas/balloads-webhook-event-schema.ts`) before
any handling logic runs. An unrecognized `eventType` is accepted with `200` and logged/ignored
(forward-compatible with new BalloAds event types) rather than rejected, so BalloAds doesn't retry
indefinitely on events this version of BalloCRM doesn't yet understand.

**Errors**

- `400` - signature present but body fails Zod validation (malformed payload).
- `401` - missing or invalid signature/shared secret.
- `404` - is not used for "unknown event type" (see Validation above); it's reserved for genuinely
  wrong paths.
- `5xx` - reserved for internal faults only (e.g. Firestore write failure) so BalloAds' retry
  behavior is meaningful - a `5xx` should mean "try again later," never "your payload was wrong."

**Rate limiting**

Relies on Vercel/edge-level DDoS and abuse protection rather than a bespoke in-app limiter for
this hackathon's scope. Because webhook delivery can retry on transient failures, the handler is
expected to be **idempotent**: it upserts on `eventId` (storing processed event IDs, or using them
as the Activity's own document ID / a dedupe field) so a duplicate delivery of the same `eventId`
is a no-op rather than a duplicate timeline entry.

## Worked example Server Action: `createAccount`

Represents the general Server Action shape every future action follows. Lives at
`features/accounts/actions/create-account.ts` per the feature-folder convention.

**Request**

Input is a plain object (from a form via React Hook Form, or a direct call), validated against a
Zod schema, e.g.:

```ts
const createAccountSchema = z.object({
  name: z.string().min(1).max(200),
  industryVertical: z.string().min(1), // see database-schema.md for the vertical taxonomy
  website: z.string().url().optional(),
  primaryContactId: z.string().optional(),
});
```

Note `orgId` and `createdBy` are **not** part of this schema - they are derived server-side, not
supplied by the caller (see [Auth context](#auth-context-is-derived-server-side-never-trusted-from-the-client)).

**Response**

```ts
ActionResult<{ accountId: string }>;
```

On success: `{ ok: true, data: { accountId: "abc123" } }`. On failure, one of the `error.code`
cases below.

**Authentication**

The action resolves the caller's session server-side (verified Firebase session, not the
middleware's cookie-presence check), loads `users/{uid}` for `orgId` and `role`, and rejects with
`UNAUTHORIZED` if there is no valid session. `orgId` used for the write is always the
server-resolved one.

**Validation**

`createAccountSchema.safeParse(input)`. On failure: `{ ok: false, error: { code:
"VALIDATION_ERROR", message: "Please fix the highlighted fields", fieldErrors } }`.

**Errors**

| `error.code`       | Cause                                                                                           | HTTP-equivalent intent |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------- |
| `VALIDATION_ERROR` | Zod parse failure                                                                               | 400                    |
| `UNAUTHORIZED`     | No valid session, or role not in `["owner","admin","manager","rep"]` per `firestore.rules`      | 401/403                |
| `NOT_FOUND`        | `primaryContactId` references a contact that doesn't exist in this org                          | 404                    |
| `INTERNAL_ERROR`   | Firestore write failure or unexpected exception - logged server-side, generic message to client | 500                    |

**Rate limiting**

Not applicable for this hackathon's scope - `createAccount` is only callable by an authenticated,
session-verified CRM user, not a public endpoint. If abuse becomes a concern (e.g. scripted bulk
creation), a per-user/per-org write-rate check would be added in the service layer; none is planned
for Sprint 1.

## BalloAds Developer Portal API (external, consumed not owned)

BalloCRM also calls out to BalloAds' own `/v1/developer-portal/*` API (sending messages/triggering
journeys, reading delivery status, opt-outs, and health score). That surface is **owned by
BalloAds, not BalloCRM** - it is documented in full in [`integrations.md`](./integrations.md)
rather than duplicated here, since this file's job is to document APIs _BalloCRM exposes_, not
APIs BalloCRM consumes.

## Sprint 1 scope: Accounts CRUD

Sprint 1's proof-of-stack goal is Create/Read against Firestore for one entity (Accounts). Expected
surface:

| Name                                              | Type                                                                                                        | Path/name                                               | Status                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `createAccount`                                   | Server Action                                                                                               | `features/accounts/actions/create-account.ts`           | Sprint 1                                          |
| `listAccounts`                                    | Server Action (used by Client Components via TanStack Query) / direct service call (from Server Components) | `features/accounts/actions/list-accounts.ts`            | Sprint 1                                          |
| `getAccountById`                                  | Server Action / direct service call                                                                         | `features/accounts/actions/get-account.ts`              | Sprint 1                                          |
| `updateAccount`                                   | Server Action                                                                                               | `features/accounts/actions/update-account.ts`           | Planned (post-Sprint 1)                           |
| `deleteAccount`                                   | Server Action                                                                                               | `features/accounts/actions/delete-account.ts`           | Planned (post-Sprint 1)                           |
| `POST /api/webhooks/balloads`                     | Route Handler                                                                                               | `app/api/webhooks/balloads/route.ts`                    | Planned (depends on `lib/balloads/` client)       |
| Brutus AI job actions (e.g. `qualifyOpportunity`) | Server Action                                                                                               | `features/opportunities/actions/qualify-opportunity.ts` | Planned (post-Sprint 1, depends on `lib/brutus/`) |

See [`tasks/sprint-1.md`](./tasks/sprint-1.md) and [`tasks/developer-3.md`](./tasks/developer-3.md)
for task-level ownership of the Accounts CRUD surface.
