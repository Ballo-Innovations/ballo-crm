---
name: start-ticket
description: Start work on a BalloCRM ticket from docs/04-delivery/03-tickets.csv. Use when asked to start, pick up or work on a ticket ID such as E1-04.
---

# Start a ticket

1. Find the row for the ticket ID in `docs/04-delivery/03-tickets.csv`. Stop and ask if the ID is
   missing or a ticket in its "Depends on" column is not merged to `dev` yet.
2. Restate the acceptance criteria to the developer, one line each, and name the module folder
   the work belongs in (`src/modules/README.md`). Name the goal in the ticket's `Goal` column and
   list that goal's "proven when" checks from `docs/01-product/00-goals-and-success-metrics.md`
   that this ticket must make pass.
3. Read the spec the ticket depends on (`docs/01-product`, `docs/02-architecture`,
   `docs/03-design`) before writing code.
4. Branch from an up-to-date `dev`: `git switch dev && git pull && git switch -c feat/<ticket-id>-<slug>`
   (`fix/`, `chore/`, `docs/` for other kinds of work).
5. Stay inside the ticket's module. A change to `prisma/schema.prisma`, `src/lib/`, CI or
   `deploy/` that the ticket does not name needs the developer's go-ahead first.
6. When done, run the `pre-pr` skill.
