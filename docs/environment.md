# Environment Variables

BalloCRM validates all environment variables through Zod schemas in `config/env.ts` — nothing
reads `process.env` directly outside that file. There are two schemas:

- **`getClientEnv()`** — parses `clientEnvSchema`. Only variables prefixed `NEXT_PUBLIC_` (plus
  `NODE_ENV`, which Next.js provides automatically) belong here. Safe to import from Client
  Components; these values are bundled into the browser JS.
- **`getServerEnv()`** — parses `serverEnvSchema`, which **extends** `clientEnvSchema` with every
  server-only secret. Import only from server code (Server Components, Server Actions, Route
  Handlers, `repositories/`, `services/`). Importing this from a Client Component is a bug, not a
  config error — see [risks.md](./risks.md) (R6) and [coding-standards.md](./coding-standards.md).

The authoritative list of variables lives in `.env.example` at the repo root — this document
explains what each one is for and where to get its value. If the two ever disagree, fix whichever
one is stale; per [CONTRIBUTING.md](../CONTRIBUTING.md), new env vars must be added to both
`.env.example` and this file in the same change.

## Next.js / App

| Variable              | Client-safe?             | Schema                                         | Description / where to get it                                                                                                                                                                                                 |
| --------------------- | ------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Yes (`NEXT_PUBLIC_`)     | `getClientEnv()`                               | The app's canonical base URL — `http://localhost:3000` locally, the Preview deployment URL on a PR, or the production domain. Used for building absolute links (e.g., email/notification links, OAuth redirect construction). |
| `NODE_ENV`            | Yes (framework-provided) | not in `config/env.ts` — set by Next.js/Vercel | Standard Node environment flag (`development`, `production`, `test`). Not user-configured; Next.js and Vercel set this automatically.                                                                                         |

## Firebase (client SDK — safe to expose to the browser)

All six values come from the same place: **Firebase console → Project settings → General →
Your apps → SDK setup and configuration** for the web app registered under your Firebase project.
Belongs to both `clientEnvSchema` and (by extension) `serverEnvSchema`, since server code can also
read client-safe values.

| Variable                                   | Client-safe? | Schema           | Description                                                                                                                                                   |
| ------------------------------------------ | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Yes          | `getClientEnv()` | Firebase web API key. Public by design — Firebase security is enforced by [firestore-rules.md](./firestore-rules.md), not by hiding this key.                 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Yes          | `getClientEnv()` | `<project-id>.firebaseapp.com` — used by Firebase Auth for redirect-based sign-in flows.                                                                      |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Yes          | `getClientEnv()` | The Firebase/GCP project ID. Must match the project the Admin SDK vars below point at for a given environment.                                                |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Yes          | `getClientEnv()` | Default Cloud Storage bucket, `<project-id>.appspot.com` (or `.firebasestorage.app` on newer projects). Not actively used until a feature needs file storage. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes          | `getClientEnv()` | Cloud Messaging sender ID. Required by the Firebase client SDK init call even if push notifications aren't used yet.                                          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Yes          | `getClientEnv()` | The Firebase web app's unique app ID.                                                                                                                         |

## Firebase Admin SDK (server-only secrets — never expose to the browser)

Generated from **Firebase console → Project settings → Service accounts → Generate new private
key**, which downloads a JSON file containing all three values below. Belongs to
`serverEnvSchema` only — `lib/firebase/admin.ts` reads these via `getServerEnv()` and is guarded
by the `server-only` package so importing it from client code fails the build.

| Variable                      | Client-safe? | Schema           | Description                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_ADMIN_PROJECT_ID`   | **No**       | `getServerEnv()` | `project_id` field from the downloaded service account JSON.                                                                                                                                                                                                                                                                                                          |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | **No**       | `getServerEnv()` | `client_email` field from the service account JSON.                                                                                                                                                                                                                                                                                                                   |
| `FIREBASE_ADMIN_PRIVATE_KEY`  | **No**       | `getServerEnv()` | `private_key` field from the service account JSON. Keep the literal `\n` escapes exactly as they appear in the downloaded JSON when pasting into `.env.local` or a Vercel env var — `lib/firebase/admin.ts` un-escapes them into real newlines at runtime. Wrap the value in double quotes so `\n` isn't interpreted by the shell/dotenv parser as an actual newline. |

Never commit a real service account JSON or its extracted values to the repo. If one is ever
committed by mistake, treat it as compromised: revoke it in the Firebase console (Service accounts
→ manage keys) and generate a new one.

## Vercel (populated automatically on Vercel; leave blank locally)

These are provided by the Vercel runtime itself — you do not set them by hand. They're listed in
`.env.example` so `config/env.ts`/type definitions have somewhere to document them and so local
`.env.local` files know to leave them empty.

| Variable     | Client-safe?                                                | Schema | Description                                                                                                                    |
| ------------ | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `VERCEL_URL` | No (server-only convention; not in `serverEnvSchema` today) | n/a    | The deployment's auto-generated URL (e.g. a Preview deployment's unique hostname). Set automatically by Vercel; blank locally. |
| `VERCEL_ENV` | No                                                          | n/a    | One of `production`, `preview`, or `development`, set automatically by Vercel. Blank locally.                                  |

## BalloAds Developer Portal API

BalloCRM never sends SMS/WhatsApp/Email itself — it calls BalloAds' existing developer-portal
API for messaging. See [integrations.md](./integrations.md) for the endpoint contract (marked
"to be confirmed" where the OpenAPI spec isn't final yet).

| Variable                     | Client-safe? | Schema           | Description / where to get it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BALLOADS_API_BASE_URL`      | **No**       | `getServerEnv()` | Base URL for BalloAds' developer-portal API, e.g. `https://api.balloads.com/v1/developer-portal`. Defaults to the production BalloAds API in `.env.example`; override only if BalloAds provides a sandbox/staging base URL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `BALLOADS_DEVELOPER_API_KEY` | **No**       | `getServerEnv()` | Per-organization developer API key issued from the **BalloAds developer portal dashboard** (under the organization's API/integrations settings). This is the same credential model described in the [project brief](./_context/PROJECT_BRIEF.md) §5 — in the running app, each organization's key is stored encrypted in `organizations/{orgId}/integrations/balloAds` (a Firestore path with `allow read, write: if false` — Admin SDK access only), not solely as a single global env var. This top-level env var is useful for local development and single-tenant testing before per-org key storage is wired up. Must never reach the browser — always called from Server Actions/Route Handlers. |

## Brutus AI

Brutus AI powers opportunity qualification scoring, next-best-action, summarization, and
commercial-analytics Q&A (see [integrations.md](./integrations.md)).

| Variable                 | Client-safe? | Schema           | Description / where to get it                                                                                                                                                            |
| ------------------------ | ------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRUTUS_AI_API_BASE_URL` | **No**       | `getServerEnv()` | Base URL for the Brutus AI API. Get this from the **Brutus AI dashboard** (API/developer settings section) for the environment you're targeting.                                         |
| `BRUTUS_AI_API_KEY`      | **No**       | `getServerEnv()` | API key issued from the **Brutus AI dashboard**. Server-only — AI Jobs are invoked from Server Actions per [architecture.md](./architecture.md), never called directly from the browser. |

## Analytics & Logging (optional — leave blank to disable)

Not currently wired into any code path (no analytics or Sentry client is installed yet per the
[project brief](./_context/PROJECT_BRIEF.md) ground-truth state) — reserved for near-term use.
None of these are in `config/env.ts`'s schemas yet; add them there when the corresponding
integration is built, per [CONTRIBUTING.md](../CONTRIBUTING.md)'s "new env vars" checklist item.

| Variable                          | Client-safe?         | Schema                     | Description / where to get it                                                                           |
| --------------------------------- | -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ANALYTICS_WRITE_KEY` | Yes (`NEXT_PUBLIC_`) | not yet in `config/env.ts` | Write key for a product-analytics provider (not chosen yet). Leave blank to disable analytics entirely. |
| `LOG_LEVEL`                       | No                   | not yet in `config/env.ts` | Server-side log verbosity (`debug`, `info`, `warn`, `error`). Defaults to `info`.                       |
| `SENTRY_DSN`                      | No                   | not yet in `config/env.ts` | Sentry (or equivalent error-tracking) project DSN. Leave blank to disable error reporting.              |

## Local setup

1. Copy the template: `cp .env.example .env.local`
2. Create (or reuse) a **dev** Firebase project — see [deployment.md](./deployment.md#firebase-project-strategy--use-separate-projects-per-environment)
   for why dev/staging/prod should be separate projects. In Firebase console: **Build → Firestore
   Database** (create in test mode is fine locally, since `firestore.rules` is deployed
   separately) and **Build → Authentication** (enable the sign-in providers the app needs).
3. Fill in the six `NEXT_PUBLIC_FIREBASE_*` values from **Project settings → General → Your apps**.
4. Generate an Admin SDK service account (**Project settings → Service accounts → Generate new
   private key**) and fill in the three `FIREBASE_ADMIN_*` values, keeping the `\n` escapes literal
   as described above.
5. Leave `BALLOADS_*` and `BRUTUS_AI_*` blank until you have real sandbox credentials, or use
   placeholder values if you're only working on code paths that don't call those APIs yet — Zod
   will throw a clear validation error at startup if a required server var is missing when
   `getServerEnv()` is actually called.
6. Leave `VERCEL_URL` / `VERCEL_ENV` blank locally — Vercel sets these automatically in deployed
   environments.
7. Run `npm run dev` and confirm the app boots without a `config/env.ts` Zod validation error.

**`.env.local` is gitignored and must never be committed.** `.env.example` is the one exception:
the repo's `.gitignore` ignores `.env*` broadly but carves out `!.env.example` so the template
(with empty values) stays tracked while every file containing real values — `.env.local`,
`.env.development.local`, etc. — stays out of git. If you ever add a new variable, add the _key_
to `.env.example` with an empty value, never a real secret.
