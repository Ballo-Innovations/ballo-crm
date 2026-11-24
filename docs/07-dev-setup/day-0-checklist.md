# Day 0 Checklist

What is already in place, what each developer does before their first ticket, and what the team
must decide. About 2 hours per person, most of it reading.

## Already done

- [x] Product name (BalloCRM), GitHub repo, `AGENTS.md` / `CLAUDE.md`, kit copied to `/docs`
- [x] Scaffold: Next.js app with the 9 placeholder module routes, Prisma schema v1, `src/lib`
      stubs, Vitest, CI workflow
- [x] Branches `dev`, `stage`, `main`, all protected; GitHub environments `dev`, `stage`, `prod`
- [x] dev and stage databases and file storage on the shared VM; restricted SSH access
- [x] Shared Claude Code settings, skills and MCP config (`.claude/`, `.mcp.json`)

## Each developer

- [ ] Read, in order: [docs/README.md](../README.md) reading list, then `AGENTS.md`,
      `CONTRIBUTING.md` and [06-working-with-claude.md](../04-delivery/06-working-with-claude.md)
- [ ] Clone the repo, `git switch dev`, and follow "Getting started" in the root `README.md`
- [ ] Confirm `pnpm dev` shows the landing page and
      `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] Add an SSH key to your GitHub account and tell the VM admin, so your `crm-<name>` server
      account can be created ([environments-and-deployment.md](environments-and-deployment.md))
- [ ] Open the repo in Claude Code and start your first ticket with `/start-ticket <id>`
- [ ] Optional: clone the reference CRMs into `/reference` (gitignored, read-only)

## Team decisions before the first ticket

- [x] Dev A is George, Dev B is Benard, Dev C is Chisowa
      ([01-team-and-roles.md](../04-delivery/01-team-and-roles.md)); tickets are assigned by that
      letter
- [ ] Where tickets are tracked: the CSV in this repo, or Switchboard
- [ ] Stand-up time, and who owns the cut list
- [ ] Book the dry-run judge (friend or mentor) for week 3, day 4

## First tickets

Week 0 tickets (`E0-*`) can start as soon as the roles are assigned:

- **E0-01** is done (the scaffold). **E0-09** has its workflow; the first pull request proves it.
- **Dev A starts with E0-03** (first migration). It blocks E0-04, E0-06 and E0-10, and every
  deploy. Nobody else commits a migration before it merges.
- **Dev B starts with E0-07** (app shell), which depends on nothing else.
- **Dev C starts with E0-02** (finish docker-compose and the mock service slot) and **E0-11**
  (DNS, then switch deploys on).
