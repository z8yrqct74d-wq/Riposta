# Card payments — xMoney

In-app card payments for credit packages. The athlete taps **Pay by card** on
the Payments screen, pays on xMoney's hosted page in a system browser, and the
credits land on their account as soon as xMoney's webhook confirms the charge.

Reference: [xMoney docs](https://docs.xmoney.com/guides/general/get-started) —
[one-off payments](https://docs.xmoney.com/guides/payments/one-off-payments),
[mobile apps](https://docs.xmoney.com/guides/mobile-apps/accepting-payments),
[webhooks](https://docs.xmoney.com/api/webhooks).

## Why hosted checkout

The app never sees card data, so it stays out of PCI scope, and no native SDK
has to be added to the Expo project (`expo-web-browser` + `expo-auth-session`
are already dependencies). The secret key lives only in Supabase Edge Function
secrets — never in `EXPO_PUBLIC_*`, which ships inside the binary.

## The flow

```
app                    xmoney-checkout            xMoney            xmoney-webhook / -return
 │  POST {planId} ──────────▶ price the plan
 │                            create payment_intent (pending)
 │  ◀── {intentId, checkoutUrl}
 │
 │  openAuthSessionAsync(checkoutUrl)
 │                       GET ?t=token
 │                            burn token, render
 │                            self-submitting form ──▶ hosted payment page
 │                                                          │
 │                                                          ├─▶ POST opensslResult ─▶ xmoney-webhook
 │                                                          │        settle_xmoney_payment() → credits
 │                                                          └─▶ browser POST ───────▶ xmoney-return
 │  ◀── riposte://payments?intent=…&status=paid ──────────────────────  (settles too, idempotently)
 │
 │  poll payment_intents until status ≠ pending → refresh balance
```

Two things are worth being explicit about:

- **The webhook is the authority on money.** The browser return trip can be
  abandoned, killed, or replayed; credits are granted by
  `settle_xmoney_payment()`, which both endpoints call and which is idempotent
  under a row lock. The app treats what the browser says as a hint and asks the
  database what actually happened.
- **The client never states a price.** It sends a `planId`; the Edge Function
  reads the amount from `plans.price_amount`, and settlement refuses to credit
  a payload whose amount or currency doesn't match the intent.

## Pieces

| Where | What |
|-------|------|
| `supabase/migrations/add_xmoney_payments.sql` | `plans.price_amount/currency/purchasable`, `payment_intents`, `settle_xmoney_payment()` |
| `supabase/functions/_shared/xmoney.ts` | checksum + payload construction, notification decryption |
| `supabase/functions/xmoney-checkout` | `POST` creates an intent, `GET ?t=` renders the hand-off form |
| `supabase/functions/xmoney-webhook` | server-to-server notification (grants credits) |
| `supabase/functions/xmoney-return` | `backUrl`; settles, then deep-links back into the app |
| `packages/core/src/db.ts` | `startCardPayment`, `getPaymentIntent`, `getPaymentIntentsForMember` |
| `apps/mobile/src/athlete/useCardCheckout.ts` | opens the browser, polls the intent |
| `apps/admin/.../AdminPlansSettings.jsx` | admin sets the charge amount, currency, and the card-payment toggle |

## Setup

1. **Migration** — run `supabase/migrations/add_xmoney_payments.sql` in the
   Supabase SQL editor. It backfills `price_amount` from the existing display
   prices (`'€210'` → `210.00`) and switches card payments on for the one-off
   credit packs only. Anything priced per period or per session (`'€120/mo'`,
   `'€18/session'`) is left off: this checkout charges once, so selling a
   monthly plan through it is a decision for the club, not a migration
   default. Check the numbers afterwards:
   `select id, price, price_amount, currency, purchasable from plans order by sort;`

2. **Function secrets** — in Supabase → Edge Functions → Secrets (or
   `supabase secrets set …`):

   | Secret | Value |
   |--------|-------|
   | `XMONEY_SECRET_KEY` | `sk_test_…` / `sk_live_…` from the xMoney dashboard. The prefix picks the environment: test keys post to `secure-stage.xmoney.com`, live keys to `secure.xmoney.com`. |
   | `XMONEY_SITE_ID` | Site id from the xMoney dashboard. |
   | `XMONEY_CUSTOMER_COUNTRY` | Optional, 2-letter fallback country for the customer record. Defaults to `RO`. |
   | `XMONEY_APP_RETURN_URL` | Optional. Deep link the payment page returns to. Defaults to `riposte://payments` — matches `app.json`'s `scheme`. |
   | `XMONEY_FUNCTIONS_BASE_URL` | Optional. Public base for the functions, e.g. if they sit behind a custom domain. Defaults to `${SUPABASE_URL}/functions/v1`. |

   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
   injected by the platform — don't set them by hand.

3. **Deploy the functions.** All three take callers without a Supabase JWT (a
   plain browser, and xMoney's servers), so all three are deployed with
   `--no-verify-jwt`. `xmoney-checkout` verifies the athlete's token itself on
   its `POST` path:

   ```sh
   supabase functions deploy xmoney-checkout --no-verify-jwt
   supabase functions deploy xmoney-webhook  --no-verify-jwt
   supabase functions deploy xmoney-return   --no-verify-jwt
   ```

4. **Point xMoney at the webhook.** Dashboard → your site → notification URL:

   ```
   https://<project-ref>.supabase.co/functions/v1/xmoney-webhook
   ```

   The `backUrl` is sent per-order by `xmoney-checkout`; nothing to configure.
   A non-`200` reply makes xMoney retry after 1 min, 5 min, 1 h and 24 h.

5. **Check the plans** in the admin app (Plans & settings → Edit plan → Card
   payments). The **charge amount** is what gets billed; the price field above
   it stays display text.

## Testing

Use a `sk_test_` key and xMoney's test cards, then buy a pack from the athlete
app. What to look for:

- `payment_intents` gets a `pending` row on tap, `paid` after the webhook.
- `payments` gets one `topup` row — replayed webhooks hit the
  `(provider, provider_ref)` unique index and change nothing.
- `members.credits` goes up exactly once.
- Killing the app mid-payment still works: the deep link reopens Payments with
  `?intent=…` and the screen resumes polling that intent.

Function logs (`supabase functions logs xmoney-webhook`) print a `[xmoney]
settled` line per notification with the intent id and the resulting status.

## Notes / limits

- **One-off purchases only.** `cardTransactionMode` is `authAndCapture` and the
  order type is `purchase`. Recurring subscriptions (xMoney order type
  `recurring`, plus `order-rebill`) are not wired up; monthly plans stay
  admin-recorded until they are.
- **Refunds** are initiated in the xMoney dashboard. The `refund-ok` /
  `void-ok` notifications are handled: a `refund` row is recorded and the
  granted credits are taken back (floored at zero).
- **Notification decryption key.** xMoney's docs say to decrypt `opensslResult`
  with "your API key" while their Node SDK passes the full `sk_…` secret; only
  one can be a valid 32-byte AES key for a given account, so
  `decryptNotification` tries each 32-byte candidate and keeps the one that
  yields JSON. If a future account shape breaks both, the webhook logs
  `decryption failed` and returns a retryable error rather than crediting
  anything.
