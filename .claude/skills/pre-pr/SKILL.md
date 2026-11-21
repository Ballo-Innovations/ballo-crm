---
name: pre-pr
description: Check a BalloCRM branch before opening a pull request. Use when asked to open a PR, finish a ticket or check that work is ready for review.
---

# Before opening a PR

1. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Report failures with their
   output; do not open the PR while any fails.
2. Check the diff against `docs/04-delivery/04-definition-of-done.md`: zod + `requireRole` +
   `withAudit` on every mutating action, unit tests for `service.ts` logic, loading / empty /
   error states, 390px layout, seed data.
3. Check the diff touches only the ticket's module, and has no `any`, no `console.log`, no
   secrets and no edited committed migration.
4. Add a line under `[Unreleased]` in `CHANGELOG.md`.
5. Open the PR against `dev` (never `stage` or `main`) using the PR template: what, why,
   ticket ID, screenshot for UI changes, test notes. A human reviews and merges it.
