# Sprint Plan — 3 weeks (compress proportionally if the hackathon window is shorter)

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

1. Live SMS/email → mock only 2. Sales dashboard → fold into executive 3. Account plan editor → read-only seeded plan 4. Signer order → single signer 5. Whitespace matrix → table of recommendations
