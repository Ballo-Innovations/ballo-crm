# Naming Conventions

A focused reference for how things are named across BalloCRM. This document is the source of
truth for naming; [coding-standards.md](./coding-standards.md) summarizes the headline rules and
links back here for detail. See [folder-structure.md](./folder-structure.md) for where things
live, and [database-schema.md](./database-schema.md) for the full collection/field catalog this
document's Firestore section must stay consistent with.

## File naming

All files are kebab-case, regardless of what they export. This applies uniformly across
`app/`, `components/`, `features/`, `lib/`, `hooks/`, `schemas/`, `actions/`, `services/`, and
`repositories/`.

| Kind                 | Pattern                      | Example                          |
| -------------------- | ---------------------------- | -------------------------------- |
| Component            | `<name>.tsx`                 | `account-card.tsx`               |
| Hook                 | `use-<name>.ts`              | `use-account-query.ts`           |
| Zod schema           | `<entity>-schema.ts`         | `account-schema.ts`              |
| Server Action        | `<verb>-<noun>.ts`           | `create-account.ts`              |
| Repository           | `<collection>-repository.ts` | `accounts-repository.ts`         |
| Service              | `<domain>-service.ts`        | `opportunities-service.ts`       |
| Route segment folder | kebab-case                   | `app/(dashboard)/opportunities/` |

## Component naming

A component file's default export (or named export, this project prefers named exports) is a
PascalCase identifier that matches its kebab-case filename one-to-one:

| File                          | Export                  |
| ----------------------------- | ----------------------- |
| `account-card.tsx`            | `AccountCard`           |
| `opportunity-stage-badge.tsx` | `OpportunityStageBadge` |
| `data-table-toolbar.tsx`      | `DataTableToolbar`      |

If the exported name and the filename diverge, an editor's "go to definition" and a plain
filesystem search stop agreeing with each other - assume this convention has no exceptions.

## Variable and function naming

Standard camelCase for everything that isn't a type, a component, or a file:

```ts
const accountId = account.id;
function getHealthScoreLabel(score: number): string { ... }
```

Booleans read as a question or a state: `isOrgMember`, `hasPendingInvite`, `canEditContract` -
not `orgMember` or `pendingInviteFlag`.

## Type / schema naming

Zod is the source of truth for any boundary-crossing shape (see
[coding-standards.md](./coding-standards.md#validation)). The naming pair is fixed:

| Zod schema (value)    | Inferred type                                                   |
| --------------------- | --------------------------------------------------------------- |
| `AccountSchema`       | `type Account = z.infer<typeof AccountSchema>`                  |
| `CreateAccountSchema` | `type CreateAccountInput = z.infer<typeof CreateAccountSchema>` |
| `OpportunitySchema`   | `type Opportunity = z.infer<typeof OpportunitySchema>`          |

Rules:

- The schema gets the `Schema` suffix; the inferred type does **not** repeat it - `Account`, not
  `AccountType` or `AccountSchemaType`.
- A schema that validates a narrower, purpose-specific payload (e.g. a create-form's subset of
  fields) gets its own name reflecting that purpose (`CreateAccountSchema`) rather than reusing
  the base entity name - its inferred type is suffixed `Input` when it represents something being
  submitted (`CreateAccountInput`), to distinguish it from the full persisted entity type
  (`Account`).
- Ambient types that are **not** derived from a schema (see [types/README.md](../types/README.md))
  don't follow this pairing at all - they're just PascalCase types living in `types/`
  (`Nullable<T>`, `PaginatedResult<T>`).

## Firestore collection naming

Collection names are camelCase and plural, already fixed by the real `firestore.rules` and
`firestore.indexes.json` - do not introduce a new top-level collection or rename an existing one
without updating both files plus [database-schema.md](./database-schema.md) in the same change.
The current, complete list:

| Collection       | Path                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `users`          | `users/{uid}` (top-level; holds `orgId` + `role`)                         |
| `organizations`  | `organizations/{orgId}`                                                   |
| `accounts`       | `organizations/{orgId}/accounts/{accountId}`                              |
| `contacts`       | `organizations/{orgId}/contacts/{contactId}`                              |
| `opportunities`  | `organizations/{orgId}/opportunities/{opportunityId}`                     |
| `tasks`          | `organizations/{orgId}/tasks/{taskId}`                                    |
| `contracts`      | `organizations/{orgId}/contracts/{contractId}`                            |
| `campaigns`      | `organizations/{orgId}/campaigns/{campaignId}`                            |
| `activities`     | `organizations/{orgId}/activities/{activityId}`                           |
| `notifications`  | `organizations/{orgId}/notifications/{notificationId}`                    |
| `auditLogs`      | `organizations/{orgId}/auditLogs/{logId}`                                 |
| `aiJobs`         | `organizations/{orgId}/aiJobs/{jobId}`                                    |
| `templates`      | `organizations/{orgId}/templates/{templateId}`                            |
| `analyticsCache` | `organizations/{orgId}/analyticsCache/{cacheKey}`                         |
| `settings`       | `organizations/{orgId}/settings/{settingId}`                              |
| `integrations`   | `organizations/{orgId}/integrations/{provider}` (server-only credentials) |

Note there is deliberately **no separate `timeline` collection** - the Customer Journey/timeline
UI is a query over `activities` filtered by `relatedTo.type` + `relatedTo.id`. See
[decisions.md](./decisions.md) for the rationale and [database-schema.md](./database-schema.md)
for how `activities` serves both the audit trail and the timeline view.

## Firestore field naming

Fields are camelCase, matching the collection convention above. Do not contradict whatever
[database-schema.md](./database-schema.md) states for a specific entity's fields - this section
restates the general rules that apply across every collection:

- **Timestamps**: every document gets `createdAt` and `updatedAt` (Firestore `Timestamp`, written
  server-side). A domain-specific timestamp follows the same pattern:
  `closedAt`, `qualifiedAt`, `lastActivityAt`.
- **Reference fields**: a field that holds another document's ID is named `<entity>Id` -
  `accountId` on a `contact`, `opportunityId` on a `contract`, `targetUserId` on a `notification`.
  Never a bare `account` or `owner` holding a raw ID string - the `Id` suffix makes it unambiguous
  at the call site that this is a reference, not an embedded object.
- **Enums**: stored as their literal string value (`"open" | "won" | "lost"`), matching the Zod
  `.enum()` defined alongside the entity's schema - never a numeric/magic-number encoding.
- **Booleans**: same `is`/`has`/`can` prefix convention as in-memory variables - `isArchived`,
  `hasOpenTasks`.

## Server Action naming

`verbNoun`, always - the verb states the mutation, the noun states what it acts on:

| Good                     | Avoid                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| `createAccount`          | `accountCreate`, `newAccount`                                             |
| `updateOpportunityStage` | `opportunityStageUpdate`, `changeStage`                                   |
| `deleteContract`         | `contractDelete`, `removeContract` (prefer `delete` as the standard verb) |
| `qualifyOpportunity`     | `opportunityQualification`                                                |

The exported Server Action function name and its filename share the same words, just cased
differently: `create-account.ts` exports `createAccount`.

## Route naming

URL segments are kebab-case, matching the entries already declared in `config/site.ts`'s
`primaryNav` - `/dashboard`, `/accounts`, `/contacts`, `/opportunities`, `/contracts`,
`/campaigns`, `/analytics`, `/settings`. A nested detail route follows the same rule:
`/accounts/[accountId]`, `/opportunities/[opportunityId]/edit`. Full inventory and any route not
yet built: [routes.md](./routes.md).

## Environment variable naming

`NEXT_PUBLIC_` prefix only for values that are safe to ship to the browser bundle (Firebase client
config, the public app URL) - anything without that prefix is server-only by Next.js convention
and by this project's own rule, enforced in `config/env.ts` via separate `ClientEnv`/`ServerEnv`
Zod schemas:

| Prefix         | Example                                                                         | Reachable from   |
| -------------- | ------------------------------------------------------------------------------- | ---------------- |
| `NEXT_PUBLIC_` | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_APP_URL`                           | Browser + server |
| (none)         | `FIREBASE_ADMIN_PRIVATE_KEY`, `BALLOADS_DEVELOPER_API_KEY`, `BRUTUS_AI_API_KEY` | Server only      |

Never add `NEXT_PUBLIC_` to a secret to "make it easier to read from a Client Component" - that
is precisely the mistake this prefix convention exists to catch in code review. Full variable
inventory: [environment.md](./environment.md).

## Branch and commit naming

Per [CONTRIBUTING.md](../CONTRIBUTING.md): branch from `main` as
`feature/<task-id>-short-description` or `fix/<task-id>-short-description`, where `<task-id>`
matches the task's identifier in `docs/tasks/`. Commit messages are imperative mood and explain
_why_, not just _what_ - e.g. "Add health score badge to account card - surfaces BalloAds risk
signal without opening the record," not "update account-card.tsx."

## CSS / Tailwind class ordering

Don't hand-order Tailwind classes - `prettier-plugin-tailwindcss` is installed and runs on save
via the project's Prettier config, and reorders classes into its canonical order automatically on
every commit through the Husky pre-commit hook. Fighting the formatter's ordering in review is
wasted effort; if a diff shows classes in a different order than expected, run Prettier rather
than manually rearranging them.
