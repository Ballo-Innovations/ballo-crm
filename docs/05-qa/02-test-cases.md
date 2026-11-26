# Test Cases (manual acceptance). ✅ = pass, mark build + date.

## Auth & RBAC

- [ ] TC-01 Login with each of 6 roles; nav shows only permitted modules
- [ ] TC-02 REP cannot open /admin (403) via URL
- [ ] TC-03 REP sees only own/team accounts in list and API
- [ ] TC-04 API key works with Bearer; revoked key returns 401

## Pipeline

- [ ] TC-10 Create lead → convert to new account + opportunity → appears in QUALIFY, Bronze
- [ ] TC-11 Drag card QUALIFY→PROPOSE: stage, probability, weighted column totals update; audit row created
- [ ] TC-12 Mark lost requires reason
- [ ] TC-13 Kanban filters (owner, grade, sector) combine correctly

## Scoring & grading

- [ ] TC-20 Spec worked example seeded as "Zanaco - DRaaS" shows 58 / GOLD
- [ ] TC-21 Add Technical buyer → score rises; drawer factor updates
- [ ] TC-22 Set budgetConfirmed + economic buyer engaged on ≥75 score → PLATINUM
- [ ] TC-23 Opportunity with no activity >30d shows downgraded grade after nightly job (or manual run)
- [ ] TC-24 Score history sparkline shows ≥2 points after changes

## Engagement & ABM

- [ ] TC-30 Log DC tour → account engagementScore +25 (cap 100) → linked opp score rises
- [ ] TC-31 Committee map shows roles and stance colours; blocker visible
- [ ] TC-32 Playbook task toggle persists after reload

## Recommender & insights

- [ ] TC-40 Account with COLO and no DRAAS shows DRAAS recommendation with reasons
- [ ] TC-41 Demo of DRAAS logged → probability +0.20
- [ ] TC-42 Create opportunity from recommendation → prefilled product/amount
- [ ] TC-43 With BRUTUS_API_KEY unset, narratives show template fallback (no error)
- [ ] TC-44 Insights feed has ≥6 types; dismiss hides and persists

## Dashboards & VSI

- [ ] TC-50 Executive KPIs equal sums computed by SQL spot-check (ARR, weighted pipeline)
- [ ] TC-51 VSI rank movement arrows correct vs prior quarter
- [ ] TC-52 Sector drilldown whitespace matrix marks owned ✓ and recommended ★
- [ ] TC-53 Forecast chart commit ≤ best for every month

## Contracts

- [ ] TC-60 New contract from MSA template → merge fields render in preview
- [ ] TC-61 Generate PDF → downloadable from MinIO
- [ ] TC-62 Send → signer link opens unauthenticated; sign → status SIGNED; signed PDF has stamp
- [ ] TC-63 Reused token rejected
- [ ] TC-64 Renewals page lists contracts ending within 90d; matching insight exists

## Settings (CIMS admin)

- [ ] TC-70 Audit log shows CREATE/UPDATE with before/after diff for TC-11
- [ ] TC-71 Export account JSON contains contacts, opps, contracts
- [ ] TC-72 Erase anonymises contacts; audit ERASE row; commercial data intact
- [ ] TC-73 Integrations tab shows ERP push after marking opp WON (mock)
- [ ] TC-74 Inbound email webhook (curl with HMAC) creates EMAIL_IN event on timeline

## Non-functional

- [ ] TC-80 Dashboard, Kanban, Account 360 load <1.5s on full seed
- [ ] TC-81 All pages usable at 390px width
- [ ] TC-82 `docker compose up` from clean clone → seeded app in <5 min
- [ ] TC-83 Full demo script runs with network disabled except app
