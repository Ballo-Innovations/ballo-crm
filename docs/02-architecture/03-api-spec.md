# API Spec (REST, `/api/v1`): OpenAPI generated from zod via `zod-to-openapi`

Auth: session cookie (UI) or `Authorization: Bearer <apiKey>` (integrations). All responses `{ data, meta? }` or `{ error: { code, message } }`. All lists accept `?page&pageSize&q&sort`.

| Method          | Path                                      | Role              | Notes                                                                                 |
| --------------- | ----------------------------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| GET/POST        | /leads                                    | REP+              |                                                                                       |
| POST            | /leads/{id}/convert                       | REP+              | body: `{accountId?                                                                    | newAccount, opportunity}` |
| GET/POST        | /accounts                                 | REP+              |                                                                                       |
| GET/PATCH       | /accounts/{id}                            | REP+              | 360 payload with `?include=contacts,subscriptions,timeline,contracts,recommendations` |
| GET/POST        | /accounts/{id}/contacts                   | REP+              |                                                                                       |
| GET/POST        | /accounts/{id}/events                     | REP+              | engagement events                                                                     |
| GET/PUT         | /accounts/{id}/plan                       | MARKETING,MANAGER | account plan + playbook                                                               |
| GET             | /accounts/{id}/recommendations            | REP+              |                                                                                       |
| POST            | /accounts/{id}/recommendations/regenerate | MANAGER           | runs rules + LLM                                                                      |
| GET/POST        | /opportunities                            | REP+              | filters: stage, grade, ownerId                                                        |
| GET/PATCH       | /opportunities/{id}                       | REP+              |                                                                                       |
| POST            | /opportunities/{id}/stage                 | REP+              | `{stage, lostReason?}`                                                                |
| GET             | /opportunities/{id}/score                 | REP+              | explanation payload                                                                   |
| GET/POST/DELETE | /opportunities/{id}/committee             | REP+              |                                                                                       |
| GET             | /pipeline/kanban                          | REP+              | columns with weighted totals                                                          |
| GET             | /pipeline/focus                           | REP+              | ranked focus list                                                                     |
| GET             | /dashboards/executive                     | MANAGER+          |                                                                                       |
| GET             | /dashboards/sales                         | REP+              |                                                                                       |
| GET             | /vsi                                      | MANAGER+          | sectors ranked                                                                        |
| GET             | /vsi/{sector}                             | MANAGER+          | drilldown                                                                             |
| GET             | /insights                                 | REP+              | `?dismissed=false`                                                                    |
| POST            | /insights/{id}/dismiss                    | REP+              |                                                                                       |
| GET/POST        | /contracts                                | LEGAL,MANAGER     |                                                                                       |
| POST            | /contracts/{id}/generate                  | LEGAL             | renders PDF to MinIO                                                                  |
| POST            | /contracts/{id}/send                      | LEGAL             | creates signer tokens                                                                 |
| GET             | /sign/{token}                             | public            | signing page data                                                                     |
| POST            | /sign/{token}                             | public            | `{signatureDataUrl}`                                                                  |
| GET             | /contracts/renewals                       | LEGAL,MANAGER     | `?withinDays=90`                                                                      |
| GET             | /admin/audit                              | ADMIN             | filters: entity, actor, from, to                                                      |
| GET/POST/DELETE | /admin/users                              | ADMIN             |                                                                                       |
| GET/POST/DELETE | /admin/api-keys                           | ADMIN             |                                                                                       |
| POST            | /admin/data/export/{accountId}            | ADMIN             | data-protection export (JSON)                                                         |
| POST            | /admin/data/erase/{accountId}             | ADMIN             | anonymise contacts                                                                    |
| POST            | /webhooks/email/inbound                   | public (HMAC)     | → EngagementEvent EMAIL_IN                                                            |
| POST            | /integrations/sms/send                    | REP+              | adapter                                                                               |
| POST            | /integrations/telephony/call              | REP+              | adapter, returns call log id                                                          |
| POST            | /integrations/erp/push-order              | MANAGER           | adapter                                                                               |
| POST            | /integrations/espf/sync                   | MANAGER           | adapter                                                                               |
| GET             | /openapi.json                             | public            |                                                                                       |
