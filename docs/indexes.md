# Firestore Composite Indexes

This document explains the real `firestore.indexes.json` at the repo root: what each composite
index is for, in plain English, and why Firestore requires it. Collection field meanings are
defined in [database-schema.md](./database-schema.md); who can read/write the underlying
collections is in [firestore-rules.md](./firestore-rules.md).

## Why composite indexes exist at all

Firestore automatically indexes every field of every document individually (single-field
indexes), which is enough for simple equality/range queries on one field, or an equality filter
on one field combined with a range/sort on the _same_ field. The moment a query needs to:

- filter or sort on **two or more fields** at once (e.g. `WHERE stage == X ORDER BY
expectedCloseDate`), or
- combine an equality filter on one field with a range/inequality or sort on a **different**
  field,

Firestore requires a **composite index** — a pre-built, sorted structure over the exact
combination of fields and sort orders the query uses, in the exact order the query needs. Without
it, the query fails at runtime with an error containing a console link to auto-create the missing
index. This is a deliberate Firestore design trade-off: it forces every expensive query to have a
pre-computed index rather than letting an unindexed query silently degrade performance at scale.

All indexes below are `queryScope: "COLLECTION"` — none of them are `COLLECTION_GROUP`, meaning
every query they support runs against a single organization's subcollection (e.g. one org's
`opportunities`), never across all orgs at once. That's consistent with the multi-tenant model:
BalloCRM has no cross-org query pattern yet, so no collection-group index is needed today (see
the migration note in [database-schema.md](./database-schema.md)).

## Index catalog

### `accounts`

| Fields (order)                     | Query it supports                                                                                                       | Why composite is required                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `vertical` ASC, `healthScore` DESC | List accounts in a given industry vertical, ranked by health score, highest first — the "Vertical Sales Indexing" view. | Equality filter on `vertical` combined with a sort on a _different_ field (`healthScore`). |
| `ownerId` ASC, `updatedAt` DESC    | A rep's own account list ("my accounts"), most recently updated first.                                                  | Equality filter on `ownerId` combined with a sort on `updatedAt`.                          |

### `opportunities`

| Fields (order)                         | Query it supports                                                                                                 | Why composite is required                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `stage` ASC, `expectedCloseDate` ASC   | Pipeline board / forecast view: opportunities grouped by stage, ordered by expected close date within each stage. | Equality filter on `stage` + sort on `expectedCloseDate`.   |
| `accountId` ASC, `stage` ASC           | An account's detail page: all deals for this account, grouped by stage.                                           | Equality filter on `accountId` + sort/filter on `stage`.    |
| `ownerId` ASC, `expectedCloseDate` ASC | A rep's own deal list sorted by close date — "what's closing soon that's mine."                                   | Equality filter on `ownerId` + sort on `expectedCloseDate`. |

### `activities`

| Fields (order)                                              | Query it supports                                                                                                                                                                                                                                             | Why composite is required                                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `relatedTo.type` ASC, `relatedTo.id` ASC, `occurredAt` DESC | The timeline for any single entity: "show all activity for opportunity `opp_1a92`," newest first. This is the query that lets `activities` double as the timeline UI with no separate `timeline` collection (see [database-schema.md](./database-schema.md)). | Two equality filters (`relatedTo.type`, `relatedTo.id`) plus a sort on a third field (`occurredAt`) — three fields involved, well past what a single-field index can satisfy. |

### `tasks`

| Fields (order)                  | Query it supports                                 | Why composite is required                            |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `assigneeId` ASC, `dueDate` ASC | "My tasks," soonest due first.                    | Equality filter on `assigneeId` + sort on `dueDate`. |
| `status` ASC, `dueDate` ASC     | An open-tasks board sorted by due date, org-wide. | Equality filter on `status` + sort on `dueDate`.     |

### `contracts`

| Fields (order)                  | Query it supports                                                    | Why composite is required                            |
| ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `status` ASC, `renewalDate` ASC | Renewal-risk view: active contracts ordered by soonest renewal date. | Equality filter on `status` + sort on `renewalDate`. |

### `campaigns`

| Fields (order)                 | Query it supports                                                        | Why composite is required                          |
| ------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `status` ASC, `startDate` DESC | Campaign list: running/scheduled campaigns, most recently started first. | Equality filter on `status` + sort on `startDate`. |

### `notifications`

| Fields (order)                                   | Query it supports                                                                | Why composite is required                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `targetUserId` ASC, `read` ASC, `createdAt` DESC | A user's notification bell: their own notifications, unread first, newest first. | Two equality filters (`targetUserId`, `read`) plus a sort on `createdAt`. |

### `auditLogs`

| Fields (order)                  | Query it supports                                                | Why composite is required                           |
| ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| `actorId` ASC, `createdAt` DESC | "What has this specific user done" audit view for owners/admins. | Equality filter on `actorId` + sort on `createdAt`. |

### `aiJobs`

| Fields (order)                 | Query it supports                                                                                                  | Why composite is required                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `status` ASC, `createdAt` DESC | The org's AI job queue/history — e.g. "show all currently running jobs," newest first, or a full job history feed. | Equality filter on `status` + sort on `createdAt`. |

## Collections with no composite index (and why)

`users`, `organizations`, `contacts`, `templates`, `analyticsCache`, `settings`, and
`integrations` have no entries in `firestore.indexes.json` today. Each is either always fetched
by a known document ID (`settings/{settingId}`, `analyticsCache/{cacheKey}`,
`integrations/{provider}`, `users/{uid}`), or currently only queried with a single equality
filter with no additional sort (`contacts` by `accountId`, `templates` by `kind`) — both cases
Firestore's automatic single-field indexing already covers. If a future feature needs, say, "list
contacts for an account sorted by `lastName`," that would need a new composite index — see below.

## Adding a new index

When a new query pattern needs a composite index, there are two equivalent ways to get one:

1. **Manual (preferred for anything going into version control):**
   - Add an entry to the `indexes` array in `firestore.indexes.json` with the exact
     `collectionGroup`, `queryScope`, and ordered `fields` your query uses.
   - Deploy it: `firebase deploy --only firestore:indexes`.
   - Commit the updated `firestore.indexes.json` in the same change as the code that introduces
     the query, per the documentation-driven-development rule in
     [PROJECT_BRIEF.md](./_context/PROJECT_BRIEF.md) — and update this file's catalog table above
     in the same commit.
2. **Auto-suggested (fast path during local development):** run the new query against the
   Firestore emulator or a dev project without the index. Firestore's error message includes a
   direct console link that pre-fills the exact composite index definition needed — click it,
   confirm creation, then **reverse-engineer that same definition back into
   `firestore.indexes.json`** before merging, so the index is captured in version control and
   deploys automatically to every environment (staging, prod) rather than existing only as a
   manually-clicked artifact in one Firebase project.

Either path, the index must land in `firestore.indexes.json` before the PR merges — an index that
only exists because someone clicked a console link will silently be missing in the next
environment that runs `firebase deploy`.

## Caution: index proliferation

Every composite index costs storage (Firestore duplicates the indexed fields into the index
structure) and slows down writes slightly (each write updates every matching index). It's tempting
to add a new composite index for every new filter/sort combination a UI wants, but:

- Prefer designing list views around the query patterns already indexed above before requesting a
  new one — e.g. a "my accounts, filtered by vertical" view might be satisfiable by fetching with
  the existing `ownerId, updatedAt` index and filtering `vertical` client-side if the result set
  is small, rather than adding a three-field `ownerId, vertical, updatedAt` index.
- Each additional field in a composite index also creates the "index the reverse-sort order too"
  question — Firestore does not automatically give you both `ASC` and `DESC` for free; adding a
  new sort direction on an already-indexed field pair means a second, near-duplicate index entry.
- Review `firestore.indexes.json` during sprint planning ([sprint-plan.md](./sprint-plan.md)) as
  the CRM domain grows — an index nobody's queries use anymore should be deleted (via the same
  `firebase deploy --only firestore:indexes` path, removing the entry), not left to accumulate
  indefinitely.
