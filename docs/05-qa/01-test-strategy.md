# Test Strategy

| Layer       | Tool                           | Scope                                                                          | Owner                        |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------ | ---------------------------- |
| Unit        | Vitest                         | `service.ts` in intelligence, dashboards, cims (rbac), contracts (merge)       | each dev                     |
| Integration | Vitest + test DB               | server actions with audit + rbac                                               | Dev A                        |
| E2E smoke   | Playwright                     | login → kanban drag → score drawer → log tour → recommendation → contract sign | Dev C                        |
| Manual      | Checklist (`02-test-cases.md`) | every demo beat + every role                                                   | Dev C nightly, all in week 3 |
| Performance | Lighthouse + manual            | dashboard, kanban, account 360 on full seed                                    | Dev A                        |
| Security    | Checklist in architecture/05   | auth, RBAC bypass attempts, token reuse                                        | Dev A                        |

## Rules

- Scoring and recommender tests are table-driven from the spec; a spec change requires a test change in the same PR.
- CI blocks merge on unit failures; Playwright runs nightly and on release tag.
- Bug triage: P0 = breaks a demo beat (fix today); P1 = visible but not on script; P2 = cosmetic.
