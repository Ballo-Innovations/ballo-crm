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
| Mock UI page `/admin/integrations` shows last 20 IntegrationLog rows live (polling) — this is what we show judges. |

## eSPF (internal, unknown)

We don't know its API. Document an _assumed_ contract (`EspfAccountPayload: {externalRef, name, sector, services[]}`) and state explicitly on stage: "adapter boundary is defined; the mapping is a 1-day task once Infratel shares the spec."

## Live option (only if ahead of schedule)

- SMS: Africa's Talking sandbox (free). Env `AT_USERNAME`, `AT_API_KEY`.
- Email out: Resend/SMTP. Email in: Resend inbound webhook → `/webhooks/email/inbound`.
