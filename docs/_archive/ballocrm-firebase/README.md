> **Archived - do not follow.** This is the earlier Firebase / BalloAds / Brutus AI plan. It was
> superseded when the repo was aligned with the Compass project kit. Current docs: `docs/README.md`.
> Links and paths below describe a layout that no longer exists.

# BalloCRM Documentation Index

This is the source of truth for BalloCRM. If code and docs ever disagree, that's a bug - fix
whichever one is wrong, in the same change. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the
workflow this implies.

New here? Read in this order: [vision.md](./vision.md) → [architecture.md](./architecture.md) →
[folder-structure.md](./folder-structure.md) → [coding-standards.md](./coding-standards.md) →
[tasks/sprint-1.md](./tasks/sprint-1.md).

## Product & Vision

| Doc                            | What it covers                                                                |
| ------------------------------ | ----------------------------------------------------------------------------- |
| [vision.md](./vision.md)       | Problem, users, personas, value proposition, MVP scope                        |
| [glossary.md](./glossary.md)   | Every domain term, alphabetical (incl. Customer Journey vs. BalloAds Journey) |
| [roadmap.md](./roadmap.md)     | Long-term phased roadmap beyond Sprint 1–3                                    |
| [decisions.md](./decisions.md) | Architecture Decision Records - what was chosen and why                       |
| [risks.md](./risks.md)         | Risk register: technical, product, timeline, security                         |

## Architecture & Data

| Doc                                        | What it covers                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- |
| [architecture.md](./architecture.md)       | System, component, API, auth, and deployment architecture            |
| [tech-stack.md](./tech-stack.md)           | Every technology choice, why, and installed version                  |
| [database-schema.md](./database-schema.md) | Every Firestore collection, example docs, relationships              |
| [firestore-rules.md](./firestore-rules.md) | Security rules model, role matrix, emulator testing                  |
| [indexes.md](./indexes.md)                 | Composite indexes and the query patterns they support                |
| [api.md](./api.md)                         | Internal Server Action/Route Handler conventions and worked examples |
| [integrations.md](./integrations.md)       | BalloAds Developer Portal API and Brutus AI integration contracts    |

## UI & Conventions

| Doc                                              | What it covers                                          |
| ------------------------------------------------ | ------------------------------------------------------- |
| [ui-design-system.md](./ui-design-system.md)     | Typography, spacing, components, color, dark mode, a11y |
| [routes.md](./routes.md)                         | Every page: purpose, permissions, components, status    |
| [folder-structure.md](./folder-structure.md)     | The real repo layout and the feature-based pattern      |
| [coding-standards.md](./coding-standards.md)     | How to write code in this repo                          |
| [naming-conventions.md](./naming-conventions.md) | File, variable, schema, Firestore, and route naming     |

## Operations

| Doc                                | What it covers                                                  |
| ---------------------------------- | --------------------------------------------------------------- |
| [deployment.md](./deployment.md)   | Environments, deploy flow, rollback, CI gap                     |
| [environment.md](./environment.md) | Every env var, where to get it, client vs. server               |
| [changelog.md](./changelog.md)     | Points to the root [CHANGELOG.md](../CHANGELOG.md)              |
| [progress.md](./progress.md)       | Live project state: completed / in progress / blocked / pending |

## Project Management ([tasks/](./tasks/))

| Doc                                                | What it covers                                     |
| -------------------------------------------------- | -------------------------------------------------- |
| [sprint-plan.md](./sprint-plan.md)                 | Sprint cadence, team shape, DoR/DoD, critical path |
| [tasks/task-template.md](./tasks/task-template.md) | The required structure for every task              |
| [tasks/backlog.md](./tasks/backlog.md)             | Full product backlog by epic, priority matrix      |
| [tasks/sprint-1.md](./tasks/sprint-1.md)           | Current sprint - full task detail                  |
| [tasks/sprint-2.md](./tasks/sprint-2.md)           | Next sprint - full task detail                     |
| [tasks/sprint-3.md](./tasks/sprint-3.md)           | Sprint after that - full task detail               |
| [tasks/developer-1.md](./tasks/developer-1.md)     | Infrastructure & Auth track                        |
| [tasks/developer-2.md](./tasks/developer-2.md)     | Shell, Design System & Navigation track            |
| [tasks/developer-3.md](./tasks/developer-3.md)     | Core CRM Domain track                              |
| [tasks/completed.md](./tasks/completed.md)         | Completed task log                                 |
| [tasks/blocked.md](./tasks/blocked.md)             | Blocked task log                                   |

## Reference

| Doc                                                                                  | What it covers                                                                                            |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [reference/balloads-crm-backend-notes.md](./reference/balloads-crm-backend-notes.md) | Real BalloAds backend engineering notes (health score, journey triggers) used to ground `integrations.md` |
| [_context/PROJECT_BRIEF.md](./_context/PROJECT_BRIEF.md)                             | Internal seed brief for anyone (human or AI) generating further docs/code - not end-user documentation    |
