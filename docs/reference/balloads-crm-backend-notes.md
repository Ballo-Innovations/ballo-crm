# CRM Backend Guide

## Health Score Formula

`CrmClientFields.HealthScore` is persisted and defaults to 50 when no overlay exists.

Recommended weighted model:

- Activity recency (max 40)
- Credit runway (max 20)
- Payment reliability (max 20)
- Campaign cadence (max 10)
- Sender verification and platform readiness (max 10)

`HealthScoreBreakdownJson` stores the component-level calculation for auditability.

## Trigger Catalog

Journeys support trigger-based enrolment through `CrmJourneyTriggerService`. Enrolment is fired
by either the hourly `CrmJourneyTriggerScanJob` (state/edge triggers) or event hooks via
`CrmJourneyTriggerDispatcher` (immediate triggers). The canonical trigger names used by the CRM
UI are below; `inactive` is accepted as a legacy alias for `inactive_30d`.

| Trigger | Detection | Source |
|---------|-----------|--------|
| `manual` | Manual enrol from CRM (`POST /journeys/enrol`) | UI |
| `new_signup` | `Company.CreatedAt` within `signupWindowHours` (default 24h) | Event hook (`CompanyService`) + scan catch-up |
| `payment_failed` | Purchased PO marked `Failed` | Event hook (`BlazeService`) |
| `plan_upgraded` | Plan tier rank increases (edge) | Event hook (`BlazeService`) + scan |
| `plan_downgraded` | Plan tier rank decreases (edge) | Scan |
| `credits_low` | Credits cross below `creditsThreshold` (default 100) | Scan (edge) |
| `inactive_30d` | No activity for `inactiveDays` (default 30) | Scan (state) |

### `TriggerConfigJson` schema

Per-journey overrides parsed by `CrmJourneyTriggerEvaluator.ParseConfig`:

```json
{ "creditsThreshold": 100, "inactiveDays": 30, "signupWindowHours": 24 }
```

### Edge vs state semantics

- **State triggers** (`inactive_30d`) fire whenever the condition currently holds. Re-firing is
  bounded by the journey entry mode (an active enrolment blocks re-enrol).
- **Edge triggers** (`credits_low`, `plan_upgraded`, `plan_downgraded`) fire only on a transition,
  detected by comparing the current metrics to the `CrmCompanyTriggerSnapshot`. They never fire on
  the first snapshot, which prevents a mass enrol on first deploy.

### Future / platform triggers (Phase 11, not yet wired to scan)

- `purchase_order_purchased`, `purchase_order_expiring`, `purchase_order_expired`
- `sender_id_rejected`, `first_campaign_sent`, `campaign_failure_rate_high`
- `api_key_created`, `api_first_success`

## Node Catalog

Runner-compatible node types:

- Messaging: `sms`, `email`, `whatsapp`
- Timing: `delay`, `wait`, `schedule`
- Logic: `condition`, `split`
- CRM actions: `update`, `mark`, `funnel`
- Dashboard delivery: `dashboard_notification`, `dashboard_banner`
- Terminal: `stop`

Unknown nodes are recorded as executions and safely skipped/failed without crashing the runner.

## Dispatch and Opt-Out Flow

Dispatch route:

1. Journey/campaign requests send through `ICrmDispatchService`.
2. Service checks `PlatformSettings` CRM gates:
   - `CrmDispatchEnabled`
   - `CrmSmsEnabled`
   - `CrmEmailEnabled`
   - `CrmWhatsAppEnabled`
3. Service checks `CrmCompanyOptOut` by `(CompanyId, Channel)`.
4. Service records spend to `CrmOpsLedgerEntry` (`RefType=journey|campaign`).
5. Message status is captured in `CrmMessageLog` (`queued`, `logged_only`, `opted_out`).

This keeps CRM communication costs isolated from company purchase-order balances.
