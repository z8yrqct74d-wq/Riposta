// xmoney-return — the hosted checkout's `backUrl`.
//
// xMoney redirects the *browser* here (POST, form-encoded, carrying the same
// encrypted `opensslResult` as the webhook) once the payment page is done. Its
// job is to get the user back into the app: settle if it can — the webhook may
// not have landed yet, and the athlete should not stare at a stale balance —
// then bounce to the `riposte://` deep link the in-app browser is waiting for.
//
// Deploy with --no-verify-jwt: the caller is a plain browser.
import { readNotificationPayload } from '../_shared/xmoney.ts';
import { settleNotification } from '../_shared/settle.ts';

const appReturnUrl = (): string => Deno.env.get('XMONEY_APP_RETURN_URL') ?? 'riposte://payments';

function deepLink(intentId: string | null, status: string): string {
  const base = appReturnUrl();
  const params = new URLSearchParams({ status });
  if (intentId) params.set('intent', intentId);
  return `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`;
}

const MESSAGE: Record<string, string> = {
  paid: 'Payment complete. Returning to Riposte…',
  failed: 'Payment was not completed. Returning to Riposte…',
  refunded: 'Payment refunded. Returning to Riposte…',
  pending: 'Payment is still processing. Returning to Riposte…',
  unknown: 'Returning to Riposte…',
};

function bouncePage(url: string, status: string): Response {
  const escaped = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Returning to Riposte</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;background:#0F1E38;color:#fff;
       font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;padding:24px}
  a{display:inline-block;margin-top:16px;padding:11px 18px;border-radius:10px;background:#fff;color:#0F1E38;
    text-decoration:none;font-weight:600}
</style>
</head>
<body>
<div>
  <p>${MESSAGE[status] ?? MESSAGE.unknown}</p>
  <a href="${escaped}">Back to Riposte</a>
</div>
<script>window.location.replace("${escaped}");</script>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

Deno.serve(async (req) => {
  const fallbackIntentId = new URL(req.url).searchParams.get('intent');

  try {
    const payload = await readNotificationPayload(req);
    const result = await settleNotification(payload, fallbackIntentId);
    return bouncePage(deepLink(result.intentId, result.status), result.status);
  } catch (error) {
    console.error('[xmoney-return] unhandled', error);
    // Still bounce the user home — the webhook remains the settling authority.
    return bouncePage(deepLink(fallbackIntentId, 'unknown'), 'unknown');
  }
});
