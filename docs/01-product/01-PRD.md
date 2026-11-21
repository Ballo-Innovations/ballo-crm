# Product Requirements Document — Compass

## 1. Personas

| Persona                                 | Goal                                             | Primary screens                    |
| --------------------------------------- | ------------------------------------------------ | ---------------------------------- |
| **Enterprise Account Manager (Mutale)** | Hit quota; know which deals to push today        | Pipeline, Account 360, Insights    |
| **Head of Commercial (Chanda)**         | Forecast accurately; grow strategic accounts     | Executive dashboard, VSI, Forecast |
| **Marketing / ABM lead (Thandiwe)**     | Run account-based campaigns; track tours & demos | ABM, Engagement                    |
| **Legal / Contracts (Bwalya)**          | Generate, sign, store, renew contracts           | Contracts                          |
| **Admin / IT**                          | Control access, audit, integrate                 | CIMS Admin, Integrations           |

Goals, outcomes and metrics: [00-goals-and-success-metrics.md](00-goals-and-success-metrics.md).

## 2. Coverage matrix (Challenge 2 → feature → module → ticket epic)

| Challenge bullet                         | Feature                                                      | Module       | Epic |
| ---------------------------------------- | ------------------------------------------------------------ | ------------ | ---- |
| Lead management                          | Lead list, convert to account+opportunity                    | Pipeline     | E1   |
| Opportunity tracking                     | Opportunity CRUD, stages, activities                         | Pipeline     | E1   |
| Account management                       | Account 360 page                                             | Accounts     | E2   |
| Sales pipeline visualization             | Kanban by stage, weighted totals per column                  | Pipeline     | E1   |
| Forecast dashboards                      | Weighted forecast by month/quarter, commit vs best case      | Dashboards   | E6   |
| Conversion analytics                     | Stage-to-stage conversion funnel, win rate                   | Dashboards   | E6   |
| Enterprise account profiling             | Sector, size, ARR, products, health score                    | Accounts     | E2   |
| Customer lifecycle visibility            | Lifecycle stage (Prospect→Onboarding→Active→At-risk→Churned) | Accounts     | E2   |
| Decision maker tracking                  | Contacts with role, influence, stance                        | Accounts/ABM | E3   |
| Customer engagement history              | Unified timeline (emails, calls, events, notes)              | Accounts     | E2   |
| Strategic account mapping                | Tier 1/2/3 flag, account plan                                | ABM          | E3   |
| Buying committee tracking                | Committee map (Economic buyer, Champion, Technical, Blocker) | ABM          | E3   |
| Personalised account engagement          | Playbook tasks generated per account                         | ABM          | E3   |
| Opportunity scoring                      | Weighted score 0–100                                         | Intelligence | E4   |
| Revenue ranking by sector                | VSI table + chart                                            | VSI          | E6   |
| Top account identification               | Top-N accounts by ARR and growth                             | VSI          | E6   |
| Growth opportunity tracking              | Whitespace matrix (accounts × products)                      | VSI          | E5   |
| Revenue growth monitoring                | QoQ/YoY growth per sector                                    | VSI          | E6   |
| Sector performance analysis              | Sector drilldown                                             | VSI          | E6   |
| Lead vs pipeline separation              | Leads are a separate entity until qualified                  | Pipeline     | E1   |
| Deal qualification stages                | Qualify → Discover → Propose → Negotiate → Closed            | Pipeline     | E1   |
| Weighted pipeline scoring                | Amount × stage probability × score modifier                  | Intelligence | E4   |
| Maturity grading (Bronze…Platinum)       | Grade from score thresholds, explainable                     | Intelligence | E4   |
| Product recommendation engine            | Rules + whitespace → recommendations                         | Intelligence | E5   |
| Customer service usage analysis          | Subscriptions & usage per account                            | Accounts     | E2   |
| AI assisted opportunity ranking          | Ranked "Focus list" with LLM narrative                       | Insights     | E5   |
| Probability scoring for product adoption | % per recommendation                                         | Intelligence | E5   |
| DC tour / demo / event tracking          | Engagement events with type, attendees                       | Engagement   | E3   |
| Experiential engagement analytics        | Engagement → conversion correlation chart                    | Dashboards   | E6   |
| Digital contract generation              | Template → PDF with merge fields                             | Contracts    | E7   |
| Contract repository                      | Searchable list, versions, PDF storage                       | Contracts    | E7   |
| Renewal tracking                         | Renewal date, 90/60/30-day alerts                            | Contracts    | E7   |
| E-signature workflows                    | Draw-to-sign, signer order, status                           | Contracts    | E7   |
| PDF storage integration                  | S3-compatible (MinIO) object store                           | Contracts    | E7   |
| Centralized customer database            | Postgres, single Account aggregate                           | CIMS         | E8   |
| Single customer view                     | Account 360                                                  | Accounts     | E2   |
| API integration support                  | REST + OpenAPI + API keys                                    | CIMS         | E8   |
| Role based access controls               | Roles: Admin, Manager, Rep, Marketing, Legal, ReadOnly       | CIMS         | E8   |
| Audit logging                            | Every mutation logged with actor, before/after               | CIMS         | E8   |
| Data protection compliance               | Consent flag, data retention policy, export/delete           | CIMS         | E8   |
| Email integration                        | Inbound webhook → timeline; outbound via SMTP                | Integrations | E9   |
| SMS                                      | Adapter (Africa's Talking) — mock                            | Integrations | E9   |
| Telephone systems                        | Click-to-call adapter + call log — mock                      | Integrations | E9   |
| ERP systems                              | Adapter: push won deal → ERP order (mock)                    | Integrations | E9   |
| eSPF integration                         | Adapter contract + mock server                               | Integrations | E9   |
| API readiness                            | OpenAPI, webhooks out                                        | CIMS         | E8   |

## 3. User stories (priority P0 = must demo)

**P0**

- As a rep, I can see my pipeline as a Kanban with weighted value per column so I know where revenue sits.
- As a rep, I open an opportunity and see its score, grade, and _why_ (factor breakdown).
- As a rep, I see a ranked Focus List of the 5 opportunities to work today, with a one-line reason.
- As a head of commercial, I see the executive dashboard: forecast, VSI, top accounts, insights feed.
- As a marketer, I log a DC tour and see it raise the account's engagement score.
- As legal, I generate a contract PDF from a template, send for signature, and see it signed.
- As admin, I see the audit log of all changes and can assign roles.
- As anyone, I open an Account 360 and see profile, contacts/buying committee, subscriptions, timeline, contracts, recommendations.

**P1**

- Whitespace matrix; renewal alerts; conversion funnel; playbook tasks; API key management; data export/delete.

**P2**

- Outbound SMS mock; click-to-call mock; ERP push mock; eSPF mock.

## 4. Non-functional

- Page load < 1.5s on seeded data (~200 accounts, ~600 opportunities).
- Mobile-responsive (judges may open on phones).
- All writes audited. All lists paginated/searchable.
- Works fully offline from docker-compose (LLM outputs cached).

## 5. Out of scope (say it on the slide)

Multi-tenancy, native apps, marketing automation, billing.
