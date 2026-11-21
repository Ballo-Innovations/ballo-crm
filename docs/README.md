# BalloCRM docs

These are the Compass project kit documents, copied in (Markdown reformatted by Prettier). Content is unchanged
except where listed under "Where the repo differs from the kit" below. The kit calls the product
"Compass"; it is the same product as BalloCRM.

Read in this order on day 0:

1. [01-product/00-goals-and-success-metrics.md](01-product/00-goals-and-success-metrics.md) - the problem, the seven goals and how each is measured
2. [00-executive/01-vision-and-strategy.md](00-executive/01-vision-and-strategy.md) - what we are building and why it wins
3. [01-product/01-PRD.md](01-product/01-PRD.md) - requirements, personas, user stories, coverage matrix
4. [02-architecture/01-architecture.md](02-architecture/01-architecture.md) and [02-data-model.md](02-architecture/02-data-model.md) - how it is built
5. [04-delivery/02-sprint-plan.md](04-delivery/02-sprint-plan.md) and [03-tickets.csv](04-delivery/03-tickets.csv) - who does what, when
6. [../AGENTS.md](../AGENTS.md) - conventions for every contributor and AI agent
7. [04-delivery/05-git-workflow.md](04-delivery/05-git-workflow.md) and [04-delivery/06-working-with-claude.md](04-delivery/06-working-with-claude.md) - branches, PRs and coding with Claude
8. [07-dev-setup/day-0-checklist.md](07-dev-setup/day-0-checklist.md) - what to do before your first ticket

| Folder                             | Contents                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| [00-executive](00-executive)       | Vision, judging strategy, risk register                                                             |
| [01-product](01-product)           | Goals and success metrics, PRD, scoring and grading spec, VSI and dashboards spec, recommender spec |
| [02-architecture](02-architecture) | Architecture, data model, API spec, adapters, security, ADRs, original Prisma schema                |
| [03-design](03-design)             | Design system, wireframes, UX flows                                                                 |
| [04-delivery](04-delivery)         | Team roles, sprint plan, tickets (CSV), definition of done, git workflow, Claude rules              |
| [05-qa](05-qa)                     | Test strategy, test cases, seed data spec                                                           |
| [06-pitch](06-pitch)               | Deck outline, demo script, one-pager                                                                |
| [07-dev-setup](07-dev-setup)       | Day-0 checklist, environments and deployment runbook                                                |

The live schema is `prisma/schema.prisma` at the repo root; seed inputs are in `prisma/seed/`.

## Where the repo differs from the kit

- **Name:** BalloCRM, not Compass.
- **Prisma is pinned to v6**, because the kit schema is written for it (`prisma-client-js`,
  `url` in the datasource block).
- **MinIO image:** `cgr.dev/chainguard/minio`, because `minio/minio` is no longer published.
- **docker-compose:** `app` and `mock-integrations` are behind the `full` profile until their
  Dockerfiles exist.
- **Hosting:** decided in [ADR-004](02-architecture/adr/ADR-004-hosting-and-environments.md):
  Docker Compose behind Traefik on our own hosts, with dev, stage and prod environments. The kit
  named Railway/Render. Runbook:
  [07-dev-setup/environments-and-deployment.md](07-dev-setup/environments-and-deployment.md).
- **Git workflow:** `dev` → `stage` → `main` promotion instead of the kit's trunk-based flow
  ([04-delivery/05-git-workflow.md](04-delivery/05-git-workflow.md)).
- **Working with Claude:** team rules for AI-assisted coding, not in the kit
  ([04-delivery/06-working-with-claude.md](04-delivery/06-working-with-claude.md)).
- **Tickets:** E0-11 rewritten for the new hosting; E0-13 (prod host) added; a `Goal` column
  added.
- **Goals and metrics:** [01-product/00-goals-and-success-metrics.md](01-product/00-goals-and-success-metrics.md)
  is new. It also led to forecast definitions (commit, best case, closed, win rate) being added to
  the dashboards spec, which the kit left undefined.

## Archive

[_archive/ballocrm-firebase](_archive/ballocrm-firebase) is the earlier Firebase / BalloAds /
Brutus AI plan. It is superseded and kept only for reference.
