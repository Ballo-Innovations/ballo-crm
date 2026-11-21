# Deployment

BalloCRM deploys as a single Next.js 15 application to [Vercel](https://vercel.com), backed by
Firebase (Auth + Firestore) as the only persistent data store. This document covers the
environments, the deploy flow, Firebase project strategy, how to ship Firestore rules/indexes,
the pre-deploy checklist, rollback, and the current state of CI (none - see below).

See [environment.md](./environment.md) for the full variable reference and
[architecture.md](./architecture.md) for how the app is structured. This document assumes you've
already read both.

## Environments

| Environment    | Where it runs                                   | Firebase project                              | Branch                                |
| -------------- | ----------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| **Local dev**  | Developer machine (`npm run dev`)               | A personal or shared **dev** Firebase project | any local branch                      |
| **Preview**    | Vercel Preview deployment, one per pull request | **staging** Firebase project (shared)         | any non-`main` branch, opened as a PR |
| **Production** | Vercel Production deployment                    | **prod** Firebase project                     | `main`                                |

Every PR against `main` automatically gets its own Vercel Preview URL with its own build logs,
so a reviewer can click through the actual running app rather than trusting a description in the
PR body.

## Firebase project strategy - use separate projects per environment

**Recommendation: provision three separate Firebase projects** - e.g. `ballocrm-dev`,
`ballocrm-staging`, `ballocrm-prod` - one per environment above, each with its own
`NEXT_PUBLIC_FIREBASE_*` client config and its own `FIREBASE_ADMIN_*` service account.

This is called out explicitly because it is a realistic hackathon failure mode: with a single
shared Firebase project, a bug in a Preview deployment (or a developer testing locally with
production credentials) can silently write test accounts, opportunities, or activities into the
same Firestore collections judges or real users see in production. Given BalloCRM's multi-tenant
`organizations/{orgId}/...` model (see [database-schema.md](./database-schema.md) and
[firestore-rules.md](./firestore-rules.md)), a stray write during a demo rehearsal could pollute
an organization's data with no clean way to distinguish "real" documents from test ones after the
fact.

Practical setup:

1. Create the three Firebase projects in the Firebase console.
2. Deploy the same `firestore.rules` and `firestore.indexes.json` to all three (see below) - the
   security model doesn't change per environment, only the data does.
3. Set each environment's `NEXT_PUBLIC_FIREBASE_*` / `FIREBASE_ADMIN_*` variables in the matching
   Vercel environment scope (Preview vs. Production) so a Preview build can never authenticate
   against the prod project by accident.
4. If a shared dev project isn't practical for a 3-developer hackathon team, each developer may
   run their own personal Firebase project locally instead - the Firestore emulator suite
   (`firebase.json` already configures `auth`, `firestore`, and the emulator UI) is the safer
   default for local dev, since it never touches a real project at all.

## Current status

The Vercel project (`ballo-innovations/hackerthon-crm`) is connected to
[github.com/Ballo-Innovations/hackerthon-crm](https://github.com/Ballo-Innovations/hackerthon-crm)
via Vercel's native Git integration - pushes to `main` trigger a Production deployment and PRs
get an automatic Preview deployment, with no GitHub Actions workflow required for this part.
Production is live at **https://hackerthon-crm.vercel.app**. No environment variables are
configured on Vercel yet (see [environment.md](./environment.md)) - the app builds and serves
the foundation landing page without them, but any code that calls `getServerEnv()`/
`getClientEnv()` (Firebase, BalloAds, Brutus AI) will fail at runtime until they're set in the
Vercel project's Environment Variables settings, scoped per environment as described below.

## Deploy flow

1. **Push to a feature branch** and open a PR against `main`.
2. **Vercel builds a Preview deployment** automatically for that PR, using the Preview-scoped
   environment variables and the staging Firebase project. The Preview URL is posted back to the
   PR.
3. **Review** the Preview deployment directly (not just the diff) before approving.
4. **Merge to `main`** - Vercel builds and promotes a **Production** deployment automatically,
   using the Production-scoped environment variables and the prod Firebase project.
5. If Firestore rules or indexes changed in the PR, deploy them separately (see below) - Vercel
   only builds and ships the Next.js app, it does not deploy Firebase configuration.

## Deploying Firestore rules and indexes

Rules and indexes are committed at the repo root (`firestore.rules`, `firestore.indexes.json`)
and referenced from `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Deploy both together, against the target project:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project <dev|staging|prod-project-id>
```

Because rules and indexes are deployed independently from the Vercel app build, **a PR that
changes `firestore.rules` or `firestore.indexes.json` must be deployed to the corresponding
Firebase project manually (or via a future CI job - see below) as part of merging that PR** -
merging to `main` alone does not push rules/indexes anywhere. Deploy rules/indexes to staging
before merging so the Preview deployment is tested against the same rules production will get,
and deploy to prod immediately after merging to `main`.

## Pre-deploy checklist

Run these before opening a PR and before merging to `main` - they are the same checks listed in
[CONTRIBUTING.md](../CONTRIBUTING.md)'s code review checklist:

```bash
npm run lint        # eslint .
npm run typecheck   # tsc --noEmit
npm run build       # next build
```

All three must pass locally before pushing. There is no automated gate enforcing this today (see
[No CI pipeline yet](#no-ci-pipeline-yet)), so it is currently a manual discipline, not a
safety net.

## Rollback strategy

Vercel keeps every previous deployment (Preview and Production) available. If a Production
deploy introduces a regression:

1. Open the project's **Deployments** tab in the Vercel dashboard.
2. Find the last known-good Production deployment.
3. Use **Promote to Production** (Vercel's instant rollback) to re-point the production domain at
   that build - this is effectively instantaneous and does not require a revert commit or a new
   build.
4. Follow up with a proper `git revert` on `main` so the rolled-back state is also reflected in
   source control, not just in what's currently deployed.

Rollback only affects the Next.js app. If the regression was caused by a Firestore rules or
indexes change, roll those back separately with `firebase deploy --only firestore:rules` (or
`firestore:indexes`) using the previous committed version of those files.

## No lint/typecheck/build gate yet

Vercel's Git integration (above) deploys on every push regardless of whether lint, typecheck, or
even the build itself would have failed a stricter gate - Vercel's own build step is the only
thing standing between a broken PR and a broken Preview/Production deployment today. **No GitHub
Actions workflow exists yet** to run lint/typecheck as a required status check before that
happens, so the checklist above is run manually by each developer. This is tracked as a known gap
in [risks.md](./risks.md) (R1) and
[roadmap.md](./roadmap.md#known-gaps-to-close-early), which schedules closing it at the start of
Phase 2, before the surface area of a regression gets expensive.

**Recommended first CI workflow** (near-term task, not yet built): a single GitHub Actions
workflow triggered on every PR against `main` that runs, in order:

```yaml
# .github/workflows/ci.yml (proposed - does not exist yet)
- npm ci
- npm run lint
- npm run typecheck
- npm run build
```

Keep this first workflow deliberately minimal - it should fail fast on the same three checks in
the pre-deploy checklist above, giving every PR a required status check before Vercel's Preview
build is trusted. Test execution (Jest/Vitest/Playwright) is intentionally out of scope for this
first workflow because no test framework is installed yet (also tracked in
[risks.md](./risks.md) R1) - add a test step once one exists rather than blocking this workflow
on tooling that doesn't exist.
