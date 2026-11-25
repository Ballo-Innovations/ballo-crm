# Integration Adapters

## Pattern

```ts
export interface SmsAdapter {
  send(to: string, body: string): Promise<{ id: string; status: "QUEUED" | "SENT" | "FAILED" }>;
}
export interface TelephonyAdapter {
  call(to: string, from: string): Promise<{ callId: string }>;
}
export interface ErpAdapter {
  pushOrder(order: ErpOrder): Promise<{ erpOrderId: string }>;
}
export interface EspfAdapter {
  syncAccount(acc: EspfAccountPayload): Promise<{ espfId: string }>;
  pullStatus(espfId: string): Promise<EspfStatus>;
}
export interface EmailAdapter {
  send(msg: OutboundEmail): Promise<{ messageId: string }>;
}
```

Resolved by `getAdapter('sms')` reading `INTEGRATION_MODE=mock|live`. Every call logged to `IntegrationLog`. Every inbound creates an `EngagementEvent`.

## Mock integrations service (`mock-integrations/`, Express, port 4100)

| Endpoint                                                                                                              | Behaviour                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| POST /sms                                                                                                             | returns QUEUED, 2s later POSTs delivery receipt to app webhook                      |
| POST /telephony/call                                                                                                  | returns callId; emits CALL event with random 1–6 min duration                       |
| POST /erp/orders                                                                                                      | returns `ERP-xxxx`; echoes line items                                               |
| POST /espf/accounts                                                                                                   | returns `ESPF-xxxx`; GET /espf/accounts/:id returns status cycling ACTIVE/SUSPENDED |
| POST /email/send                                                                                                      | logs; returns messageId                                                             |
| Mock UI page `/settings/integrations` shows last 20 IntegrationLog rows live (polling) - this is what we show judges. |

## eSPF (internal, unknown)

We don't know its API. Document an _assumed_ contract (`EspfAccountPayload: {externalRef, name, sector, services[]}`) and state explicitly on stage: "adapter boundary is defined; the mapping is a 1-day task once Infratel shares the spec."

## Live provider: BalloAds (SMS and email)

Outbound and inbound comms go through the **BalloAds API**. It replaces the earlier
Africa's Talking and Resend options. Owner: Dev C (Chisowa).

- **Modes:** `INTEGRATION_MODE=mock` (local, CI, demo fallback) uses `mock-integrations`;
  `INTEGRATION_MODE=live` uses the BalloAds adapters. Telephony, ERP and eSPF stay on the mock.
- **Adapters:** `BalloAdsSmsAdapter` implements `SmsAdapter` and `BalloAdsEmailAdapter` implements
  `EmailAdapter`, in `src/modules/integrations/adapters/balloads/`. Callers never import them
  directly; they use `getAdapter('sms' | 'email')`.
- **Inbound:** BalloAds delivery receipts and replies arrive at
  `POST /api/v1/webhooks/balloads`, verified with `BALLOADS_WEBHOOK_SECRET`. A bad or missing
  signature returns 401 and writes nothing. Each verified event writes an `IntegrationLog` row and,
  for replies, an `EngagementEvent` on the matching contact's account.
- **Failures:** a BalloAds error or timeout is logged as a failed `IntegrationLog` row and never
  crashes the calling action. Retry is manual from the Integrations tab.
- **Mock parity:** `mock-integrations` mirrors the BalloAds request and response shapes, so
  switching modes changes no calling code.

| Variable                  | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `BALLOADS_API_URL`        | Base URL of the BalloAds API            |
| `BALLOADS_API_KEY`        | API key, sent on every request          |
| `BALLOADS_WEBHOOK_SECRET` | Verifies inbound webhooks from BalloAds |

**Where the key lives:** local, in your own `.env` (copied from the team's private access doc);
deployed, in `/var/apps/ballocrm-<env>/deploy/.env` on the host and in the Vercel project's
environment variables. Never in the repo, chat, tickets or PR descriptions.

**What we know** (from the BalloAds backend README, checked Nov 2026):

| Item     | Value                                                                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL | prod `https://app-api.balloads.com`, staging `https://app-api-staging.balloads.com`, dev `https://app-api-dev.balloads.com`. Keys are per environment: a key only works on the host that issued it. |
| Auth     | header `x-api-key: <key>`                                                                                                                                                                           |
| Keys     | `ba_live_...` sends for real; `ba_test_...` sends with a ` [TRIAL]` suffix. Use a test key for dev and stage.                                                                                       |
| SMS      | `POST /v1/messaging/sms/send` with `{ "message": "...", "recipients": ["097..."] }`. Sender ID is the company's own; it cannot be set per message.                                                  |
| Email    | `POST /v1/messaging/email/send` with one of `templateId`, `htmlBody` or `message`, plus optional `variables`.                                                                                       |
| Credits  | Charged only for successful dispatches; failures are logged and free. Optional per-key rate limit.                                                                                                  |
| Errors   | `401 {"error":"Invalid API key."}`; `400` problem JSON with `detail` (for example "At least one recipient is required.")                                                                            |

**Still to confirm with BalloAds before E9-08 starts** (record the answers here):

1. Success response shape for SMS and email (message id and status values).
2. Whether delivery receipts and replies are pushed to a webhook, and its payload and signature
   method. If there is no webhook, E9-08 polls for status instead.
3. A `ba_test_` key for the BalloCRM dev and stage environments.
