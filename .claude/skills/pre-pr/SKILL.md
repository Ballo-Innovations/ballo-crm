---
name: pre-pr
description: Check a BalloCRM branch before opening a pull request. Use when asked to open a PR, finish a ticket or check that work is ready for review.
---

# Before opening a PR

1. Run `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`, then `pnpm test:int`
   (needs the local database) and `pnpm test:e2e`. Report failures with their output; do not
   open the PR while any fails. If the database or browser is not available locally, say so
   plainly instead of skipping silently.
2. Check the tests against `docs/05-qa/01-test-strategy.md`:
   - List every acceptance criterion of the ticket with the test that proves it. A criterion
     with no test blocks the PR (or is marked "manual" with how it was checked).
   - A new or changed screen has a Playwright spec in `e2e/` covering the ticket's main path.
     Walk that path in the running app at desktop and 390px with the Playwright MCP server and
     keep the screenshots for the PR.
   - A bug fix has a test that fails without the fix.
   - `git diff dev -- '*.test.ts' '*.spec.ts'`: any existing test that was edited, skipped or
     deleted, or any lowered threshold, is reported to the developer with the reason. Never
     hide it.
3. Check the diff against `docs/04-delivery/04-definition-of-done.md`: zod + `requireRole` +
   `withAudit` on every mutating action, unit tests for `service.ts` logic, loading / empty /
   error states, 390px layout, seed data.
4. Check the diff touches only the ticket's module, and has no `any`, no `console.log`, no
   secrets and no edited committed migration.
5. Add a line under `[Unreleased]` in `CHANGELOG.md`.
6. Open the PR against `dev` (never `stage` or `main`) using the PR template: what, why,
   ticket ID, the acceptance-criteria-to-test table, screenshots for UI changes, test notes. A human reviews and merges it.
