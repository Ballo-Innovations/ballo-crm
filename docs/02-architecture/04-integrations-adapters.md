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

| Endpoint                                                                                                           | Behaviour                                                                           |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| POST /sms                                                                                                          | returns QUEUED, 2s later POSTs delivery receipt to app webhook                      |
| POST /telephony/call                                                                                               | returns callId; emits CALL event with random 1–6 min duration                       |
| POST /erp/orders                                                                                                   | returns `ERP-xxxx`; echoes line items                                               |
| POST /espf/accounts                                                                                                | returns `ESPF-xxxx`; GET /espf/accounts/:id returns status cycling ACTIVE/SUSPENDED |
| POST /email/send                                                                                                   | logs; returns messageId                                                             |
| Mock UI page `/settings/integrations` shows last 20 IntegrationLog rows live (polling) — this is what we show judges. |

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

| Variable                  | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `BALLOADS_API_URL`        | Base URL of the BalloAds API                |
| `BALLOADS_API_KEY`        | API key, sent on every request              |
| `BALLOADS_WEBHOOK_SECRET` | Verifies inbound webhooks from BalloAds     |

**Where the key lives:** local, in your own `.env` (copied from the team's private access doc);
deployed, in `/var/apps/ballocrm-<env>/deploy/.env` on the host and in the Vercel project's
environment variables. Never in the repo, chat, tickets or PR descriptions.

**To confirm with BalloAds before E9-08 starts** (record the answers here):

1. Which channels the API covers (SMS, email, WhatsApp) and the sender IDs and domains for Infratel.
2. Auth scheme (header name and format) and rate limits.
3. Send endpoints and response shape, including the message id and status values.
4. Webhook events (delivery, failure, reply), payload shape and signature method.
5. A sandbox or test mode, so dev and stage never message real customers.
