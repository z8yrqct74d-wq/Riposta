// xMoney hosted-checkout primitives.
//
// Mirrors the official Node SDK (`xmoney` on npm) — same base URLs, same
// jsonRequest/checksum construction, same notification decryption — but
// written for Deno so it can run in a Supabase Edge Function without pulling
// axios in. The SDK is not used directly because its only checkout method
// returns a hard-coded HTML blob and its transport layer is dead weight here.
//
// Docs: https://docs.xmoney.com/guides/payments/one-off-payments
//       https://docs.xmoney.com/api/webhooks
import { Buffer } from 'node:buffer';
import { createHmac, createDecipheriv } from 'node:crypto';

export const LIVE_SECURE_URL = 'https://secure.xmoney.com';
export const TEST_SECURE_URL = 'https://secure-stage.xmoney.com';

const KEY_RE = /^sk_(test|live)_(.+)$/;

export function assertSecretKey(secretKey: string | undefined): string {
  if (!secretKey || !KEY_RE.test(secretKey)) {
    throw new Error("XMONEY_SECRET_KEY is missing or malformed (expected 'sk_test_…' / 'sk_live_…').");
  }
  return secretKey;
}

export const isLiveKey = (secretKey: string): boolean => secretKey.startsWith('sk_live_');

/** Hosted-checkout host the form posts to — chosen by the key's environment. */
export const secureBaseUrl = (secretKey: string): string =>
  isLiveKey(secretKey) ? LIVE_SECURE_URL : TEST_SECURE_URL;

/** The key without its `sk_test_` / `sk_live_` prefix — xMoney's "API key". */
export function apiKeyOf(secretKey: string): string {
  const m = secretKey.match(KEY_RE);
  return m ? m[2] : secretKey;
}

// ── Hosted checkout ───────────────────────────────────────────

export interface HostedCustomer {
  identifier: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  phone?: string;
}

export interface HostedOrder {
  orderId: string;
  type: 'purchase' | 'recurring' | 'managed';
  amount: number;
  currency: string;
  description?: string;
}

export interface HostedCheckoutRequest {
  siteId: string | number;
  customer: HostedCustomer;
  order: HostedOrder;
  cardTransactionMode: 'auth' | 'authAndCapture' | 'credit';
  backUrl: string;
  saveCard?: boolean;
  customData?: Record<string, unknown>;
}

export interface HostedCheckoutForm {
  action: string;
  jsonRequest: string;
  checksum: string;
}

/**
 * Base64 payload + HMAC-SHA512 checksum for the hosted-checkout form.
 *
 * Both are derived from the *same* serialised string — signing a re-stringified
 * copy would risk a key-order mismatch and a rejected checksum. The checksum is
 * keyed with the full secret key (prefix included), matching the Node SDK.
 */
export function buildHostedCheckout(
  request: HostedCheckoutRequest,
  secretKey: string,
): HostedCheckoutForm {
  const payload = { saveCard: false, ...request };
  const json = JSON.stringify(payload);
  return {
    action: secureBaseUrl(secretKey),
    jsonRequest: Buffer.from(json, 'utf8').toString('base64'),
    checksum: createHmac('sha512', secretKey).update(json).digest('base64'),
  };
}

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Self-submitting form that hands the browser over to xMoney's payment page.
 * Rendered into the in-app browser; the user never sees it for more than a
 * frame, so it also carries a manual button for the no-JS / slow-network case.
 */
export function hostedCheckoutHtml(form: HostedCheckoutForm, title = 'Redirecting to payment…'): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttr(title)}</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;background:#0F1E38;color:#fff;
       font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center}
  .box{padding:24px}
  button{font:inherit;margin-top:16px;padding:11px 18px;border:0;border-radius:10px;background:#fff;color:#0F1E38;font-weight:600}
</style>
</head>
<body>
<div class="box">
  <p>Taking you to the secure payment page…</p>
  <form id="xmoney-checkout-form" action="${escapeAttr(form.action)}" method="post" accept-charset="UTF-8">
    <input type="hidden" name="jsonRequest" value="${escapeAttr(form.jsonRequest)}">
    <input type="hidden" name="checksum" value="${escapeAttr(form.checksum)}">
    <button type="submit">Continue</button>
  </form>
</div>
<script>document.getElementById('xmoney-checkout-form').submit();</script>
</body>
</html>`;
}

// ── Notifications (webhook / backUrl) ─────────────────────────

export type XMoneyTransactionStatus =
  | 'start'
  | 'in-progress'
  | '3d-pending'
  | 'complete-ok'
  | 'complete-failed'
  | 'refund-ok'
  | 'void-ok';

export interface XMoneyNotification {
  transactionStatus: XMoneyTransactionStatus;
  orderId?: number;
  externalOrderId?: string;
  transactionId?: number;
  transactionMethod?: string;
  customerId?: number;
  identifier?: string;
  amount?: number;
  currency?: string;
  customData?: Record<string, unknown>;
  timestamp?: number;
  cardId?: number | null;
  errors?: Array<{ code?: number; message?: string; type?: string }>;
}

/**
 * Decrypts the `opensslResult` xMoney POSTs to the notification and back URLs:
 * `base64(iv),base64(aes-256-cbc ciphertext)`.
 *
 * The docs say to decrypt with "your API key" while the Node SDK passes the
 * full secret key — and AES-256 only accepts a 32-byte key, so at most one of
 * them can be right for a given account. Rather than betting on either, try
 * each 32-byte candidate and keep the one that yields JSON.
 */
export function decryptNotification(payload: string, secretKey: string): XMoneyNotification {
  const comma = payload.indexOf(',');
  if (comma < 0) throw new Error('Malformed xMoney payload: expected "<iv>,<ciphertext>".');

  const iv = Buffer.from(payload.slice(0, comma), 'base64');
  const ciphertext = Buffer.from(payload.slice(comma + 1), 'base64');

  const candidates = [...new Set([apiKeyOf(secretKey), secretKey])].filter(
    (key) => Buffer.byteLength(key, 'utf8') === 32,
  );
  if (candidates.length === 0) {
    throw new Error('No 32-byte AES key derivable from XMONEY_SECRET_KEY — cannot decrypt notification.');
  }

  let lastError: unknown;
  for (const key of candidates) {
    try {
      const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
      return JSON.parse(plaintext) as XMoneyNotification;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Could not decrypt xMoney notification: ${(lastError as Error)?.message ?? 'unknown error'}`);
}

/** Reads `opensslResult` out of a form-encoded, JSON, or query-string request. */
export async function readNotificationPayload(req: Request): Promise<string | null> {
  const fromQuery = new URL(req.url).searchParams.get('opensslResult');
  if (fromQuery) return fromQuery;
  if (req.method !== 'POST') return null;

  const contentType = req.headers.get('content-type') ?? '';
  const body = await req.text();
  if (!body) return null;

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body) as { opensslResult?: string };
      return parsed.opensslResult ?? null;
    } catch {
      return null;
    }
  }
  return new URLSearchParams(body).get('opensslResult');
}
