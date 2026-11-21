# Judging Strategy — how to score Platinum

Hackathon rubrics almost always weight: problem fit, completeness, innovation, technical quality, UX, presentation, viability. We assume the rubric below and optimise for it explicitly.

| Criterion (assumed weight)      | How we max it                                                                                             | Evidence on stage                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Problem fit (20%)               | Mirror the challenge's own vocabulary (ABM, VSI, CIMS, maturity grading) in nav labels and slide headings | Coverage matrix slide: every bullet → screen                 |
| Completeness (20%)              | Every spec section has a working screen; integrations shown as adapter pattern + mock                     | Live clickthrough of all 9 modules                           |
| Innovation / intelligence (20%) | Grading engine, recommender, VSI, automated insights feed                                                 | "Why this grade?" drawer; recommendation card with reasoning |
| Technical quality (15%)         | Architecture doc, tests, CI badge, OpenAPI docs, audit log, RBAC                                          | Repo tour slide, 60-second code walkthrough                  |
| UX (10%)                        | One design system, fast, no dead ends                                                                     | Judges handed a device to click                              |
| Presentation (10%)              | Story: fragmentation → single view → intelligence → revenue                                               | Rehearsed 3× with timer                                      |
| Viability (5%)                  | Deployment notes, data-protection section, roadmap                                                        | One slide                                                    |

## Tactics

1. **Name modules exactly as the challenge does.** Nav: Pipeline · Accounts · ABM · VSI · Engagement · Contracts · CIMS · Insights · Admin.
2. **Show the inputs behind every number.** Every score, grade and recommendation opens an explanation panel.
3. **Let judges touch it.** Seeded demo URL + credentials on the last slide.
4. **Pre-empt "it's just a CRM".** Open the pitch on the Insights feed, not the pipeline.
5. **Answer the integration question first.** Adapter slide: Email (live inbound webhook), SMS (Africa's Talking, mocked), Telephony (mock), ERP (REST adapter, mocked), eSPF (documented contract, mock server).
6. **Dry-run judging.** 48h before: an outsider scores us on this table. Fix the lowest row.
