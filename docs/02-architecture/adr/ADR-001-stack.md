# ADR-001: Build a single Next.js + Postgres app instead of integrating open-source CRMs

**Status:** Accepted
**Context:** Challenge 2 could be assembled from Twenty/EspoCRM + Documenso + Metabase. All are AGPL; integration across 3–4 containers is slow DevOps work; AI-assisted coding is fastest on a single conventional TypeScript codebase.
**Decision:** One Next.js 15 / TypeScript / Prisma / Postgres app. Open-source CRMs used for _reference_ only (schema ideas, UX patterns), never copied.
**Consequences:** We own licence and narrative; we must build e-sign and dashboards ourselves (acceptable scope, see specs); real email sync deferred to webhook stub.
