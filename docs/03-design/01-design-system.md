# Design System — Compass

## Principles

Dense but calm. Enterprise users scan tables all day: high information density, clear hierarchy, no decorative gradients. One accent colour, grades get their own colours.

## Tokens (Tailwind config)

| Token                                                                                                             | Value                            | Use                                |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| `--bg`                                                                                                            | #0B1220 (dark) / #F7F8FA (light) | page                               |
| `--surface`                                                                                                       | #121A2B / #FFFFFF                | cards, tables                      |
| `--border`                                                                                                        | #22304A / #E5E8EE                |                                    |
| `--text`                                                                                                          | #E6EAF2 / #0F172A                |                                    |
| `--muted`                                                                                                         | #8B96AD / #64748B                |                                    |
| `--accent`                                                                                                        | #2563EB                          | primary actions, links, active nav |
| `--success`                                                                                                       | #16A34A                          | won, signed                        |
| `--warning`                                                                                                       | #D97706                          | stale, renewal soon                |
| `--danger`                                                                                                        | #DC2626                          | lost, at-risk                      |
| Grade Bronze                                                                                                      | #B45309                          | badge                              |
| Grade Silver                                                                                                      | #64748B                          | badge                              |
| Grade Gold                                                                                                        | #CA8A04                          | badge                              |
| Grade Platinum                                                                                                    | #7C3AED                          | badge                              |
| Ship dark mode first (demo rooms are dim; dark screens photograph better); light mode via `prefers-color-scheme`. |

## Typography

Inter (UI) · JetBrains Mono (IDs, money in tables). Sizes: 12/14/16/20/28. Money right-aligned, tabular-nums.

## Layout

Left sidebar (collapsible, 240px): Dashboard · Pipeline · Accounts · ABM · VSI · Engagement · Contracts · Insights · CIMS/Admin. Top bar: global search (⌘K), quick-add, user menu. Content max-width none (tables want width). Right-side **Drawer** component for detail/explanations — never navigate away for "why?".

## Components (shadcn + custom)

Badge(grade) · ScoreRing(0–100) · FactorList(explanation) · KpiCard · DataTable(sortable, filter, pagination) · KanbanBoard(dnd-kit) · Timeline · CommitteeMap · WhitespaceMatrix · RecommendationCard · InsightRow · ContractStatusStepper · SignaturePad.

## Micro-rules

- Every empty state has a CTA.
- Every number with a computation has an ⓘ → drawer.
- Loading = skeletons, not spinners.
- Toast on every write, with undo where cheap.
