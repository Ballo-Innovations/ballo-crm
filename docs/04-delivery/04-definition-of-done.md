# Definition of Done

A ticket is Done when:

- [ ] Code merged to `main` via PR with one review
- [ ] Server action validates input with zod and is wrapped in `withAudit` + `requireRole`
- [ ] `service.ts` logic has unit tests (Vitest) if it contains any computation
- [ ] Screen has loading, empty and error states
- [ ] Works on 390px width
- [ ] Seed data exercises it
- [ ] Demo script step (if any) walked through on the deployed URL
- [ ] No TypeScript errors, lint clean, CI green
