# Routes

This document is the canonical map of every route in the BalloCRM App Router tree - what exists
today, what's planned, who can see it, and what it's built from. It must stay in sync with
`config/site.ts` (`primaryNav`) and `middleware.ts`. If you add, rename, or remove a route, update
this file in the same change.

See also: [architecture.md](./architecture.md) for the Server Component / Server Action layering,
[firestore-rules.md](./firestore-rules.md) for the role model referenced in the Permissions
column, [api.md](./api.md) for Server Action naming/return conventions, and
[ui-design-system.md](./ui-design-system.md) for the components named below.

## Route gate: `middleware.ts`

Every path except the public set (`/`, `/login`, and Next internals/static assets) is gated by
`middleware.ts`: it checks for a `__session` cookie and redirects to `/login` if it's absent. This
is a presence check only - Edge middleware cannot run the Firebase Admin SDK, so it **cannot**
verify the session cookie's signature or expiry. Real verification (decode + check `orgId`/`role`
claims via the Admin SDK) must happen inside the Server Component or Server Action behind the
gate, on every request that touches Firestore. Treat the middleware gate as a UX redirect, not a
security boundary - authorization is enforced twice: once loosely at the edge, once for real at
the data layer (Server Component/Action + Firestore Rules).

Role names (`owner`, `admin`, `manager`, `rep`, `viewer`) come from `firestore.rules` /
[firestore-rules.md](./firestore-rules.md). "Permissions" below lists who can **view** the route;
mutation permissions are usually a subset and are called out per-route.

## Route table

| Path                  | Purpose                                                       | Permissions                        | Status                    |
| --------------------- | ------------------------------------------------------------- | ---------------------------------- | ------------------------- |
| `/`                   | Marketing/foundation landing page                             | Public                             | **Live**                  |
| `/login`              | Firebase Auth sign-in, issues `__session` cookie              | Public                             | Planned - Sprint 1, Dev 1 |
| `/dashboard`          | Org-wide KPI + pipeline overview (home after login)           | owner, admin, manager, rep, viewer | Planned - Sprint 1, Dev 2 |
| `/accounts`           | Account list (table)                                          | owner, admin, manager, rep, viewer | Planned - Sprint 1, Dev 3 |
| `/accounts/[id]`      | Account detail (health, timeline, contacts, opps)             | owner, admin, manager, rep, viewer | Planned - Sprint 1, Dev 3 |
| `/contacts`           | Contact list (table)                                          | owner, admin, manager, rep, viewer | Planned - Sprint 2        |
| `/contacts/[id]`      | Contact detail (profile, activities, opt-out status)          | owner, admin, manager, rep, viewer | Planned - Sprint 2        |
| `/opportunities`      | Pipeline view (kanban by stage)                               | owner, admin, manager, rep, viewer | Planned - Sprint 2        |
| `/opportunities/[id]` | Opportunity detail (qualification score, stage history)       | owner, admin, manager, rep, viewer | Planned - Sprint 2        |
| `/contracts`          | Contract list (table)                                         | owner, admin, manager, rep, viewer | Planned - Sprint 2/3      |
| `/contracts/[id]`     | Contract detail (terms, renewal, linked account)              | owner, admin, manager, rep, viewer | Planned - Sprint 2/3      |
| `/campaigns`          | ABM campaign list + BalloAds trigger status                   | owner, admin, manager, rep, viewer | Planned - Sprint 3        |
| `/analytics`          | Commercial analytics (pipeline velocity, forecasting, NL Q&A) | owner, admin, manager, viewer      | Planned - Sprint 3        |
| `/settings`           | Org settings, roles, BalloAds/Brutus integration keys         | owner, admin (view: manager)       | Planned - Sprint 1/3      |

Every planned row below `/login` is behind the `middleware.ts` gate described above. `/` and
`/login` are the only public paths.

---

## `/` - Foundation landing page

- **Status:** Live (`app/page.tsx`).
- **Purpose:** Placeholder marketing/entry page shipped by `create-next-app` scaffolding, pointing
  visitors at `/docs`. Not a real product page yet.
- **Permissions:** Public, no auth required.
- **Key components:** Static JSX in `app/page.tsx`, metadata sourced from `config/site.ts`
  (`siteConfig`). No shadcn components wired in yet beyond what `app/layout.tsx` provides
  (`AppProviders` → theme, toaster).
- **Actions:** None.
- **Expected future enhancements:** Replace with a real marketing/splash page or redirect straight
  to `/login` once auth exists - decide in [decisions.md](./decisions.md) before Sprint 2.

## `/login` - Sign in

- **Status:** Planned, Sprint 1, Developer 1.
- **Purpose:** Firebase Authentication sign-in (email/password and/or SSO, TBD), exchanges the
  Firebase ID token for a `__session` cookie so `middleware.ts`'s presence check passes.
- **Permissions:** Public. Redirects to `/dashboard` if a valid session already exists.
- **Key components:** `card.tsx` (auth card shell), `field.tsx` (`FieldSet`/`FieldGroup`/
  `FieldLabel`/`FieldError`) + `input.tsx` for email/password, `button.tsx` (`default` size,
  loading state), `alert.tsx` for auth errors, `sonner.tsx` toast on success.
- **Actions:** A Server Action (e.g. `actions/auth/create-session.ts` per the thin-action
  convention in [api.md](./api.md)) that verifies the Firebase ID token server-side via the Admin
  SDK and sets the `__session` cookie; it does not itself perform the Firebase sign-in (that's a
  client SDK call in a small Client Component), only the session-cookie issuance step.
- **Expected future enhancements:** Password reset flow, "remember this org" for multi-org users,
  audit-log entry on login (`organizations/{orgId}/auditLogs`).

## `/dashboard` - Overview

- **Status:** Planned, Sprint 1, Developer 2 (shell) / Developer 3 (data).
- **Purpose:** Landing page after login. At-a-glance KPIs (open pipeline value, accounts at risk
  by health score, contracts up for renewal, recent activity) and a pipeline summary.
- **Permissions:** owner, admin, manager, rep, viewer (all authenticated org members; content may
  be scoped to "my accounts" for `rep`, org-wide for others - decide per-widget).
- **Key components:** `card.tsx` for KPI tiles (see "Cards" in
  [ui-design-system.md](./ui-design-system.md)), Recharts line/bar/area charts for pipeline trend
  and stage distribution, `table.tsx` for a "recent activity" or "at-risk accounts" mini-list,
  `skeleton.tsx` for loading states, `tabs.tsx` if the dashboard splits "My work" / "Team" views.
- **Actions:** Read-only - no Server Actions mutate data here. Data is fetched via TanStack Query
  hooks in `features/dashboard/hooks/` calling read-only Server Actions (e.g.
  `getDashboardSummary`) that aggregate across `accounts`, `opportunities`, and `contracts`
  repositories, optionally cached in `organizations/{orgId}/analyticsCache`.
- **Expected future enhancements:** Brutus AI "next best action" panel, customizable widget
  layout, per-user saved views.

## `/accounts` - Account list

- **Status:** Planned, Sprint 1, Developer 3.
- **Purpose:** Primary CRM entity list - every organization/company the CRM tracks, with health
  score, vertical, and owner columns; the Sprint 1 proof-of-concept for full-stack Create/Read.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Create/Edit/Delete: owner, admin,
  manager, rep (matches `firestore.rules` write rule on `accounts`).
- **Key components:** `table.tsx` (sticky header, sortable columns), `badge.tsx` for health-score
  status and vertical tags, `pagination.tsx`, `input.tsx` + `select.tsx` for search/filter toolbar,
  `dialog.tsx` for "Create account" quick-create, `button.tsx` (`default` for primary "New
  Account", `outline` for filters).
- **Actions:** `createAccount`, `listAccounts` (paginated query) in
  `features/accounts/actions/`, following the `{ ok, data } | { ok: false, error }` return
  convention from [api.md](./api.md). `listAccounts` is the Sprint 1 read path; `createAccount` is
  the Sprint 1 write path proving the full stack end to end.
- **Expected future enhancements:** Bulk import/export, saved filter views, inline health-score
  refresh from BalloAds, vertical-based segmentation view (Vertical Sales Indexing).

## `/accounts/[id]` - Account detail

- **Status:** Planned, Sprint 1, Developer 3 (baseline) / later sprints (enrichment).
- **Purpose:** 360° view of a single account - profile, BalloAds-supplied health score with
  breakdown, associated contacts, open opportunities, contracts, and activity timeline.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Edit: owner, admin, manager, rep.
- **Key components:** `card.tsx` for the account summary card (name, vertical badge, health-score
  badge, owner avatar via `avatar.tsx`), `tabs.tsx` to split Overview / Contacts / Opportunities /
  Contracts / Timeline, `table.tsx` for each related-entity sub-list, `sheet.tsx` for the "Edit
  account" slide-over, `progress.tsx` or a custom ring to visualize the 0–100 health score,
  `breadcrumb.tsx` back to `/accounts`.
- **Actions:** `getAccount`, `updateAccount` in `features/accounts/actions/`. The timeline tab
  reads `organizations/{orgId}/activities` filtered by `relatedTo.type == "account"` and
  `relatedTo.id == accountId` (see [database-schema.md](./database-schema.md) and
  [decisions.md](./decisions.md) - there is no separate `timeline` collection by design).
- **Expected future enhancements:** Brutus AI account summarization card, cross-sell/upsell signal
  panel, "trigger BalloAds journey" action logged as an Activity, opt-out/delivery status pulled
  from the BalloAds developer API.

## `/contacts` - Contact list

- **Status:** Planned, Sprint 2.
- **Purpose:** People associated with accounts - the CIMS (Customer Information Management)
  surface.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Write: owner, admin, manager, rep.
- **Key components:** `table.tsx` with account-name column (linking to `/accounts/[id]`),
  `avatar.tsx`, `input.tsx`/`select.tsx` filter toolbar, `pagination.tsx`, `dialog.tsx` for
  quick-create.
- **Actions:** `listContacts`, `createContact` in `features/contacts/actions/`.
- **Expected future enhancements:** Dedupe suggestions, CSV import, "primary contact" flag surfaced
  on the parent account card.

## `/contacts/[id]` - Contact detail

- **Status:** Planned, Sprint 2.
- **Purpose:** Single-contact profile, role/title, linked account, activity/communication history,
  BalloAds opt-out and channel delivery status.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Edit: owner, admin, manager, rep.
- **Key components:** `card.tsx` summary header, `tabs.tsx` (Overview / Activity), `table.tsx` for
  activity/timeline rows, `sheet.tsx` edit panel, `badge.tsx` for opt-out/channel status.
- **Actions:** `getContact`, `updateContact` in `features/contacts/actions/`; timeline reads
  `activities` filtered by `relatedTo.type == "contact"`.
- **Expected future enhancements:** Inline "send via BalloAds" trigger (calls the developer API,
  logs an Activity, never sends directly from BalloCRM).

## `/opportunities` - Pipeline (kanban)

- **Status:** Planned, Sprint 2.
- **Purpose:** Sales pipeline as a stage-based kanban board (and a table-view toggle), the core
  Sales Pipelines feature.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Write (create, move stage): owner,
  admin, manager, rep.
- **Key components:** Custom kanban built from `card.tsx` columns/cards (no dedicated shadcn
  kanban primitive), `badge.tsx` for stage and qualification-score chips, `dropdown-menu.tsx` for
  per-card quick actions, `tabs.tsx` to toggle Kanban/Table, `table.tsx` for the list view,
  `select.tsx` for stage/owner filters.
- **Actions:** `listOpportunities`, `moveOpportunityStage`, `createOpportunity` in
  `features/opportunities/actions/`. Stage changes may trigger a BalloAds journey call (e.g.
  onboarding sequence on "Closed Won") - logged as an Activity per the integration contract in
  [integrations.md](./integrations.md).
- **Expected future enhancements:** Brutus AI qualification scoring (BANT/MEDDIC fields), drag-
  reorder within a stage, forecast rollups feeding `/analytics`.

## `/opportunities/[id]` - Opportunity detail

- **Status:** Planned, Sprint 2.
- **Purpose:** Deal detail - value, stage history, qualification fields, linked account/contacts,
  AI next-best-action.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Edit: owner, admin, manager, rep.
- **Key components:** `card.tsx` summary, `progress.tsx` for qualification completeness,
  `tabs.tsx` (Overview / Qualification / Activity), `sheet.tsx` edit panel, `table.tsx` for stage
  history.
- **Actions:** `getOpportunity`, `updateOpportunity`, plus an AI-job-kickoff action
  (`requestQualificationScore`) that writes to `organizations/{orgId}/aiJobs` and polls via
  TanStack Query per the async AI Job pattern in [architecture.md](./architecture.md).
- **Expected future enhancements:** Full Brutus AI qualification panel, "ask Brutus" inline
  next-best-action card.

## `/contracts` - Contract list

- **Status:** Planned, Sprint 2/3.
- **Purpose:** Contract lifecycle tracking - active/expiring/renewed contracts per account.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Write: owner, admin, manager, rep.
- **Key components:** `table.tsx` with renewal-date column and expiry `badge.tsx` (e.g. `outline`
  for healthy, `destructive` for expiring soon), `select.tsx`/`input.tsx` filter toolbar,
  `pagination.tsx`, `calendar.tsx` inside a `popover.tsx` for date filtering.
- **Actions:** `listContracts`, `createContract` in `features/contracts/actions/`.
- **Expected future enhancements:** Renewal reminder automation (via BalloAds trigger), e-signature
  integration hook point.

## `/contracts/[id]` - Contract detail

- **Status:** Planned, Sprint 2/3.
- **Purpose:** Contract terms, value, renewal date, linked account, document reference, activity
  log.
- **Permissions:** Read: owner, admin, manager, rep, viewer. Edit: owner, admin, manager, rep.
- **Key components:** `card.tsx` summary, `badge.tsx` for status, `tabs.tsx` (Terms / Activity),
  `sheet.tsx` edit panel.
- **Actions:** `getContract`, `updateContract` in `features/contracts/actions/`.
- **Expected future enhancements:** Renewal-stage-to-opportunity conversion flow.

## `/campaigns` - ABM campaigns

- **Status:** Planned, Sprint 3.
- **Purpose:** Account-Based Marketing campaign definitions and their BalloAds trigger/send status
  (read-only status, not send infrastructure - see brief §3 non-goals).
- **Permissions:** Read: owner, admin, manager, rep, viewer. Write: owner, admin, manager.
- **Key components:** `table.tsx` for campaign list, `badge.tsx` for BalloAds send status,
  `dialog.tsx` for "New campaign" (target account list + BalloAds template reference),
  `tabs.tsx` for campaign detail if expanded inline rather than a sub-route.
- **Actions:** `listCampaigns`, `createCampaign`, `triggerBalloAdsCampaign` in
  `features/campaigns/actions/` - the trigger action is a server-side call to
  `/v1/developer-portal/*` per [integrations.md](./integrations.md), logged as an Activity.
- **Expected future enhancements:** Campaign performance rollups on `/analytics`, target-list
  builder driven by Vertical Sales Indexing filters.

## `/analytics` - Commercial analytics

- **Status:** Planned, Sprint 3.
- **Purpose:** Pipeline velocity, win/loss trends, forecasting, and a natural-language "ask a
  question about your pipeline" panel backed by Brutus AI.
- **Permissions:** owner, admin, manager, viewer (read-only for all; `rep` may be scoped to
  "my pipeline" only - decide per widget).
- **Key components:** Recharts line/bar/area charts (see chart conventions in
  [ui-design-system.md](./ui-design-system.md)), `card.tsx` KPI tiles, `select.tsx` for date-range
  and segment filters, `command.tsx`/`input-group.tsx` for the NL query box, `skeleton.tsx` for
  chart loading states.
- **Actions:** Read-only aggregation actions (e.g. `getPipelineVelocity`, `getForecast`) backed by
  `organizations/{orgId}/analyticsCache` for expensive rollups; the NL Q&A panel kicks off an
  `aiJobs` entry and polls for `completed` per the async AI Job pattern.
- **Expected future enhancements:** Saved/shared dashboards, export to CSV/PDF, scheduled email
  digests (triggered via BalloAds, not built in BalloCRM).

## `/settings` - Org settings

- **Status:** Planned, Sprint 1 (skeleton) / Sprint 3 (integrations config).
- **Purpose:** Organization profile, member/role management, and integration credentials
  (BalloAds developer API key, Brutus AI key) stored in
  `organizations/{orgId}/integrations/{provider}`.
- **Permissions:** Full read/write: owner, admin. Read-only view of non-secret settings: manager.
  Not visible to rep/viewer. Integration credential fields themselves are never read back to any
  client - `firestore.rules` sets `allow read, write: if false` on `integrations/*`; all access is
  server-side via the Admin SDK (see [firestore-rules.md](./firestore-rules.md)).
- **Key components:** `tabs.tsx` (General / Members / Integrations), `table.tsx` for member list
  with `select.tsx` role dropdown, `field.tsx` primitives for the integration-key forms,
  `input.tsx` with a masked/secret display pattern, `alert-dialog.tsx` for destructive actions
  (remove member, rotate key), `switch.tsx` for feature toggles.
- **Actions:** `updateOrgProfile`, `updateMemberRole`, `saveIntegrationCredentials` (BalloAds and
  Brutus, one action per provider or a shared parameterized one) in `features/settings/actions/`.
  Credential-saving actions encrypt the value before writing to Firestore per
  [integrations.md](./integrations.md); the raw key never round-trips back to the browser after
  save (show a masked/last-4 value only).
- **Expected future enhancements:** Audit log viewer (`organizations/{orgId}/auditLogs`), SSO
  configuration, per-role permission overrides beyond the fixed five-role model.
