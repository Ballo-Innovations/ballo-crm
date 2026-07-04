# lib/

Framework-level integration code that isn't business logic: SDK initialization, low-level
clients, and cross-cutting utilities that many features depend on.

- `lib/firebase/client.ts` — browser Firebase SDK (Auth, Firestore). Client Components only.
- `lib/firebase/admin.ts` — server Firebase Admin SDK. Server Components/Actions/Route Handlers
  only (guarded by the `server-only` package).
- `lib/balloads/` — BalloAds developer-portal API client (see `docs/integrations.md`).
- `lib/brutus/` — Brutus AI client (see `docs/integrations.md`).

If it wraps a third-party SDK or protocol, it goes here. If it composes multiple `lib/` clients
into a business operation (e.g. "create account and log an activity"), it belongs in
`services/` instead.
