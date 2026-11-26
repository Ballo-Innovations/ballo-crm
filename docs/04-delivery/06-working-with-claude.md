# Working with Claude

All three developers code with Claude Code. These rules keep three people and three agents from
stepping on each other. `AGENTS.md` is the rulebook Claude reads on every session; this page is
for the humans driving it.

## What is shared in the repo

| File                          | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `AGENTS.md` / `CLAUDE.md`     | Conventions every session loads. Change it by PR, like code.            |
| `.claude/settings.json`       | Shared permissions: what Claude may run freely, must ask for, or never. |
| `.claude/skills/start-ticket` | Restates acceptance criteria, reads the spec, branches from `dev`.      |
| `.claude/skills/pre-pr`       | Runs the checks and the definition of done before a PR.                 |
| `.mcp.json`                   | MCP servers every developer gets (see below).                           |

Personal preferences go in `.claude/settings.local.json`, which is gitignored.

## Rules

1. **One ticket, one session, one branch.** Start with `/start-ticket E1-04`. Do not let a session
   drift into a second ticket; open a new one.
2. **Module ownership applies to Claude.** A session stays inside its ticket's module folder.
   Changes to `prisma/schema.prisma`, `src/lib/`, CI, `deploy/` or `AGENTS.md` go through Dev A
   (Dev C for CI and `deploy/`), so two agents never rewrite the same shared file.
3. **Specs before code.** Claude reads the spec the ticket points at. If the spec and the ticket
   disagree, stop and ask in the team channel; do not let Claude pick.
4. **A human reads every line.** The developer who ran the session reads the whole diff before
   opening the PR. "Claude wrote it" is not a review. Run `/code-review` before merging. A second
   developer's review is optional, except for schema, `src/lib/`, scoring, auth and `deploy/`
   changes. The developer merges; Claude does not.
5. **Tests are not negotiable, and they come first.** Claude writes both the code and the tests,
   so a test written after the code only proves the code does what it does. For every ticket:
   list the acceptance criteria and the test that will prove each one, write those tests from the
   ticket and the spec, see them fail, then write the code. Scoring, grading and recommender
   tests come from the spec's worked examples. A UI ticket adds a Playwright spec and is walked
   through in the browser before the PR. A bug fix starts with a failing test. Never accept a
   change that edits, skips or deletes a test, or lowers a threshold, to make it pass without
   checking the spec. Full rules: `docs/05-qa/01-test-strategy.md`.
6. **Claude never touches prod.** It does not merge PRs, push to `stage` or `main`, run the
   Deploy workflow against prod, or SSH to a host without being asked in that session. The shared
   settings enforce most of this; the rest is on the developer.
7. **No secrets in prompts.** Never paste a `.env`, key or password into a session, ticket or PR.
   Claude is denied read access to `.env` files.
8. **No new dependencies without the team.** The stack list in `AGENTS.md` is closed. Anything
   else needs a yes from Dev A first.
9. **No copied code.** The reference CRMs under `/reference` are for reading only (risk R9).
10. **Keep the attribution.** Leave the `Co-Authored-By: Claude` line on commits so AI-written
    work stays traceable.
11. **Small PRs.** One ticket, under about 400 changed lines where possible. Large generated
    diffs do not get reviewed properly.
12. **Fix the rulebook, not the session.** When Claude repeats a mistake, add one line to
    `AGENTS.md` by PR so the other two developers' sessions stop making it too.

## Server access

Each developer has a personal `crm-<name>` SSH account limited to BalloCRM's dev and stage
(`docs/07-dev-setup/environments-and-deployment.md`). Claude asks before every `ssh` command. Let
it read (`status`, `logs`, `health`); run `seed --reset`, `migrate`, `rollback` and `psql`
yourself.

## Avoiding collisions

- Pull `dev` before starting and rebase before opening the PR.
- Migrations are the main conflict point: one open migration PR at a time, announced in the team
  channel, merged quickly. Never edit a committed migration.
- `pnpm db:seed --reset` on the shared dev environment wipes everyone's data. Announce it first.

## MCP servers and tools

| Tool              | Status                         | Use                                                                             |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Playwright MCP    | In `.mcp.json`                 | Walk every UI ticket's main path at desktop and 390px before its PR.            |
| GitHub (`gh` CLI) | Each developer logs in locally | Branches, PRs, CI status.                                                       |
| Switchboard       | **Not decided**                | See below.                                                                      |
| Database access   | Not configured                 | Use `pnpm db:studio` locally. No agent gets stage or prod database credentials. |

**Switchboard.** Tickets currently live in `docs/04-delivery/03-tickets.csv`. If the team wants
them in Switchboard, decide: (1) is the CSV or Switchboard the source of truth, (2) who imports
the tickets, (3) how Claude reaches it. No Switchboard MCP server is configured for this repo;
the only existing automation is a browser-driven delivery skill written for another project. Until
this is decided, the CSV is the source of truth and Claude updates nothing outside the repo.

## Daily loop

1. Stand-up: each developer names the ticket their session will work on.
2. `/start-ticket <id>` -> tests from the acceptance criteria -> build -> `/pre-pr` -> PR to
   `dev` -> review -> squash-merge.
3. Merge deploys to dev automatically. Dev C promotes `dev` to `stage` at end of day and runs the
   QA checklist there.
