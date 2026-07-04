# Firestore Security Rules

This is a companion explainer for the real `firestore.rules` at the repo root. It explains the
_model_, not a line-by-line restatement — read the actual file alongside this doc. Collection
shapes referenced below are defined in [database-schema.md](./database-schema.md).

> **Rules are defense-in-depth, not the primary authorization layer.** The primary authorization
> layer is the Server Action + `services/` layer described in [architecture.md](./architecture.md):
> every mutating write in BalloCRM goes through a Server Action using the Firebase **Admin SDK**,
> which runs with full trusted-server privileges and **bypasses Security Rules entirely**. Rules
> exist to (a) allow _safe, direct reads_ from Client Components via the client SDK (so every
> read doesn't need to round-trip through a Server Action), and (b) act as a last line of defense
> if a bug or a compromised client ever calls the client SDK to write directly. Never design a
> feature that relies on rules alone to enforce business logic — enforce it in `services/`.

## The multi-tenant pattern: `users/{uid}` + `organizations/{orgId}`

Every authenticated user has exactly one `users/{uid}` document holding `orgId` (which tenant
they belong to) and `role` (their permission level within that tenant). Every business document
lives under `organizations/{orgId}/...`. Authorization for any subcollection document boils down
to two questions, both answered by looking up the caller's own `users/{uid}` document:

1. Is `request.auth.uid`'s `orgId` equal to the `{orgId}` in the path being accessed?
2. Is `request.auth.uid`'s `role` in the set of roles allowed to perform this operation?

This means every rule that guards an `organizations/{orgId}/...` document performs a `get()` on
`users/{request.auth.uid}` to answer those questions — that lookup is centralized in the helper
functions below so it's written once, not re-implemented per collection.

## Helper functions

```
isSignedIn()        // request.auth != null
userDoc()           // get()'s the caller's own users/{uid} document
isOrgMember(orgId)  // signed in AND userDoc().orgId == orgId
hasRole(orgId, roles)   // isOrgMember(orgId) AND userDoc().role in roles
isOwnerOrAdmin(orgId)   // hasRole(orgId, ["owner", "admin"])
```

| Function                | What it checks                                                          | Used for                                            |
| ----------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `isSignedIn()`          | `request.auth` is non-null                                              | base check for the `users/{uid}` collection         |
| `userDoc()`             | Fetches the caller's own profile doc (1 extra read per rule evaluation) | building block for the three below                  |
| `isOrgMember(orgId)`    | Caller is signed in and their `orgId` matches the resource's `orgId`    | every `read` rule under `organizations/{orgId}/...` |
| `hasRole(orgId, roles)` | Caller is an org member _and_ their `role` is in the given list         | every role-gated `write`/`create` rule              |
| `isOwnerOrAdmin(orgId)` | Shorthand for `hasRole(orgId, ["owner", "admin"])`                      | org-level updates, `settings`, `auditLogs` reads    |

Because `userDoc()` does a `get()`, every rule evaluation that calls `isOrgMember`/`hasRole`
costs one extra document read against Firestore's security-rules read quota — this is expected
and budgeted for; it's the standard cost of a `users`-table-backed multi-tenant rules model.

## Role hierarchy

Five roles, defined by convention in `users/{uid}.role` (there's no separate `roles` collection —
the role string is trusted as-is, since it can only be set/changed via a Server Action):

`owner` > `admin` > `manager` > `rep` > `viewer`

There's no numeric/hierarchical comparison in the rules themselves — each rule enumerates the
exact list of roles allowed for that operation, which is intentionally explicit and grep-able
rather than "have `role >= manager`" style comparisons.

## Permissions matrix

R = read, W = write (create/update, unless noted). `viewer` has read access anywhere an org
member has read access, and is never granted write access to any business collection.

| Collection              | owner          | admin          | manager        | rep            | viewer         |
| ----------------------- | -------------- | -------------- | -------------- | -------------- | -------------- |
| `organizations/{orgId}` | R, W(update)   | R, W(update)   | R              | R              | R              |
| `accounts`              | R, W           | R, W           | R, W           | R, W           | R              |
| `contacts`              | R, W           | R, W           | R, W           | R, W           | R              |
| `opportunities`         | R, W           | R, W           | R, W           | R, W           | R              |
| `tasks`                 | R, W           | R, W           | R, W           | R, W           | R              |
| `contracts`             | R, W           | R, W           | R, W           | R (no write)   | R              |
| `campaigns`             | R, W           | R, W           | R, W           | R (no write)   | R              |
| `activities`            | R, create      | R, create      | R, create      | R, create      | R (no create)  |
| `notifications`         | R/W own only\* | R/W own only\* | R/W own only\* | R/W own only\* | R/W own only\* |
| `auditLogs`             | R              | R              | —              | —              | —              |
| `aiJobs`                | R              | R              | R              | R              | R              |
| `templates`             | R, W           | R, W           | R, W           | R (no write)   | R              |
| `analyticsCache`        | R              | R              | R              | R              | R              |
| `settings`              | R, W           | R, W           | R              | R              | R              |
| `integrations`          | —              | —              | —              | —              | —              |

\* `notifications`: read/update is not role-gated at all — it's gated purely by
`resource.data.targetUserId == request.auth.uid`. An owner has no special access to another
user's notifications; every role, including `owner`, only ever sees their own. `create`/`delete`
are `false` for everyone (server-only).

Server-only collections (`auditLogs` write, `aiJobs` write, `analyticsCache` write,
`integrations` read+write) show no role at all above because **no client-side role grants
access** — see the next section.

## Why `auditLogs`, `aiJobs`, `analyticsCache`, and `integrations` are client-write-locked

All four have `allow write: if false` (and `integrations` also has `allow read: if false`),
regardless of role. This isn't an oversight — it's deliberate for each:

- **`auditLogs`** — if a client could write its own audit trail, a malicious or buggy client
  could fabricate or omit entries, defeating the point of an audit trail. Entries are written
  only by trusted server code (Server Actions/Route Handlers) via the Admin SDK, which bypasses
  rules entirely.
- **`aiJobs`** — job `status`/`output` must be trustworthy. If a client could write
  `status: "completed"` and an `output` payload directly, a user could fabricate Brutus AI
  results (e.g. inflate their own opportunity's qualification score). Jobs are created and
  transitioned exclusively server-side; clients only ever _read_ jobs to poll/subscribe for
  completion.
- **`analyticsCache`** — this is a shared, org-wide derived read model. If any org member could
  write to it, one user could poison the dashboard numbers every other org member sees. It's
  populated only by a scheduled/triggered server job.
- **`integrations`** — contains encrypted BalloAds/Brutus AI API credentials. `allow read, write:
if false` means the client SDK has **zero** access in either direction; the only code path that
  ever touches this collection is server-side via the Admin SDK, which is also the only place the
  decrypted key is ever materialized. This guarantees there's no client code path — buggy or
  otherwise — that could leak a credential to the browser.

## The notification "self-serve read receipt" pattern

`notifications/{notificationId}` demonstrates a narrow, field-scoped update permission:

```
allow update: if isOrgMember(orgId) && resource.data.targetUserId == request.auth.uid
  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["read", "readAt"]);
```

A user can update a notification **only if it targets them**, and the update **only touches**
the `read` and `readAt` fields — `diff().affectedKeys().hasOnly([...])` computes the set of
fields that actually changed between the existing and incoming document and rejects the write if
that set contains anything outside the allow-list. This lets the client mark its own
notifications as read directly (no Server Action round-trip needed for such a low-stakes,
self-scoped mutation) while making it impossible for a user to rewrite a notification's `title`,
`type`, or reassign it to themselves via `targetUserId`. `create` and `delete` remain server-only,
so notifications can only ever be authored by trusted server code, just marked-read by their
recipient.

## Testing rules locally (Firebase Emulator Suite)

`firebase.json` already configures the emulator ports used for local rules testing:

| Emulator    | Port   |
| ----------- | ------ |
| Auth        | `9099` |
| Firestore   | `8080` |
| Emulator UI | `4000` |

Start the suite with:

```bash
firebase emulators:start
```

Then open `http://localhost:4000` for the Emulator UI, which includes a Firestore rules
playground (simulate a read/write as a given `request.auth` and inspect allow/deny with the exact
rule line that decided it) and a request log. Point the app's Firebase client config at the
emulator (`connectFirestoreEmulator`, `connectAuthEmulator`) during local development/testing so
rule changes are exercised against real data shapes before merging. When adding or changing a
rule, seed at least one document per role (`owner`, `admin`, `manager`, `rep`, `viewer`) across a
couple of orgs in the emulator and manually verify both the allowed and denied cases in the
playground — there is no automated rules-unit-test harness in this repo yet (no test framework is
installed; see [risks.md](./risks.md)), so this manual emulator pass is the only verification
step until one is added.

## Reminder

These rules are a safety net, not the design. Any new collection or field must be authorized
_first_ in the relevant `services/` function (the code path every Server Action goes through),
and only _mirrored_ here as a rule so direct client reads/writes stay safe. Treat a rules change
that isn't backed by a corresponding `services/` check as incomplete.
