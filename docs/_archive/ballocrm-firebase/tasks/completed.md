# Completed Tasks

This is the append-only, newest-first log of every task that has met its Definition of Done (see
[sprint-plan.md](../sprint-plan.md)). It is the historical record for "what shipped and when" -
`docs/progress.md` gives the current-state summary and `docs/changelog.md` gives the
human-readable release notes; this file is the task-tracking ledger that ties a shipped change
back to a specific Task ID.

## Update protocol

When a task's Definition of Done is met:

1. Remove (cut, don't copy) the task entry from wherever it currently lives -
   [sprint-1.md](./sprint-1.md), [sprint-2.md](./sprint-2.md), or [backlog.md](./backlog.md) - and
   add a new row to the table below, newest entry at the top.
2. Update [progress.md](../progress.md) (move the item from "In Progress"/"Planned" to
   "Completed") and [changelog.md](../changelog.md) (add a dated entry) **in the same PR** as the
   code change and this file update - do not let these three drift apart.
3. Keep the `PR/Commit` column accurate once real PR numbers exist; until a PR history exists,
   use the placeholder format shown below (e.g. `initial scaffold commit`) rather than leaving it
   blank.
4. Never delete a row once added, even if the underlying feature is later reverted - add a new
   row noting the revert instead, so the log stays an honest history.

## Log

| Task ID          | Title                                                                                                         | Completed By                            | Date       | PR/Commit               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FOUNDATION-000` | Initialize BalloCRM project foundation: Next.js 15 scaffold, tooling, Firebase config, full documentation set | Project initialization (Technical Lead) | 2026-07-04 | initial scaffold commit | Covers everything listed under the "Completed" section of [progress.md](../progress.md): Next.js 15 App Router scaffold, TypeScript/ESLint/Prettier/Husky tooling, Tailwind + shadcn/ui (`radix-nova`) component install, Redux Toolkit + TanStack Query + `next-themes` providers wiring, Firebase client/admin SDK setup (`lib/firebase/client.ts`, `lib/firebase/admin.ts`), Zod-validated env config, Firestore multi-tenant rules/indexes, session-cookie-presence middleware, and the full initial `/docs` set. No business features (auth flow, dashboard shell, or CRM domain screens) were part of this task - those are scoped as Sprint 1 work in [sprint-1.md](./sprint-1.md). |
