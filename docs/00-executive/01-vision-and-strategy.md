# Vision & Strategy (CEO)

## One sentence

A single commercial operating system for Infratel's enterprise sales team: every account, deal, contract and engagement in one place, with an intelligence layer that tells reps _which_ opportunities to work, _what_ to sell them next, and _why_.

## Product name (working)

**Compass** — Commercial Operations, Management, Pipeline, Analytics & Sales Signals. Pick a name on day 0 and never change it.

## Why we win

Most teams will build a generic CRM. The challenge is explicit that Infratel's pain is _fragmentation_ and _missing intelligence_. We differentiate on three things judges can see in 60 seconds:

1. **Opportunity Maturity Grading (Bronze→Platinum)** computed live from real signals, with the inputs shown.
2. **Vertical Sales Index** — revenue ranked by sector with growth trend, on the executive dashboard.
3. **Explainable cross-sell recommendations** — "Zanaco uses Fibre + Colocation, attended a DC tour, hasn't bought DRaaS → 74% adoption probability."

## Strategic bets

| Bet                                 | Rationale                                                                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build, don't integrate              | AI-assisted coding makes a focused CRM cheaper than wiring four AGPL apps together. One codebase we own and can explain.                              |
| Rules + LLM, not ML                 | No training data exists. Transparent rules earn trust; an LLM narrates. Judges reward explainability.                                                 |
| Infratel-realistic demo data        | Zambian sectors (banking, mining, telco, government, NGO), kwacha, a realistic product catalogue (fibre, colocation, cloud, DRaaS, managed security). |
| Mock internal integrations honestly | eSPF/ERP/telephony as documented adapters with a mock backend. Say so on stage.                                                                       |

## Scope guardrails

**In:** everything in the coverage matrix (`01-product/01-PRD.md`).
**Out:** multi-tenancy, native mobile app, real email sync (webhook stub only), invoicing/payments, i18n.

## Success criteria

- Our own dry-run judging panel scores ≥ 90% on `02-judging-strategy-platinum.md` 48h before submission.
- Full demo script runs in < 8 minutes with zero manual DB edits.
- Every challenge bullet maps to a visible screen or a documented adapter.
