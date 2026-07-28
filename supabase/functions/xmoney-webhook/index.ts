// xmoney-webhook — the server-to-server notification (IPN) endpoint.
//
// This is the source of truth for money: credits are granted here, not on the
// browser's return trip, which a user can abandon. xMoney POSTs an encrypted
// `opensslResult` and expects `200 OK` with the body `OK`; anything else is
// retried after 1 minute, 5 minutes, 1 hour and 24 hours, then dropped.
//
// Point xMoney's notification URL (Dashboard → site settings) at:
//   https://<project-ref>.supabase.co/functions/v1/xmoney-webhook
//
// Deploy with --no-verify-jwt — xMoney has no Supabase token. The payload's
// AES encryption under the account secret is what authenticates it.
import { readNotificationPayload } from '../_shared/xmoney.ts';
import { settleNotification } from '../_shared/settle.ts';

const ok = () => new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: string | null = null;
  try {
    payload = await readNotificationPayload(req);
  } catch (error) {
    console.error('[xmoney-webhook] could not read body', error);
  }

  if (!payload) {
    // Nothing to decrypt: a retry would deliver the same empty body, so ack.
    console.warn('[xmoney-webhook] notification without opensslResult — acknowledged, ignored');
    return ok();
  }

  try {
    const result = await settleNotification(payload);
    if (result.error) {
      console.error('[xmoney-webhook] settlement problem', result.error);
      // A transient failure (DB down, decryption misconfigured) is worth a
      // retry; xMoney will re-deliver on a non-200.
      if (result.status === 'unknown') return new Response('RETRY', { status: 500 });
    }
    return ok();
  } catch (error) {
    console.error('[xmoney-webhook] unhandled', error);
    return new Response('RETRY', { status: 500 });
  }
});
