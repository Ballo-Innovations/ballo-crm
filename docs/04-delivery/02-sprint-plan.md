# Sprint Plan — 3 weeks (compress proportionally if the hackathon window is shorter)

**Submission deadline: 29 November 2026.** Work started on 21 November, so the three "weeks"
below are compressed into nine days:

| Dates (Nov 2026) | Phase                                          | Exit                                                               |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| 21–22            | Week 0: Foundations                            | Login works; empty screens for every module                        |
| 23–24            | Week 1: Core CRM + engine                      | Demo beats 1–3 work                                                |
| 25–26            | Week 2: Intelligence + workflows               | Full demo script runs end to end; mid-point cut review on the 25th |
| 27               | Feature freeze; QA pass; dry-run judging       | All P0 test cases pass on stage                                    |
| 28               | Fix the lowest rubric row; rehearsals; backups | Laptop fallback tested                                             |
| 29               | Final rehearsal and submission                 | Submitted                                                          |

With this little time, P0 tickets come first across every epic. Start a P1 ticket only when your
P0 tickets are merged, and check the fallbacks in `01-product/00-goals-and-success-metrics.md`.

## Week 0 (prep, 2–3 days) — "Foundations"

- Repo, CI, docker-compose, Prisma schema, migrations, auth, RBAC, audit middleware, design system, app shell with nav, seed v0 (small).
- Exit: login works; empty screens exist for every module; one PR per dev merged.

## Week 1 — "Core CRM + Engine"

- Dev A: Leads, Accounts list + 360 (profile, contacts, subscriptions, timeline), Opportunities CRUD, Kanban.
- Dev B: Scoring engine + tests, grade badges, explanation drawer, recompute triggers, Focus list v1, seed v1 (realistic).
- Dev C: Engagement events + log form, ABM committee map, mock-integrations service, inbound email webhook.
- Exit (demo beat 1–3 work): convert lead → kanban → explain score → log tour → grade changes.

## Week 2 — "Intelligence + Workflows"

- Dev A: CIMS admin (users, roles, audit page, API keys, data export/erase), OpenAPI.
- Dev B: Recommender rules + LLM narratives + cache, Insights generator, Executive dashboard, VSI + drilldown, whitespace matrix, sales dashboard.
- Dev C: Contracts: templates, merge, PDF, MinIO, send, /sign page, renewals; adapters wired to mock; integrations admin tab; ERP push on WON.
- Exit (beats 4–7 work): full demo script runnable end-to-end.

## Week 3 — "Polish, QA, Pitch"

- Day 1–2: QA pass against `05-qa/02-test-cases.md`, bug bash, performance on seed, mobile check.
- Day 3: Freeze features. Seed data review. Deck + demo script rehearsal #1.
- Day 4: Dry-run judging; fix lowest rubric row. Rehearsal #2.
- Day 5: Deploy freeze, backups, laptop fallback tested, rehearsal #3. Submit.

## Cut list (if behind at mid-point, cut in this order)

1. Live SMS/email → mock only
2. Sales dashboard → fold into executive (the conversion funnel moves with it; it is a challenge capability)
3. Account plan editor → read-only seeded plan
4. Signer order → single signer
5. Whitespace matrix → table of recommendations

Before cutting anything, check "Do not cut without a fallback" in
`01-product/00-goals-and-success-metrics.md`. A cut must never drop a challenge capability.
