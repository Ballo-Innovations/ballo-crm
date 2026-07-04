# Contributing to BalloCRM

BalloCRM is built documentation-first: documentation is the source of truth, and code that
diverges from `/docs` is treated as a bug in one of the two. This applies equally to human
contributors and AI coding agents.

## Before you write code

1. Read `docs/README.md` (index) and the doc for the area you're touching.
2. Find or create your task in `docs/tasks/` using `docs/tasks/task-template.md`. Every PR should
   close a task.
3. If your change isn't described by an existing doc, update the doc **first** (or in the same
   PR) - don't let behavior and documentation drift apart.

## Local setup

See `docs/environment.md` and the Installation section of `README.md`.

## Branching & commits

- Branch from `main`: `feature/<task-id>-short-description` or `fix/<task-id>-short-description`.
- Commit messages: imperative mood, explain _why_ not just _what_ (e.g. "Add health score badge
  to account card - surfaces BalloAds risk signal without opening the record").
- Keep PRs scoped to one task where possible; large multi-task PRs are harder to review and more
  likely to conflict with parallel work (see docs/decisions.md on feature-based architecture).

## Code review checklist

Also enforced by CI/hooks where possible:

- [ ] `npm run lint` / `npm run typecheck` / `npm run build` pass
- [ ] No `any`, no direct Firestore access outside `repositories/`
- [ ] New Firestore fields/collections documented in `docs/database-schema.md`
- [ ] New routes documented in `docs/routes.md`
- [ ] New env vars added to `.env.example` and `docs/environment.md`
- [ ] `docs/progress.md` and `docs/changelog.md` updated

## Coding standards

See `docs/coding-standards.md` and `docs/naming-conventions.md` - these are not optional style
preferences, they're what keeps a codebase touched by multiple humans and AI agents in parallel
coherent.

## Working alongside AI coding agents

Multiple AI agents may be assigned tasks concurrently (see `docs/tasks/developer-1.md`,
`developer-2.md`, `developer-3.md`). To avoid collisions:

- Stay inside your assigned feature folder (`features/<feature>/`) unless your task explicitly
  says otherwise.
- Don't refactor shared files (`components/ui/`, `lib/`, `store/`) as a side effect of an
  unrelated task - file a separate task instead.
- Update the specific sprint file for your task, not the whole `docs/tasks/` tree.
