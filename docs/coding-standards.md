# Coding Standards

These are the rules that keep a codebase touched by three human developers and multiple AI coding
agents, working in parallel across features, coherent. They are enforced in code review today
(see the checklist in [CONTRIBUTING.md](../CONTRIBUTING.md)); anything not yet enforceable by
tooling is called out as such rather than silently assumed. See
[folder-structure.md](./folder-structure.md) for where things live, and
[naming-conventions.md](./naming-conventions.md) for the full naming reference.

## Naming

Full reference: [naming-conventions.md](./naming-conventions.md). Headline rules:

- Files are kebab-case (`account-card.tsx`, `use-account-query.ts`), regardless of what they
  export.
- Components export a PascalCase name matching the kebab-case filename (`account-card.tsx` exports
  `AccountCard`).
- Variables and functions are camelCase; Server Actions are named `verbNoun` (`createAccount`,
  `updateOpportunityStage`).
- Zod schemas are named `<Entity>Schema`; the inferred type keeps the bare entity name
  (`type Account = z.infer<typeof AccountSchema>`) — never a `Type` or `I`-prefixed variant.

## Folder structure

Where code lives is governed by [folder-structure.md](./folder-structure.md), not repeated here.
The one rule worth restating because it's easy to violate under deadline pressure: UI code never
imports Firestore directly, and a feature folder never imports from another feature folder.

## Hooks

Custom hooks live in `hooks/` (shared, feature-agnostic) or `features/<feature>/hooks/`
(feature-scoped) — never inline duplicated across components. Redux's typed hooks are the one
exception and stay in `store/hooks.ts`.

- File name: `use-kebab-case.ts` (e.g. `use-debounced-value.ts`, `use-account-query.ts`).
- Export name: `useCamelCase` matching the filename (`useDebouncedValue`, `useAccountQuery`).
- Placement test: if the hook has no dependency on a specific feature's data or schemas, it
  belongs in the shared `hooks/`. If it wraps a TanStack Query call for a specific entity or holds
  local UI state scoped to one feature's screen, it belongs in that feature's `hooks/`. A hook
  should never live in a component file — one hook per file, same as components.

## Components

- **Server Components by default.** Add `"use client"` only when the component needs React state
  or effects, a browser-only API (`window`, `localStorage`, `IntersectionObserver`), an event
  handler that can't be expressed as a Server Action, or a third-party library that only works
  client-side (e.g. a chart library requiring a DOM node). If none of those apply, leave the
  directive off.
- **One component per file.** A file may export small, tightly-coupled private helper components
  it does not export, but the public export surface of a component file is exactly one component.
- **Props are typed with an explicit `type Props = { ... }`**, declared above the component and
  never inlined into the function signature:

  ```tsx
  type Props = {
    account: Account;
    onSelect?: (accountId: string) => void;
  };

  export function AccountCard({ account, onSelect }: Props) { ... }
  ```

  This keeps prop shapes readable in editor hovers/diffs and gives a stable name to reference from
  a parent or a story/test later.

## Server Actions

- Start with `"use server"` at the top of the file (or function, for colocated actions).
- Validate every input — `FormData` or plain arguments — with a Zod schema from `schemas/` before
  doing anything else. Never trust a client-supplied shape.
- Call into `services/` for the actual work; a Server Action itself contains no business logic
  (see [architecture.md](./architecture.md) and [folder-structure.md](./folder-structure.md) for
  the full layering).
- Return the shared result shape from [api.md](./api.md) — `{ ok: true, data }` on success,
  `{ ok: false, error }` on an expected failure (validation error, business rule violation,
  not-found). **Never throw for an expected error** — throwing forces every caller to wrap the
  action in `try/catch` and turns a normal "this account doesn't exist" case into an unhandled
  exception. Only let an action throw for a genuinely unexpected failure (e.g. Firestore is
  unreachable), where the nearest `error.tsx` boundary is the right place for it to surface.

## Redux

Redux Toolkit (`store/`) is for cross-cutting **client UI state only** — see
[store/README.md](../store/README.md): sidebar collapse, global dialog open/closed, the command
menu. Never put server data (accounts, opportunities, anything that came from Firestore or an
API) into a slice — that is what TanStack Query owns. If you find yourself about to `dispatch` a
fetched entity into a Redux slice, that data belongs in a `features/<feature>/hooks/use-*-query.ts`
hook instead.

## Queries

TanStack Query is the server-cache layer for anything read on the client (lists that need
refetch/pagination/optimistic updates, or data used across multiple client-rendered views).

- **Query keys** are arrays that go from general to specific, always including the tenant
  boundary: `["accounts", orgId]` for a list, `["accounts", orgId, filters]` when the list is
  filtered/sorted, `["account", orgId, accountId]` for a single record. Keeping `orgId` in every
  key prevents cross-tenant cache bleed and makes invalidation after a mutation predictable
  (`queryClient.invalidateQueries({ queryKey: ["accounts", orgId] })`).
- **Use a Server Component with a direct `services/`/`repositories/` read** for the first paint of
  a page — there is no reason to round-trip through a client fetch for data you already know you
  need before rendering. **Use `useQuery`** only where the data needs to be refetched, polled,
  paginated, or kept fresh after a client-side mutation without a full navigation (e.g. a live
  pipeline board, a searchable/filterable table, a panel that revalidates after a Server Action
  returns). Don't reach for `useQuery` to fetch data a Server Component could have handed the page
  directly as props.

## Forms

Every form pairs React Hook Form with the Zod resolver (`@hookform/resolvers/zod`) and shadcn's
`field.tsx` primitives (`FieldSet`, `FieldGroup`, `FieldLabel`, etc. — this shadcn version has no
separate legacy `Form`/`FormField` wrapper). One Zod schema per form, co-located in the owning
feature's `schemas/` (e.g. `features/accounts/schemas/create-account-schema.ts`), reused as both
the `zodResolver` input and the Server Action's own validation — the client-side and server-side
validation are the same schema, never two hand-maintained copies that can drift apart.

## Validation

Zod is the single source of truth for any shape that crosses a boundary — form input, Server
Action payload, Firestore document, BalloAds/Brutus AI request or response. TypeScript types for
these shapes are always inferred (`type Account = z.infer<typeof AccountSchema>`), never
hand-written as a parallel `interface`. A hand-written interface next to a Zod schema is a bug
waiting to happen: the two will diverge the first time either one changes and nobody remembers to
update both. See [schemas/README.md](../schemas/README.md) and
[naming-conventions.md](./naming-conventions.md) for naming.

## Error handling

- **Expected errors** (validation failure, not-found, a business rule rejecting the operation —
  e.g. "cannot delete an account with open opportunities") are returned as typed
  `{ ok: false, error }` results from `services/`/`actions/`, per [api.md](./api.md). Calling UI
  code checks `result.ok` and renders accordingly — a toast, an inline field error, an empty
  state.
- **Unexpected errors** (a downstream outage, a bug, a null a schema should have caught) are
  allowed to throw. Let them propagate to the nearest Next.js `error.tsx` boundary rather than
  catching and swallowing them. Don't wrap a call in `try/catch { return null }` just to make an
  unexpected failure disappear — that turns a visible bug into a silent one, which is strictly
  worse for debugging a hackathon-paced codebase with multiple contributors.

## Testing

**Honest status: no test framework is installed yet** (no Jest/Vitest/Playwright, no `test`
script in `package.json`). This is tracked as a gap in [risks.md](./risks.md) and
[roadmap.md](./roadmap.md), not something this document pretends is already solved. The standard
to adopt once a framework is chosen (Sprint 1/2 setup task):

- Colocate `*.test.ts` / `*.test.tsx` next to the source file it tests, not in a parallel `__tests__`
  tree — keeps a feature's tests moving with the feature when it's touched or refactored.
- Prioritize testing `services/` (business logic, the highest-value and most stable surface) and
  `schemas/` (Zod parsing/refinement edge cases) over UI snapshot tests. Server Components and
  Server Actions changing shape frequently during a hackathon make snapshot tests a maintenance
  tax with little signal; a `services/` function that stays covered catches real regressions.
- Repository functions are the lowest priority to unit test directly — they're thin wrappers over
  the Firestore SDK — but should be easy to mock in a `services/` test precisely because the
  repository/service split already exists.

## Documentation

Every exported function or component whose purpose isn't obvious from its name and its types gets
a one-line doc comment explaining **why**, not what — the same pattern already used in
`lib/firebase/admin.ts` and `middleware.ts`:

```ts
/**
 * Vercel env vars escape newlines; restore them before passing to the SDK.
 */
```

```ts
/**
 * Foundation-level route gate. Checks for the presence of the Firebase
 * session cookie only — it does NOT verify the token, since verification
 * requires the Admin SDK and cannot run in the Edge middleware runtime.
 */
```

A function like `getAccountById(id: string): Promise<Account | null>` needs no comment at all —
the name and the type signature already say everything a reader needs. A comment earns its
keep only when it explains a constraint, a tradeoff, or a "this looks wrong but isn't" that the
code itself can't express.

## Comments

Same rule as documentation: comments explain **why**, never restate **what** the next line
already says. Two hard rules:

- No commented-out code. If it's not needed, delete it — git history is the undo button, not a
  comment block.
- No comments that restate the task or diff ("added new field for health score", "fix bug").
  That belongs in the commit message (see [naming-conventions.md](./naming-conventions.md) on
  commit style), not in the file itself, which future readers see with no timestamp or context.

## TypeScript standards

- **Strict mode is on; `any` is never allowed.** Where a shape is genuinely unknown at compile
  time (e.g. a third-party webhook payload before validation), use `unknown` and narrow it — with
  a type guard or, preferably, by parsing it through a Zod schema, which gives you narrowing and
  validation in one step.
- **`type` over `interface`** for object shapes, everywhere in this codebase, unless declaration
  merging is specifically required (rare — e.g. augmenting a third-party library's ambient types
  in `types/`). Consistency here matters more than either style's individual merits, since it
  removes a class of "which one do I use" decisions during fast parallel development.
- **No non-null assertions (`!`) except in narrow, justified cases** already established in the
  codebase — e.g. `getApps()[0]!` in `lib/firebase/admin.ts`'s singleton-app pattern, where the
  code immediately above it already checked `getApps().length > 0`, and `store/store.ts`'s
  per-request store singleton, where the invariant is enforced by the surrounding control flow, not
  assumed. A new `!` needs the same bar: the line directly above it (or the type system elsewhere)
  must make the non-null claim provably true, not just probably true. When in doubt, narrow with an
  `if` or throw an explicit error with a message instead of asserting.
