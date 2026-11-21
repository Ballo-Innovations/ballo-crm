# Test Strategy

All three developers code with Claude Code, so the tests are what tells us the code does what
the ticket asked rather than what the AI decided to build. The rules below apply to every ticket.

## Layers

| Layer       | Tool                           | Scope                                                          | When it runs                               | Owner                         |
| ----------- | ------------------------------ | -------------------------------------------------------------- | ------------------------------------------ | ----------------------------- |
| Unit        | Vitest (`*.test.ts`)           | `service.ts` in every module; pure helpers in `src/lib`        | Every PR (`pnpm test:coverage`)            | each dev                      |
| Integration | Vitest (`*.int.test.ts`) + DB  | server actions and queries with audit + RBAC, against Postgres | Every PR (`pnpm test:int`)                 | each dev; Dev A owns the kit  |
| End-to-end  | Playwright (`e2e/*.spec.ts`)   | each user-facing feature, at desktop and 390px                 | Every PR (`pnpm test:e2e`)                 | the dev who builds the screen |
| Manual      | Checklist (`02-test-cases.md`) | every demo beat + every role                                   | Dev C each evening on stage, all in week 3 | Dev C                         |
| Performance | Lighthouse + manual            | dashboard, kanban, account 360 on full seed                    | Week 3 (E10-06)                            | Dev A                         |
| Security    | Checklist in architecture/05   | auth, RBAC bypass attempts, token reuse                        | Week 3, and on every auth change           | Dev A                         |

## Rules

1. **Tests come from the acceptance criteria, not from the code.** Before writing code, list
   each acceptance criterion of the ticket and the test that will prove it (unit, integration
   or end-to-end). Write those tests first, from the ticket and the spec, and see them fail.
   `/start-ticket` produces this list.
2. **Every acceptance criterion has a named test.** The PR description maps each criterion to
   the test that proves it. A criterion that cannot be automated (for example "rehearsed 3
   times") says "manual" and how it was checked.
3. **End-to-end tests are written per feature, not nightly.** A ticket that adds or changes a
   screen adds or extends a Playwright spec in the same PR, covering the ticket's main path.
   The whole suite runs on every pull request and before every deploy. There is no nightly run.
   E10-04 (the full demo journey) builds on these specs; it does not replace them.
4. **Walk it in the browser before the PR.** For a UI ticket, the developer (or Claude through
   the Playwright MCP server) opens the running app, walks the ticket's main path at desktop and
   390px, and attaches screenshots to the PR.
5. **A bug fix starts with a failing test.** Reproduce the bug in a test, see it fail, then fix
   it. The test stays in the suite.
6. **Coverage floor.** Every `src/modules/**/service.ts` must keep at least 90% line, function
   and statement coverage and 80% branch coverage, per file. CI fails below that.
7. **Scoring and recommender tests are table-driven from the spec.** A spec change requires a
   test change in the same PR.
8. **Never weaken a test to make it pass.** Do not edit, skip or delete a failing test, lower a
   threshold or loosen an assertion without checking the spec and saying so in the PR. A PR that
   changes an existing test's expectations needs a second reviewer.
9. **Tests must be able to fail.** Assert on real outcomes (values, rows written, text on
   screen). No test that only checks a function was called, that a snapshot of generated output
   matches itself, or that mocks the thing under test.
10. **Integration tests use a real database.** Do not mock Prisma. Each test creates the rows it
    needs and cleans up after itself; tests never rely on seed data or on each other.
11. **CI blocks merge** on lint, typecheck, unit, coverage, integration, build or end-to-end
    failures.

## Commands

| Command              | What it runs                                                            |
| -------------------- | ----------------------------------------------------------------------- |
| `pnpm test`          | Unit tests                                                              |
| `pnpm test:coverage` | Unit tests with the coverage floor (what CI runs)                       |
| `pnpm test:int`      | Integration tests; needs `docker compose up -d db` and `pnpm db:deploy` |
| `pnpm test:e2e`      | Playwright; starts `pnpm dev` itself, or set `E2E_BASE_URL`             |

First time on a machine: `pnpm exec playwright install chromium`.

## Where tests live

- Unit: next to the file, `service.test.ts`.
- Integration: next to the file, `actions.int.test.ts` or `queries.int.test.ts`.
- End-to-end: `e2e/<module>.spec.ts`, one file per module, one `test` per user path. Shared
  helpers in `e2e/helpers.ts`. Every spec runs twice: desktop and 390px wide.

## Bug triage

P0 = breaks a demo beat (fix today); P1 = visible but not on script; P2 = cosmetic.
