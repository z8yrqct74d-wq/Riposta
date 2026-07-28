// xmoney-checkout — starts a card payment.
//
// Two entry points, deliberately in one function so the pair stays adjacent:
//
//   POST /xmoney-checkout           (Supabase JWT required)
//     { planId } → { intentId, checkoutUrl }
//     Prices the plan server-side, opens a `payment_intents` row, and mints a
//     single-use token.
//
//   GET  /xmoney-checkout?t=<token> (no JWT — a bare system browser calls it)
//     Returns the self-submitting form that hands off to xMoney. The token is
//     burned on first use, so the URL is worthless once redeemed.
//
// The client never sees the secret key, never states the amount, and never
// gets to name the member being charged.
//
// Deploy with --no-verify-jwt (the GET has no JWT); the POST path verifies the
// caller's token itself.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient, secretKey } from '../_shared/settle.ts';
import { buildHostedCheckout, hostedCheckoutHtml, type HostedCheckoutRequest } from '../_shared/xmoney.ts';

const TOKEN_TTL_MINUTES = 15;

const functionsBaseUrl = (): string =>
  (Deno.env.get('XMONEY_FUNCTIONS_BASE_URL') ?? `${Deno.env.get('SUPABASE_URL')}/functions/v1`).replace(/\/$/, '');

function splitName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Riposte', lastName: 'Member' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// ── POST: create the intent ───────────────────────────────────
async function createIntent(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Not signed in.' }, 401);

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );
  const { data: userData, error: userError } = await anonClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ error: 'Not signed in.' }, 401);

  let planId: string | undefined;
  try {
    ({ planId } = (await req.json()) as { planId?: string });
  } catch {
    return json({ error: 'Expected a JSON body.' }, 400);
  }
  if (!planId) return json({ error: 'planId is required.' }, 400);

  const admin = serviceClient();

  const { data: member } = await admin
    .from('members')
    .select('id, name, email')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!member) return json({ error: 'No member profile is linked to this account.' }, 403);

  const { data: plan } = await admin
    .from('plans')
    .select('id, name, sub, price_amount, currency, credits, purchasable')
    .eq('id', planId)
    .maybeSingle();
  if (!plan) return json({ error: 'Unknown plan.' }, 404);
  if (!plan.purchasable || !plan.price_amount || Number(plan.price_amount) <= 0) {
    return json({ error: 'This plan is not available for card payment.' }, 400);
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const { data: intent, error: intentError } = await admin
    .from('payment_intents')
    .insert({
      member_id: member.id,
      plan_id: plan.id,
      description: plan.name,
      amount: Number(plan.price_amount),
      currency: plan.currency ?? 'EUR',
      credits: plan.credits ?? 0,
      checkout_token: token,
      token_expires_at: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString(),
    })
    .select('id')
    .single();
  if (intentError || !intent) {
    console.error('[xmoney] could not create intent', intentError);
    return json({ error: 'Could not start the payment.' }, 500);
  }

  return json({
    intentId: intent.id,
    checkoutUrl: `${functionsBaseUrl()}/xmoney-checkout?t=${token}`,
    amount: Number(plan.price_amount),
    currency: plan.currency ?? 'EUR',
    credits: plan.credits ?? 0,
  });
}

// ── GET: redeem the token, render the hand-off form ───────────
function errorPage(message: string, status: number): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Payment unavailable</title>
<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;background:#0F1E38;color:#fff;font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;padding:24px}</style>
</head><body><p>${message}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function renderCheckout(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get('t');
  if (!token) return errorPage('This payment link is invalid.', 400);

  const admin = serviceClient();
  const { data: intent } = await admin
    .from('payment_intents')
    .select('id, member_id, plan_id, description, amount, currency, status, token_used_at, token_expires_at')
    .eq('checkout_token', token)
    .maybeSingle();

  if (!intent) return errorPage('This payment link is invalid.', 404);
  if (intent.status !== 'pending') return errorPage('This payment has already been completed.', 409);
  if (intent.token_used_at) return errorPage('This payment link has already been used. Start a new payment in the app.', 409);
  if (intent.token_expires_at && new Date(intent.token_expires_at) < new Date()) {
    return errorPage('This payment link has expired. Start a new payment in the app.', 410);
  }

  // Burn the token before handing anything to the browser: one form per intent.
  const { data: burned } = await admin
    .from('payment_intents')
    .update({ token_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', intent.id)
    .is('token_used_at', null)
    .select('id');
  if (!burned || burned.length === 0) {
    return errorPage('This payment link has already been used. Start a new payment in the app.', 409);
  }

  const { data: member } = await admin
    .from('members')
    .select('id, name, email')
    .eq('id', intent.member_id)
    .maybeSingle();

  const siteId = Deno.env.get('XMONEY_SITE_ID');
  if (!siteId) {
    console.error('[xmoney] XMONEY_SITE_ID is not set');
    return errorPage('Card payments are not configured yet. Please contact your club.', 500);
  }

  const { firstName, lastName } = splitName(member?.name);
  const request: HostedCheckoutRequest = {
    siteId,
    customer: {
      identifier: intent.member_id,
      email: member?.email ?? undefined,
      firstName,
      lastName,
      country: Deno.env.get('XMONEY_CUSTOMER_COUNTRY') ?? 'RO',
    },
    order: {
      orderId: intent.id, // comes back as `externalOrderId` in the notification
      type: 'purchase',
      amount: Number(intent.amount),
      currency: intent.currency ?? 'EUR',
      description: intent.description ?? 'Riposte',
    },
    cardTransactionMode: 'authAndCapture',
    backUrl: `${functionsBaseUrl()}/xmoney-return?intent=${intent.id}`,
    customData: { intentId: intent.id, memberId: intent.member_id, planId: intent.plan_id },
  };

  const form = buildHostedCheckout(request, secretKey());
  return new Response(hostedCheckoutHtml(form), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method === 'GET') return await renderCheckout(req);
    if (req.method === 'POST') return await createIntent(req);
    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    console.error('[xmoney-checkout] unhandled', error);
    if (req.method === 'GET') return errorPage('Something went wrong starting this payment.', 500);
    return json({ error: 'Could not start the payment.' }, 500);
  }
});
