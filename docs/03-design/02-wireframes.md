# Wireframes (text) — build these, nothing else

## /dashboard (Executive)

```
+-----------------------------------------------------------------------------+
| KPI: Total ARR  | Weighted Pipe | Forecast Q (Commit/Best) | Win rate | Cycle |
+-----------------------------------------------------------------------------+
| Forecast (bar: commit/best/closed by month)   | Insights feed (scroll)      |
|                                               |  ⚠ 4 Platinum deals stale   |
|                                               |  ↑ Mining pipeline +32%     |
+-----------------------------------------------+-----------------------------+
| VSI table: Sector | ARR | Growth | Pipeline | Rank ↑↓ | Penetration  (click)|
+-----------------------------------------------------------------------------+
| Top 10 accounts (ARR, biggest open deal grade) | DC tour vs no-tour win rate|
+-----------------------------------------------------------------------------+
```

## /pipeline (Kanban)

```
[Filters: owner, grade, sector]  [Focus List ▸]            [+ Opportunity]
QUALIFY (12 · K1.2m · w K120k) | DISCOVER | PROPOSE | NEGOTIATE | WON | LOST
+----------------------------+
| Zanaco — DRaaS   [GOLD] 62 |
| K 350,000 · close 12 Dec   |
| ●●●○ committee · 3d ago    |
+----------------------------+
Card click → Drawer: summary, ScoreRing, FactorList, next best actions, committee, timeline, [Change stage]
```

## /pipeline/focus

Ranked list: rank, opp, account, grade, weighted value, urgency chip, one-line AI reason, [Open].

## /accounts/[id] (Account 360)

```
Header: Name · Sector · Tier · Lifecycle · Owner · Engagement 72 · Health 0.9   [Edit] [Log activity]
Tabs: Overview | Contacts & Committee | Services | Opportunities | Timeline | Contracts | Recommendations | Plan
Overview: profile card · ARR · open pipeline · top 3 recommendations (cards with % and reasons) · recent timeline · renewal alerts
```

## /abm

Strategic accounts table (Tier 1/2) → account → Buying Committee map (roles as columns, contacts as chips with stance colour) + Account Plan editor + Playbook checklist.

## /vsi and /vsi/[sector]

Ranked sector table + bar chart; drilldown: ARR trend line, product mix donut, top opps, Whitespace matrix (accounts × products: ✓ owned / ★ recommended % / –).

## /engagement

Event log table + [Log DC tour / Demo / Event] form (type, account, contacts, product, date, notes) + chart: events per month by type.

## /contracts

Table (title, account, status stepper, value, end date, renewal chip) · [New from template] → merge form → preview PDF → [Send for signature] · /contracts/renewals list.

## /sign/[token] (public)

Contract PDF preview + SignaturePad + [Sign]. Success state.

## /insights

Full feed with filters by severity/type; dismiss.

## /admin

Tabs: Users & Roles · Audit log · API keys · Integrations (live log) · Data protection (export/erase, policy).
