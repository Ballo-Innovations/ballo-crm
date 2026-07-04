# config/

Application configuration read at startup: environment variable validation (`env.ts`), site
metadata and navigation (`site.ts`). Config is static/derived-from-env; anything that changes
per-organization at runtime (e.g. an org's BalloAds API key) lives in Firestore, read through
`repositories/`, not here.
