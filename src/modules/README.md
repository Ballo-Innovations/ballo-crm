# Modules

One folder per business module; the folder is the ownership boundary
(`docs/02-architecture/01-architecture.md`).

| Module          | Owner | Epic   | Scope                                                                 |
| --------------- | ----- | ------ | --------------------------------------------------------------------- |
| `pipeline/`     | Dev A | E1     | Leads, opportunities, stages, Kanban.                                 |
| `accounts/`     | Dev A | E2     | Account 360, contacts, subscriptions.                                 |
| `abm/`          | Dev C | E3     | Buying committees, account plans, playbooks.                          |
| `engagement/`   | Dev C | E3     | Engagement events (DC tours, demos, events) and the unified timeline. |
| `intelligence/` | Dev B | E4, E5 | Scoring, grading, recommender, insights, LLM narration.               |
| `dashboards/`   | Dev B | E6     | VSI, forecast, charts.                                                |
| `contracts/`    | Dev C | E7     | Templates, PDF, e-sign, renewals.                                     |
| `cims/`         | Dev A | E8     | RBAC admin, audit log, API keys, data protection.                     |
| `integrations/` | Dev C | E9     | Adapter interfaces, registry, mocks.                                  |

Each module exposes the same four files:

- `actions.ts` - server actions (`requireRole` -> zod parse -> `withAudit`)
- `queries.ts` - reads, including row-level filters
- `service.ts` - pure logic, unit-tested, no DB access
- `types.ts` - types and zod schemas

Routes live in `src/app/`; shared helpers in `src/lib/`; shadcn primitives in `src/components/ui/`.
