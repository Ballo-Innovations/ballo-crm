# Demo Data Seed Spec

Realism sells. All names are fictional-but-plausible; do **not** use real company names with real data claims.

## Users (8)

admin@compass.zm (ADMIN) · chanda@ (MANAGER) · mutale@, bwalya@, nkandu@, lombe@ (REP) · thandiwe@ (MARKETING) · legal@ (LEGAL). Password `Compass!2026` for all (demo only).

## Accounts (60) — by sector

| Sector                                                                                                                                   | Count | Example names (fictional)                                       | Tier 1 |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------- | ------ |
| Banking                                                                                                                                  | 10    | Zambezi Commercial Bank, Copperbelt Savings, Kafue Microfinance | 3      |
| Mining                                                                                                                                   | 9     | Konkola Copper Resources, Lumwana Metals, Kalumbila Holdings    | 3      |
| Telecoms                                                                                                                                 | 6     | ZedMobile, Lusaka Fibre Co, Northern ISP                        | 2      |
| Government                                                                                                                               | 10    | Ministry of Health, ZRA Analytics Unit, Lusaka City Council     | 2      |
| NGO                                                                                                                                      | 7     | Hope Zambia, Water4All, UN Lusaka Office                        | 1      |
| Retail                                                                                                                                   | 7     | Shoprite-style "MegaMart Zambia", PickBuy, Lusaka Agro Supplies | 1      |
| Energy                                                                                                                                   | 6     | ZESCO Distribution Unit, SolarZed, Kariba Power Services        | 2      |
| Education/Health                                                                                                                         | 5     | UNZA ICT, Levy Mwanawasa Hospital, Cavendish College            | 0      |
| Lifecycle mix: 35 ACTIVE, 10 ONBOARDING, 10 PROSPECT, 4 AT_RISK, 1 CHURNED. Cities: Lusaka, Kitwe, Ndola, Solwezi, Livingstone, Chipata. |

## Contacts (180) — 3 per account avg; Zambian names (Mutale, Chanda, Bwalya, Mwila, Nkonde, Chileshe, Zulu, Phiri, Banda, Tembo, Mwanza, Sakala); titles CIO, CFO, Head of IT, Procurement Manager, Operations Director.

## Subscriptions (110) — ensure patterns the rules need: ≥12 accounts COLO-without-DRAAS, ≥10 CLOUD-without-BACKUP, ≥8 Banking/Gov FIB-without-MSEC, ≥6 multi-site FIB-without-MPLS.

## Opportunities (150) — stage mix 40/35/35/25/10 won/5 lost; amounts K40k–K2.4m; close dates spread over next 2 quarters; 15% competitorPresent; 40% budgetConfirmed. Must include:

- "Zambezi Commercial Bank — DRaaS" matching the spec worked example (58/GOLD).
- ≥4 PLATINUM, ≥4 stale Platinum (for insight), ≥10 GOLD.

## Engagement events (600) — over last 12 months; 25 DC tours, 60 demos, 40 events, rest meetings/calls/emails; tour attendees' deals have higher win rate (seed this bias so the chart tells a story).

## Contracts (25) — 15 ACTIVE, 5 SIGNED, 3 SENT, 2 DRAFT; 6 ending within 90 days.

## Pre-generated: recommendations (top 3 per active account), insights (~40), AI narratives cached.

## Seed script requirements

Deterministic (seeded faker), idempotent `--reset`, finishes <60s, prints summary counts.
