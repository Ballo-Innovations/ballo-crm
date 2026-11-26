# Definition of Done

A ticket is Done when:

- [ ] Acceptance criteria met, and the "proven when" checks for the ticket's goal that it touches
      pass (`docs/01-product/00-goals-and-success-metrics.md`)
- [ ] Code merged to `dev` via PR with CI green, after the author has read the whole diff (also when Claude
      wrote it); a second reviewer for schema, `src/lib/`, scoring, auth and `deploy/` changes
- [ ] Server action validates input with zod and is wrapped in `withAudit` + `requireRole`
- [ ] Every acceptance criterion has a test that proves it, named in the PR; the tests were
      written from the ticket and spec before the code (`docs/05-qa/01-test-strategy.md`)
- [ ] `service.ts` logic has unit tests (Vitest) and stays above the coverage floor
- [ ] Server actions and queries have an integration test against the database (`*.int.test.ts`)
- [ ] A new or changed screen has a Playwright spec in `e2e/`, and was walked through in the
      browser at desktop and 390px
- [ ] A bug fix includes the test that reproduces the bug
- [ ] Screen has loading, empty and error states
- [ ] Works on 390px width
- [ ] Seed data exercises it
- [ ] Demo script step (if any) walked through on the stage URL
- [ ] No TypeScript errors, lint clean, CI green
- [ ] New environment variables added to `.env.example`, `deploy/.env.example` and `src/lib/env.ts`
