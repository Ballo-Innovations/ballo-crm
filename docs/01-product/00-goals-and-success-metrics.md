# Goals and success metrics

This is the page to come back to when you are unsure whether a piece of work matters. It states
the problem we were given, the outcomes the solution must produce, and how we check each one.
Every ticket in `docs/04-delivery/03-tickets.csv` names the goal it serves in its `Goal` column.

If a change does not move one of the seven goals below, or enable one that does, do not build it.

**Submission deadline: 29 November 2026.** Day-by-day plan: `docs/04-delivery/02-sprint-plan.md`.

## The problem (iHub Hackathon 2026, Challenge 2)

**Commercial Operations Automation & B2B CRM Intelligence Platform.**

The company needs one integrated, B2B-focused commercial operations system that manages customer
relationships, sales pipelines, account-based marketing, contract visibility, customer
intelligence and commercial performance analytics. Today that work is fragmented across
spreadsheets, emails, standalone systems and manual reports.

Without centralised commercial intelligence, five things suffer:

- Pipeline visibility
- Forecasting accuracy
- Cross-selling effectiveness
- Strategic account growth
- Customer journey tracking

Enterprise sales needs customer intelligence, sales visibility, forecasting and strategic account
management to raise conversion rates, customer retention and revenue.

## The solution

One system that holds every account, contact, deal, engagement and contract, with an intelligence
layer on top that tells a rep which opportunities to work, what to sell next, and why. Every
score, grade and recommendation shows the inputs behind it.

## The seven goals

These are the challenge's "Desired Impact" lines, word for word. Each has:

- **The product reports:** the numbers the app shows so the company can track the outcome.
- **Proven when:** checks we can run on the seeded app. `TC-nn` refers to
  `docs/05-qa/02-test-cases.md`.

We have no real customer data, so we do not claim real-world uplift (for example "win rate up
10%"). We prove that the product measures the outcome correctly and makes it visible.

### G1. Improve enterprise sales visibility

A manager or rep can see how much pipeline exists, where it sits and who owns it, without asking
anyone or opening a spreadsheet.

- **The product reports:** open pipeline (count, value, weighted value) by stage; win rate;
  stage-to-stage conversion; stale deals (no activity for more than 14 days); a ranked Focus
  List per rep.
- **Proven when:**
  - Leads stay separate from pipeline until converted (TC-10).
  - Dragging a card updates the stage, probability and column totals (TC-11); filters combine
    (TC-13).
  - Stage totals on the kanban equal the stage totals on the sales dashboard.
  - Executive KPIs equal a SQL spot-check on the seed (TC-50).
  - From `/dashboard`, any open deal is reachable in two clicks or fewer.
- **Tickets:** E1-01 to E1-05, E4-04, E4-06, E5-04, E6-05.

### G2. Improve strategic account management

Tier 1 and Tier 2 accounts have a known buying committee, a plan, and a record of how we have
engaged them.

- **The product reports:** committee coverage per opportunity (0 to 1, weights in the scoring
  spec); stance of each decision maker; engagement score per account (0 to 100); open playbook
  tasks per account.
- **Proven when:**
  - The committee map shows roles and stance, and a blocker is visible (TC-31).
  - Adding a technical buyer raises the score and updates the factor (TC-21).
  - Logging a data-centre tour adds 25 to the account's engagement score, capped at 100 (TC-30).
  - Playbook tasks persist (TC-32) and are generated from the gaps in a deal's grade.
  - `/abm` lists only Tier 1 and Tier 2 accounts.
- **Tickets:** E2-03, E3-01 to E3-05.

### G3. Strengthen pipeline forecasting

The forecast is built from scored, graded deals, and anyone can see why a deal counts.

- **The product reports:** opportunity score (0 to 100), maturity grade (Bronze, Silver, Gold,
  Platinum) and weighted value for every open deal; forecast per month as commit, best case and
  closed (definitions in `03-vsi-and-dashboards-spec.md`); score history per deal.
- **Proven when:**
  - The spec's worked example returns 58 / GOLD in a unit test and on the seeded deal (TC-20).
  - Platinum needs score of 75 or more, economic buyer engaged and budget confirmed (TC-22).
  - A deal with no activity for more than 30 days drops one grade, once (TC-23).
  - Commit is never above best case in any month (TC-53).
  - Every factor behind a score is listed with its direction in the explanation drawer.
- **Tickets:** E4-01, E4-02, E4-03, E4-05, E6-01.

### G4. Improve cross-selling opportunities

For every account, the product says which product to offer next, how likely adoption is, and why.

- **The product reports:** recommendations per account with adoption probability (0.05 to 0.95)
  and reasons; services and usage per account; whitespace value per sector (recommended products
  × list price).
- **Proven when:**
  - An account with colocation and no DRaaS gets a DRaaS recommendation with reasons (TC-40).
  - Logging a DRaaS demo raises that probability by 0.20 (TC-41).
  - A recommendation becomes a prefilled opportunity in one click (TC-42).
  - Narratives work with no LLM key, using the template fallback (TC-43).
  - All six rules and every modifier in the recommender spec have unit tests.
- **Tickets:** E2-04, E5-01, E5-02, E5-03, E10-02.

### G5. Enhance customer intelligence

The product notices things a person would miss and says them in plain language.

- **The product reports:** an insights feed with at least six insight types; account health
  score and lifecycle stage; engagement by type per month; win rate for deals with a data-centre
  tour against deals without.
- **Proven when:**
  - The seeded feed shows at least six insight types, and dismissing one persists (TC-44).
  - Score history shows at least two points after changes (TC-24).
  - Health matches the formula in the scoring spec.
  - The tour-versus-no-tour chart matches a SQL spot-check on the seed.
- **Tickets:** E2-06, E3-06, E5-06, E6-04.

### G6. Reduce fragmented customer data

One customer record, one place for contracts, one log of every change, and one integration layer
to the systems around it.

- **The product reports:** Account 360 (profile, contacts and committee, services, timeline,
  contracts, recommendations); a contract repository with status; an audit log of every write; an
  integration log of every call to email, SMS, telephony, ERP and eSPF.
- **Proven when:**
  - Each of the six roles sees only what it is allowed to (TC-01 to TC-03); API keys work and
    revoked keys fail (TC-04).
  - A contract goes from template to signed PDF in storage (TC-60 to TC-63).
  - Every mutation writes an audit row with a before/after diff (TC-70).
  - Export and erase work and are audited (TC-71, TC-72).
  - An inbound email lands on the account timeline (TC-74); a won deal is pushed to the ERP
    adapter (TC-73); every adapter has a working test button.
  - `/openapi.json` is generated from the same zod schemas the app validates with.
- **Tickets:** E0-04 to E0-06, E1-06, E2-01, E2-02, E2-05, E7-01 to E7-05, E7-07, all of E8, all
  of E9.

### G7. Support revenue growth strategies

Leadership can see which sectors and accounts earn the most, which are growing, and where the
unsold revenue is.

- **The product reports:** the Vertical Sales Index (sector ARR, growth quarter on quarter and
  year on year, weighted pipeline, rank and rank movement, penetration); top accounts by ARR;
  whitespace matrix per sector; contracts due for renewal in 90, 60 and 30 days.
- **Proven when:**
  - Rank movement against the prior quarter is correct (TC-51).
  - The sector drilldown marks owned and recommended products with probability (TC-52).
  - The renewals page lists contracts ending within 90 days, each with a matching insight
    (TC-64).
  - VSI growth, rank movement and penetration have unit tests.
- **Tickets:** E5-05, E6-02, E6-03, E7-06.

### Enablers

E0 (foundations, except E0-04 to E0-06), E10 (data and QA, except E10-02) and E11 (pitch) serve
no single goal.
They exist so the seven goals can be built, proven and shown. They are marked `Enabler`.

## Project scorecard

The whole team is measured on these. Check them at the mid-point review and again 48 hours before
submission.

| #   | Metric                                                      | Target                                   | Where it is checked                   |
| --- | ----------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| 1   | Challenge capabilities with a working screen                | 48 of 48 (table below)                   | Coverage slide; E11-01                |
| 2   | Goals with every "proven when" check passing                | 7 of 7                                   | This page; E10-05                     |
| 3   | P0 test cases passing on stage                              | 100%                                     | `docs/05-qa/02-test-cases.md`; E10-05 |
| 4   | Unit tests passing in CI                                    | 40 or more, including the 58 / GOLD case | E10-03                                |
| 5   | Page load on the full seed (dashboard, kanban, Account 360) | Under 1.5 s on the stage URL             | TC-80; E10-06                         |
| 6   | Pages usable at 390 px                                      | All                                      | TC-81; E10-07                         |
| 7   | Demo runs end to end with no manual database edit           | Under 8 minutes                          | E11-02                                |
| 8   | Demo runs with the network off                              | Yes                                      | TC-83; E11-05                         |
| 9   | Clean clone to seeded app                                   | Under 5 minutes                          | TC-82; E11-05                         |
| 10  | Dry-run judging score                                       | 90% or more, 48 hours before submission  | E11-03                                |

## Capability coverage

All 48 capabilities the challenge lists, and the tickets that deliver each. "Floor" is the lowest
priority among the tickets that make the capability visible at all; a `P1` or `P2` floor means the
capability disappears if those tickets are cut, so see "Do not cut without a fallback" below.

| Area                  | Capability                               | Tickets                 | Goal | Floor |
| --------------------- | ---------------------------------------- | ----------------------- | ---- | ----- |
| CRM & pipeline        | Lead management                          | E1-01, E1-02            | G1   | P0    |
|                       | Opportunity tracking                     | E1-03, E1-05            | G1   | P0    |
|                       | Account management                       | E2-01, E2-02            | G6   | P0    |
|                       | Sales pipeline visualization             | E1-04                   | G1   | P0    |
|                       | Forecast dashboards                      | E6-01                   | G3   | P0    |
|                       | Conversion analytics                     | E6-01 (win rate), E6-05 | G1   | P0    |
| B2B journey           | Enterprise account profiling             | E2-02                   | G6   | P0    |
|                       | Customer lifecycle visibility            | E2-01, E2-02, E2-06     | G5   | P0    |
|                       | Decision maker tracking                  | E2-03, E3-02            | G2   | P0    |
|                       | Customer engagement history              | E2-05, E1-06            | G6   | P0    |
| ABM                   | Strategic account mapping                | E3-03                   | G2   | P0    |
|                       | Buying committee tracking                | E3-02                   | G2   | P0    |
|                       | Personalised account engagement          | E3-04, E3-05            | G2   | P1    |
|                       | Opportunity scoring                      | E4-01, E4-02, E4-03     | G3   | P0    |
| VSI                   | Revenue ranking by sector                | E6-02                   | G7   | P0    |
|                       | Top account identification               | E6-04, E6-03            | G7   | P0    |
|                       | Growth opportunity tracking              | E5-05, E6-03            | G7   | P0    |
|                       | Revenue growth monitoring                | E6-02                   | G7   | P0    |
|                       | Sector performance analysis              | E6-03                   | G7   | P0    |
| Qualification         | Lead vs pipeline separation              | E1-01, E1-02            | G1   | P0    |
|                       | Deal qualification stages                | E1-03, E1-04            | G1   | P0    |
|                       | Weighted pipeline scoring                | E4-01, E1-04            | G3   | P0    |
|                       | Maturity grading (Bronze to Platinum)    | E4-01, E4-04, E4-05     | G3   | P0    |
| Cross-sell and upsell | Product recommendation engine            | E5-01, E5-03            | G4   | P0    |
|                       | Customer service usage analysis          | E2-04                   | G4   | P0    |
|                       | AI-assisted opportunity ranking          | E4-06, E5-04            | G1   | P0    |
|                       | Probability scoring for product adoption | E5-01                   | G4   | P0    |
| Experience            | Data Centre Tour attendance tracking     | E3-01                   | G2   | P0    |
|                       | Solution demo participation tracking     | E3-01                   | G2   | P0    |
|                       | Event participation history              | E3-01, E2-05            | G2   | P0    |
|                       | Experiential engagement analytics        | E3-06, E6-04            | G5   | P1    |
| Contracts             | Digital contract generation              | E7-01, E7-02, E7-07     | G6   | P0    |
|                       | Contract repository                      | E7-03                   | G6   | P0    |
|                       | Renewal tracking                         | E7-06                   | G7   | P0    |
|                       | E-signature workflows                    | E7-04, E7-05            | G6   | P0    |
|                       | PDF storage integration                  | E7-03                   | G6   | P0    |
| CIMS                  | Centralized customer database            | E0-03, E2-01            | G6   | P0    |
|                       | Single customer view                     | E2-02 to E2-05          | G6   | P0    |
|                       | API integration support                  | E8-03, E8-04            | G6   | P0    |
|                       | Role based access controls               | E0-05, E8-01            | G6   | P0    |
|                       | Audit logging                            | E0-06, E8-02            | G6   | P0    |
|                       | Data protection compliance               | E8-05                   | G6   | P1    |
| Integrations          | Email                                    | E9-03, E7-04            | G6   | P0    |
|                       | SMS                                      | E9-02, E9-04, E9-06     | G6   | P0    |
|                       | Telephone systems                        | E9-02, E9-04, E9-06     | G6   | P0    |
|                       | ERP systems                              | E9-02, E9-04, E9-05     | G6   | P0    |
|                       | eSPF integration (internal system)       | E9-02, E9-04, E9-07     | G6   | P0    |
|                       | API readiness                            | E8-03, E8-04            | G6   | P0    |

SMS, telephony, ERP and eSPF are mock adapters behind real interfaces. We say so on stage.

## Do not cut without a fallback

Three capabilities rest only on `P1` tickets. If the mid-point review cuts those tickets, the
fallback below must ship instead, or the coverage score drops below 48.

| Capability                        | P1 tickets   | Fallback if cut                                                             |
| --------------------------------- | ------------ | --------------------------------------------------------------------------- |
| Personalised account engagement   | E3-04, E3-05 | Read-only seeded account plan and playbook on the ABM row (cut-list item 3) |
| Experiential engagement analytics | E3-06, E6-04 | Keep the tour-versus-no-tour chart from E6-04; drop the rest                |
| Data protection compliance        | E8-05        | Consent flag shown on the account, plus the policy page; drop export/erase  |

Three more depend on a `P1` ticket for their best version:

- **Top account identification:** the top 10 accounts widget is in E6-04 (`P1`); the sector
  drilldown (E6-03, `P0`) only lists accounts per sector. If E6-04 is cut, keep the widget and
  drop its chart, or sort the accounts list by ARR by default.
- **Conversion analytics:** win rate is in E6-01 (`P0`). The funnel is in E6-05 (`P1`). If the
  sales dashboard is cut, the funnel moves to the executive dashboard.
- **Growth opportunity tracking:** the sector drilldown (E6-03, `P0`) uses the whitespace matrix
  from E5-05 (`P1`). If E5-05 is cut, the drilldown shows a table of recommendations instead.

## Known gap

**Forecast accuracy.** The challenge names forecasting accuracy as a pain point. We show a
forecast (commit, best case, closed) but do not yet measure how accurate past forecasts were,
because nothing stores what the forecast said at the time. No ticket covers this. Until the team
decides otherwise, it goes on the roadmap slide and is not built.

## Using this page

- **Starting a ticket:** read the goal in the ticket's `Goal` column, then that goal's "proven
  when" list here. The ticket's acceptance criteria are the minimum; the goal is the point.
- **Reviewing a PR:** ask which "proven when" check the change makes pass, or keeps passing.
- **Something new comes up:** if it serves no goal, it waits until after the hackathon.
- **Changing a goal, target or metric:** by PR to this page, agreed by all three developers.
