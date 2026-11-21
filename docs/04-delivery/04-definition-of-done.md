# Definition of Done

A ticket is Done when:

- [ ] Acceptance criteria met, and the "proven when" checks for the ticket's goal that it touches
      pass (`docs/01-product/00-goals-and-success-metrics.md`)
- [ ] Code merged to `dev` via PR with one human review (also when Claude wrote it)
- [ ] Server action validates input with zod and is wrapped in `withAudit` + `requireRole`
- [ ] `service.ts` logic has unit tests (Vitest) if it contains any computation
- [ ] Screen has loading, empty and error states
- [ ] Works on 390px width
- [ ] Seed data exercises it
- [ ] Demo script step (if any) walked through on the stage URL
- [ ] No TypeScript errors, lint clean, CI green
- [ ] New environment variables added to `.env.example`, `deploy/.env.example` and `src/lib/env.ts`
