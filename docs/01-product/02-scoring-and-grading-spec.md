# Opportunity Scoring & Maturity Grading Spec

## Purpose

Turn raw CRM data into an explainable 0–100 **Opportunity Score**, a **Weighted Value**, and a **Maturity Grade** (Bronze / Silver / Gold / Platinum). Every number must be reproducible from the factors below and shown in the UI.

## Inputs

| Factor                           | Source                                    | Range                                                                                       |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Stage probability `p_stage`      | Stage table                               | Qualify 10% · Discover 25% · Propose 50% · Negotiate 75% · Closed Won 100% · Closed Lost 0% |
| Buying committee coverage `c_bc` | Contacts linked to opportunity with roles | 0–1 (Economic buyer 0.4, Champion 0.3, Technical 0.2, Procurement 0.1)                      |
| Engagement score `e`             | EngagementEvents in last 90 days          | DC tour 25, Demo 20, Event 10, Meeting 8, Email replied 3; capped at 100                    |
| Recency `r`                      | Days since last activity                  | 0–7d: 1.0 · 8–14: 0.8 · 15–30: 0.5 · >30: 0.2                                               |
| Deal size fit `s`                | Amount vs sector median                   | 0.5×–2× median → 1.0; outside → 0.7                                                         |
| Account health `h`               | Account lifecycle + open tickets          | Active 1.0 · Onboarding 0.9 · Prospect 0.8 · At-risk 0.5                                    |
| Competitor present `k`           | Flag on opportunity                       | 1.0 none · 0.85 present                                                                     |
| Budget confirmed `b`             | Flag                                      | 1.0 yes · 0.7 no                                                                            |

## Score formula

```
base = 100 * p_stage
score = base
      * (0.6 + 0.4 * c_bc)      // committee coverage lifts up to full
      * (0.7 + 0.3 * e/100)     // engagement
      * r * s * h * k * b
score = clamp(round(score), 0, 100)
weighted_value = amount * p_stage * (0.8 + 0.4 * score/100)
```

Worked example: Negotiate (75) × committee 0.7 → 0.88 × engagement 60 → 0.88 × recency 1.0 × size 1.0 × health 1.0 × no competitor 1.0 × budget 1.0 = **58**.

## Grade thresholds

| Grade                                                 | Score | Additional rule                             |
| ----------------------------------------------------- | ----- | ------------------------------------------- |
| Platinum                                              | ≥ 75  | Economic buyer engaged AND budget confirmed |
| Gold                                                  | 55–74 | Champion identified                         |
| Silver                                                | 35–54 | —                                           |
| Bronze                                                | < 35  | —                                           |
| Grades downgrade one level if no activity in 30 days. |

## Explanation payload (API)

```json
{
  "score": 58,
  "grade": "GOLD",
  "weightedValue": 412500,
  "factors": [
    { "key": "stage", "label": "Stage: Negotiate", "value": 0.75, "impact": "+" },
    {
      "key": "committee",
      "label": "Committee coverage 70% (no Technical buyer)",
      "value": 0.88,
      "impact": "-"
    },
    {
      "key": "engagement",
      "label": "Engagement 60/100 (DC tour, 2 demos)",
      "value": 0.88,
      "impact": "+"
    },
    { "key": "recency", "label": "Last activity 3 days ago", "value": 1.0, "impact": "+" }
  ],
  "nextBestActions": ["Add a technical stakeholder", "Confirm budget owner"]
}
```

## Recompute triggers

On any change to opportunity, its contacts, or an engagement event on its account. Nightly full recompute job. Store `scoreHistory` for trend sparkline.

## Account-level roll-ups

- **Account engagement score** = capped sum of its events (same weights).
- **Account health** = lifecycle × (1 – open escalations × 0.1).
