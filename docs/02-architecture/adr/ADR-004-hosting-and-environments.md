# ADR-004: One Next.js backend, three environments, Docker on our own hosts

**Status:** Accepted (2026-11-20). Replaces the "Railway/Render" hosting line of the kit.

**Context:** The kit left hosting open (a single VPS or Railway/Render) and the repo was connected
to Vercel. The team wants dev, stage and prod environments, a public API hostname, and to reuse
the company's existing shared dev/staging VM. The question of a separate backend service (NestJS, .NET,
FastAPI) behind `api.` was also raised.

**Decision:**

1. **Backend stack stays as ADR-001 set it:** one Next.js 15 app (server actions for the UI, REST
   route handlers under `/api/v1` for integrations), Prisma, PostgreSQL 16, MinIO. No separate
   backend service.
2. **`api.<app host>` is a proxy route to the same app.** Traefik adds the `/api` prefix, so
   `api.<host>/v1/...` reaches `/api/v1/...`.
3. **One repository, three long-lived branches:** `dev` -> `stage` -> `main`, each deploying to
   the environment of the same name (`main` is prod).
4. **Docker Compose behind Traefik on hosts we control.** dev and stage run on the shared
   dev/staging VM; prod runs on a separate host. Images are built by GitHub Actions and stored in
   GHCR, tagged by commit SHA.

**Why not a separate backend:** the scoring engine, recommender and audit rules are pure
TypeScript shared by server actions and REST handlers through one set of zod schemas. A second
service would duplicate that contract, add a second deploy and an auth hop between the two, and
cost days the hackathon does not have, without adding anything the judges score. Postgres already
covers the reporting queries, and the nightly recompute fits an in-process scheduler.

**Why not Vercel or Railway/Render:** the app needs Postgres, MinIO and (later) the mock
integrations service next to it. Compose keeps the three environments and the judge-laptop
fallback identical, costs nothing extra, and avoids exposing a database to the internet.

**Why prod is not on the shared VM:** it is another product's staging box; a noisy neighbour or a
routine restart there must not take the demo down.

**Consequences:**

- Trunk-based flow is replaced by a promotion flow; hotfixes need a back-merge.
- We own TLS, backups and uptime. The runbook is `docs/07-dev-setup/environments-and-deployment.md`.
- A prod host must be provisioned before the demo (ticket E0-13).
- If a real need for a separate service appears after the hackathon (heavy background jobs, a
  second client), the `/api/v1` contract is already the seam to split along.
