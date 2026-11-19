# Vertical Sales Index (VSI) & Dashboards Spec

## Sectors (seed)

Banking & Finance · Mining · Telecoms & ISPs · Government & Parastatal · NGO & Development · Retail & FMCG · Energy & Utilities · Education & Health

## VSI definitions

| Metric           | Formula                                                  |
| ---------------- | -------------------------------------------------------- |
| Sector ARR       | Σ active subscription annual value, by account sector    |
| Sector pipeline  | Σ weighted value of open opportunities                   |
| Growth QoQ / YoY | (ARR now – ARR prior period) / ARR prior                 |
| VSI rank         | Sort by ARR; show movement vs last quarter (↑↓)          |
| Penetration      | Accounts with ≥1 subscription / total accounts in sector |
| Whitespace value | Σ recommended products × list price (unsold)             |

## Executive dashboard (route `/dashboard`)

1. KPI strip: Total ARR · Weighted pipeline · Forecast this quarter (Commit/Best) · Win rate · Avg deal cycle
2. Forecast chart: monthly bars, commit vs best case vs closed
3. VSI table: sector, ARR, growth, pipeline, rank movement, penetration → click = sector drilldown
4. Top 10 accounts by ARR, with grade badge of their biggest open deal
5. Insights feed (auto-generated, see recommender spec)
6. Engagement → conversion mini-chart: win rate for deals with DC tour vs without

## Sales dashboard (`/dashboard/sales`)

Pipeline by stage (count, value, weighted), conversion funnel, stale deals (>14d), grade distribution, rep leaderboard.

## Sector drilldown (`/vsi/[sector]`)

Accounts in sector, ARR trend, product mix, top opportunities, whitespace matrix for the sector.

## Charting

Recharts; single colour palette from design system; every chart has a title, unit, and a "what this means" tooltip.
