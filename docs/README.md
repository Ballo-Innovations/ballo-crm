# BalloCRM docs

These are the Compass project kit documents, copied in with their content unchanged (Markdown
reformatted by Prettier). The kit calls the product
"Compass"; it is the same product as BalloCRM.

Read in this order on day 0:

1. [00-executive/01-vision-and-strategy.md](00-executive/01-vision-and-strategy.md) - what we are building and why it wins
2. [01-product/01-PRD.md](01-product/01-PRD.md) - requirements, personas, user stories, coverage matrix
3. [02-architecture/01-architecture.md](02-architecture/01-architecture.md) and [02-data-model.md](02-architecture/02-data-model.md) - how it is built
4. [04-delivery/02-sprint-plan.md](04-delivery/02-sprint-plan.md) and [03-tickets.csv](04-delivery/03-tickets.csv) - who does what, when
5. [../AGENTS.md](../AGENTS.md) - conventions for every contributor and AI agent

| Folder                             | Contents                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| [00-executive](00-executive)       | Vision, judging strategy, risk register                                              |
| [01-product](01-product)           | PRD, scoring and grading spec, VSI and dashboards spec, recommender spec             |
| [02-architecture](02-architecture) | Architecture, data model, API spec, adapters, security, ADRs, original Prisma schema |
| [03-design](03-design)             | Design system, wireframes, UX flows                                                  |
| [04-delivery](04-delivery)         | Team roles, sprint plan, tickets (CSV), definition of done, git workflow             |
| [05-qa](05-qa)                     | Test strategy, test cases, seed data spec                                            |
| [06-pitch](06-pitch)               | Deck outline, demo script, one-pager                                                 |
| [07-dev-setup](07-dev-setup)       | Day-0 checklist                                                                      |

The live schema is `prisma/schema.prisma` at the repo root; seed inputs are in `prisma/seed/`.

## Where the repo differs from the kit

- **Name:** BalloCRM, not Compass.
- **Prisma is pinned to v6**, because the kit schema is written for it (`prisma-client-js`,
  `url` in the datasource block).
- **docker-compose:** `app` and `mock-integrations` are behind the `full` profile until their
  Dockerfiles exist.
- **Hosting:** the repo is currently connected to Vercel; the kit names Railway/Render. Decide in
  ticket E0-11.

## Archive

[_archive/ballocrm-firebase](_archive/ballocrm-firebase) is the earlier Firebase / BalloAds /
Brutus AI plan. It is superseded and kept only for reference.
