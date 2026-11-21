## What

<!-- What does this PR do? -->

Ticket: <!-- e.g. E1-04 -->

Goal: <!-- e.g. G1, from the ticket's Goal column -->

## Why

## Screenshot

<!-- Required for UI changes; include the 390px view. -->

## Acceptance criteria and their tests

<!-- One row per acceptance criterion of the ticket. Test = file and test name, or "manual: how". -->

| Acceptance criterion | Test that proves it |
| -------------------- | ------------------- |
|                      |                     |

## Test notes

<!-- How did you verify this? For a bug fix, name the test that reproduces the bug. -->

- [ ] Tests were written from the acceptance criteria before the code, and seen to fail
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm test:int`, `pnpm build`, `pnpm test:e2e` pass
- [ ] UI change: Playwright spec added or extended, and walked through in the browser at desktop and 390px
- [ ] No existing test was edited, skipped or deleted to make this pass (or: explained above)
- [ ] Server actions: zod validation, `requireRole`, `withAudit`
- [ ] Loading, empty and error states
- [ ] Seed data exercises it
- [ ] Targets `dev` (only promotion PRs target `stage` or `main`)
- [ ] Written with Claude? A human has read the whole diff
