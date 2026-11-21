# Security, RBAC, Audit & Data Protection

## Roles & permissions

| Capability                 | ADMIN | MANAGER | REP       | MARKETING | LEGAL | READONLY |
| -------------------------- | ----- | ------- | --------- | --------- | ----- | -------- |
| View all accounts/opps     | ✓     | ✓       | team only | ✓         | ✓     | ✓        |
| Edit accounts/opps         | ✓     | ✓       | own       | –         | –     | –        |
| Log engagement             | ✓     | ✓       | ✓         | ✓         | –     | –        |
| ABM plans/playbooks        | ✓     | ✓       | –         | ✓         | –     | –        |
| Contracts create/send      | ✓     | ✓       | –         | –         | ✓     | –        |
| Dashboards: executive      | ✓     | ✓       | –         | ✓         | –     | ✓        |
| Audit log, users, API keys | ✓     | –       | –         | –         | –     | –        |
| Data export/erase          | ✓     | –       | –         | –         | –     | –        |

Enforced server-side in `requireRole()` and row filters in `queries.ts`. UI hides what the role can't do, but never relies on hiding.

## Audit

- `withAudit()` wraps every mutating server action: actor, entity, id, action, before/after diff.
- Exports and erasures are audited as `EXPORT` / `ERASE`.
- Audit page: filter by entity/actor/date; row expands to JSON diff.

## Data protection (Zambia Data Protection Act 2021 alignment — say "aligned", not "compliant")

- Consent flag on Account/Contact for marketing.
- Export: JSON bundle of an account's personal data.
- Erase: anonymise contact PII (name → "Erased", email/phone null), keep commercial records.
- Retention note in Admin → Data Protection page (policy text, configurable days).
- Passwords: bcrypt. Sessions: httpOnly cookies. API keys: hashed, shown once.
- Signing links: single-use tokens, IP + timestamp recorded.

## Checklist before demo

- [ ] No secrets in repo (`.env.example` only)
- [ ] All routes behind auth except `/sign/*`, `/openapi.json`, webhooks (HMAC)
- [ ] Rate-limit public routes (simple in-memory)
- [ ] CSP headers via `next.config`
