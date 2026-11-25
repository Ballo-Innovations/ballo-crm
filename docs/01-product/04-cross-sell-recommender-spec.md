# Cross-sell / Upsell Recommender & Insights Spec

## Product catalogue (seed)

| Code   | Product                        | Category     | List price (ZMW / yr) |
| ------ | ------------------------------ | ------------ | --------------------- |
| FIB    | Dedicated Fibre Internet       | Connectivity | 180,000               |
| MPLS   | MPLS / SD-WAN                  | Connectivity | 240,000               |
| COLO   | Colocation (rack)              | Data Centre  | 150,000               |
| CLOUD  | Cloud Compute (IaaS)           | Cloud        | 120,000               |
| DRAAS  | Disaster Recovery as a Service | Cloud        | 200,000               |
| BACKUP | Backup as a Service            | Cloud        | 60,000                |
| MSEC   | Managed Security / SOC         | Security     | 160,000               |
| VOICE  | SIP Trunking / Voice           | Connectivity | 48,000                |

## Rule-based engine (deterministic, explainable)

Each rule: `IF conditions THEN recommend product WITH base probability AND reason`.

| #   | Condition                                                    | Recommend    | Base p |
| --- | ------------------------------------------------------------ | ------------ | ------ |
| 1   | Has COLO, not DRAAS                                          | DRAAS        | 0.55   |
| 2   | Has CLOUD, not BACKUP                                        | BACKUP       | 0.60   |
| 3   | Has FIB, sector ∈ {Banking, Government}, not MSEC            | MSEC         | 0.50   |
| 4   | Has FIB, ≥3 sites, not MPLS                                  | MPLS         | 0.45   |
| 5   | Has any Connectivity, not VOICE                              | VOICE        | 0.35   |
| 6   | Sector peers' adoption of product > 60% and account lacks it | that product | 0.40   |

**Modifiers (additive):** attended DC tour in 180d +0.15 · demo of that product +0.20 · champion exists +0.05 · at-risk account –0.20 · open escalation –0.10 · contract renewal within 90d +0.10. Clamp 0.05–0.95.

Output per account: top 3 recommendations `{product, probability, estimatedValue, reasons[]}`.

## LLM layer (narrative only)

Model: Claude via API. Input: account summary + rule outputs. Output: 1–2 sentence rep-facing narrative + suggested opening line. **Cached in DB at generation time**; regenerate on demand. Fallback template if API unavailable: "Recommend {product} ({p}%): {reasons joined}."

## Opportunity ranking ("Focus List")

Rank open opportunities by `priority = weightedValue × urgency` where urgency = 1.5 if close date < 30d, 1.2 if stale > 14d (needs rescue), else 1.0. Show top 5 per rep, top 10 for managers, each with LLM one-liner.

## Automated insights feed

Generated nightly (and on seed) by rules:

- "Mining sector pipeline up 32% QoQ - 3 Gold+ deals in Negotiate."
- "4 Platinum deals have no activity in 10+ days."
- "Zanaco contract renews in 42 days; DRAAS recommendation 74%."
- "DC tour attendees convert 2.1× more often this quarter."
  Each insight has type, severity, link target, and dismiss.
