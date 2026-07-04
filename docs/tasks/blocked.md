# Blocked Tasks

This is the log of tasks a developer (human or AI) cannot currently make progress on, and why. A
task belongs here — rather than just sitting untouched in [sprint-plan.md](../sprint-plan.md),
[backlog.md](./backlog.md), or a sprint file — the moment it fails the Definition of Ready (see
[sprint-plan.md](../sprint-plan.md)) for a reason outside the assigned developer's control: a
hard dependency on another unfinished Task ID, an external unknown (missing spec, credential, or
third-party access), or a decision that hasn't been made yet.

## When to add an entry

Add a row as soon as a task is identified as blocked, even before anyone has started it — don't
wait until a developer hits the wall mid-implementation. Reference the exact Task ID from its
home file so it's traceable, and be specific in "Blocked By": name the dependency Task ID, the
missing artifact, or the open decision — not just "waiting on stuff."

## When to remove an entry

Never delete a row outright once it has been true history. When a task becomes unblocked: move
its detail back into the appropriate sprint file or [backlog.md](./backlog.md) so work can
resume, and update this row's `Blocked By` (or a trailing note) to read "unblocked on
`<date>`" before it is finally cleared out in a later cleanup pass — the commit message for that
change should say what removed the blocker. Do not silently delete the row without that trail;
the point of this file is to make blocking history auditable later (useful for a hackathon
post-mortem on where time was lost).

## Current status

No task is hard-blocked yet — Sprint 1 has not started, so no in-flight task has hit a dependency
wall. There is one soft-blocker worth tracking now so it doesn't get lost once integration work
begins.

| Task ID     | Title                                                                                                                    | Blocked Since | Blocked By                                                                                                                                                                                                                                                                                                            | Owner                          | Next Action                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INTEG-000` | Full BalloAds Developer Portal API integration beyond the illustrative contract in [integrations.md](../integrations.md) | 2026-07-04    | Soft-blocked: no live OpenAPI spec / API reference has been received from the BalloAds team yet — [integrations.md](../integrations.md) currently documents endpoint paths and payloads under `/v1/developer-portal/*` as illustrative/"to be confirmed," per the BalloAds Integration Contract in the project brief. | Developer 1 / Integration lead | Request the developer-portal API reference from the BalloAds team; until then, build `lib/balloads/` against the documented `/v1/developer-portal/*` prefix with typed request/response interfaces (Zod schemas + inferred types) that are easy to adjust once the real spec arrives, so no downstream feature work (Health Score enrichment, journey triggers, opt-out/delivery status reads) is fully stalled. |
