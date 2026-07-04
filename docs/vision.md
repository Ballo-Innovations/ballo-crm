# Vision

## Problem

B2B commercial operations at scale run on fragmented, disconnected tools. A typical enterprise
sales org tracks customer information in one spreadsheet, account ownership in another, pipeline
stage in a CRM nobody trusts, contract terms in a shared drive, and outbound messaging in a
completely separate platform with no feedback loop back into "who is this account, and are they
healthy?" The result:

- **No single source of truth.** Sales reps, account managers, and leadership each keep their own
  version of "the account list," and none of them agree.
- **No shared account health signal.** Whether a customer is trending toward churn (missed
  payments, dead campaigns, no recent activity) lives in a messaging platform's internal metrics,
  invisible to the people managing the relationship.
- **Manual, error-prone qualification.** Deals get promoted through a pipeline based on gut feel
  rather than structured qualification (BANT/MEDDIC-style criteria), so forecasting is guesswork.
- **Disconnected communication.** Account teams want to trigger a customer touchpoint (an
  onboarding sequence, a renewal nudge) but have no CRM-native way to do it without leaving their
  workflow and manually operating a separate messaging tool.
- **No commercial intelligence layer.** Cross-sell and upsell opportunities are missed because
  nobody is systematically looking at usage, health, and pipeline data together.

BalloCRM exists to replace this patchwork with one system of record for commercial operations,
purpose-built for B2B account and sales teams, with native integration into BalloAds (the parent
company's messaging platform) instead of a bolted-on afterthought.

## Users

BalloCRM is built for the people who own commercial relationships and the revenue that flows
through them:

- **Sales Representatives** - manage a book of opportunities and need fast, low-friction logging
  of activity and pipeline movement.
- **Enterprise Account Managers** - own the ongoing relationship with existing customers, need
  visibility into account health, contract status, and communication history in one place.
- **Sales Operations / RevOps Analysts** - maintain data quality, own pipeline reporting, and
  configure qualification criteria, territories, and vertical segmentation.
- **Executives / VP of Sales** - need roll-up commercial analytics (pipeline velocity, forecast,
  account health distribution) without waiting on a manually assembled report.
- **Customer Success Leads** - monitor post-sale account health and lifecycle stage to catch churn
  risk and cross-sell timing early.

## Personas

### Amara Osei - Enterprise Account Manager

- **Goals:** Keep a portfolio of ~40 enterprise accounts healthy and growing; know immediately
  when an account's health score drops or a contract is nearing renewal; log every meaningful
  touchpoint without duplicate data entry.
- **Frustrations:** Account health data lives in a messaging platform she doesn't have login
  access to; she finds out about a churn risk from a colleague instead of a dashboard; contract
  renewal dates are tracked in a personal spreadsheet that's always slightly out of date.

### Priya Nandakumar - VP of Sales

- **Goals:** Trust the pipeline number she reports to the board; see forecast, win rate, and
  pipeline velocity by vertical without asking RevOps to build a one-off report; spot underused
  cross-sell opportunity across the account base.
- **Frustrations:** Every forecast is a manually reconciled spreadsheet built the night before a
  board meeting; qualification criteria are applied inconsistently across reps, so "commit" stage
  deals slip constantly.

### Diego Fernandes - RevOps Analyst

- **Goals:** Own clean, consistent data across accounts, contacts, and opportunities; configure
  vertical sales indexing and qualification scoring once and have it apply org-wide; produce
  commercial analytics without exporting to a BI tool by hand.
- **Frustrations:** Every CRM he's used treats operations configuration as an afterthought behind
  a paywall; there's no audit trail when a rep manually overrides a pipeline stage; integrating
  the messaging platform's data required a bespoke ETL job that broke constantly.

### Tafadzwa Chirwa - Customer Success Lead

- **Goals:** Catch at-risk accounts before renewal, using account health signals fed from the
  messaging platform (activity recency, payment reliability) alongside CRM-tracked lifecycle
  stage; trigger a timely re-engagement communication without leaving the CRM.
- **Frustrations:** Health signals and customer journey stage are tracked in two systems that
  don't talk to each other; by the time a churn risk surfaces manually, it's often too late to
  act.

## Value Proposition

Generic CRMs (Salesforce, HubSpot, and their smaller competitors) are built to be all things to
all industries, which means B2B commercial teams spend months configuring them just to get basic
account-health and vertical-segmentation workflows working - and none of them have a native
relationship with BalloAds. BalloCRM differentiates on two fronts:

1. **Native BalloAds integration.** Account health scores, delivery/opt-out status, and
   communication triggers flow directly from BalloAds' developer-portal API into the CRM's
   Account and Contact views - no manual export, no second system to check. When a CRM workflow
   needs to reach a customer, it calls BalloAds directly and logs the result as a CRM Activity,
   instead of asking a rep to switch tools. See [integrations.md](./integrations.md) for the
   contract.
2. **Brutus AI commercial intelligence.** Opportunity qualification scoring, next-best-action
   recommendations, account/contact summarization, and cross-sell/upsell signal detection are
   built into the core workflow as asynchronous AI Jobs, not a bolted-on chatbot. Reps and
   managers get structured recommendations where they already work, not in a separate AI tab
   nobody opens.

Combined with a feature-based, strictly-typed, documentation-driven codebase (see
[architecture.md](./architecture.md) and [coding-standards.md](./coding-standards.md)), BalloCRM
is designed to be extended quickly by both human and AI contributors without accumulating the
technical debt that makes generic CRMs slow to adapt to a B2B commercial team's actual workflow.

## MVP Scope

The Sprint 1 goal is a deployable skeleton that proves the full stack end to end: Firebase Auth
sign-in issuing a session, a rendered dashboard shell with real navigation, and one CRM entity -
Accounts - with working Create/Read against Firestore through the repository → service → action
pattern. It intentionally does not yet include Opportunities, Contracts, Campaigns, ABM, or any
Brutus AI feature; those land in later sprints once the foundation is proven. Full task breakdown
and ownership live in [sprint-1.md](./tasks/sprint-1.md) and the sprint plan overview in
[sprint-plan.md](./sprint-plan.md).

## Long-Term Roadmap

Beyond the MVP, BalloCRM grows in phases: full core CRM (Opportunities, Contracts, Customer
Journey lifecycle tracking), then Brutus AI commercial intelligence (qualification scoring,
next-best-action, summarization), then advanced analytics and ABM/vertical indexing, then
enterprise-hardening (testing, CI, permissions, scale). See [roadmap.md](./roadmap.md) for the
full phase-by-phase breakdown, including known infrastructure gaps (no test framework or CI yet)
that must close early in that sequence.
