// Shared settlement path for the two endpoints xMoney calls back on:
// `xmoney-webhook` (server-to-server IPN) and `xmoney-return` (the browser's
// backUrl). Both may fire for the same payment, in either order — the
// `settle_xmoney_payment` SQL function makes that safe.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { assertSecretKey, decryptNotification, type XMoneyNotification } from './xmoney.ts';

/** Service-role client: bypasses RLS, the only thing allowed to move credits. */
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
  return createClient(url, key, { auth: { persistSession: false } });
}

export const secretKey = (): string => assertSecretKey(Deno.env.get('XMONEY_SECRET_KEY'));

export interface SettlementResult {
  intentId: string | null;
  status: 'paid' | 'failed' | 'pending' | 'refunded' | 'unknown';
  notification: XMoneyNotification | null;
  error?: string;
}

/**
 * Decrypts a notification and settles the intent it refers to.
 *
 * `fallbackIntentId` covers the backUrl case where decryption fails but the
 * URL still tells us which intent the user was paying for — enough to show
 * them something honest, while the IPN settles the money.
 */
export async function settleNotification(
  encryptedPayload: string | null,
  fallbackIntentId: string | null = null,
): Promise<SettlementResult> {
  if (!encryptedPayload) {
    return { intentId: fallbackIntentId, status: 'unknown', notification: null, error: 'missing opensslResult' };
  }

  let notification: XMoneyNotification;
  try {
    notification = decryptNotification(encryptedPayload, secretKey());
  } catch (error) {
    console.error('[xmoney] decryption failed', error);
    return { intentId: fallbackIntentId, status: 'unknown', notification: null, error: 'decryption failed' };
  }

  // `externalOrderId` is the intent id we sent as `order.orderId`.
  const intentId = notification.externalOrderId ?? fallbackIntentId;
  if (!intentId) {
    return { intentId: null, status: 'unknown', notification, error: 'no externalOrderId in payload' };
  }

  const { data, error } = await serviceClient().rpc('settle_xmoney_payment', {
    p_intent_id: intentId,
    p_transaction_status: notification.transactionStatus,
    p_transaction_id: notification.transactionId != null ? String(notification.transactionId) : null,
    p_order_id: notification.orderId != null ? String(notification.orderId) : null,
    p_amount: notification.amount ?? null,
    p_currency: notification.currency ?? null,
    p_payload: notification,
  });

  if (error) {
    console.error('[xmoney] settle_xmoney_payment failed', { intentId, error });
    return { intentId, status: 'unknown', notification, error: error.message };
  }

  const result = (data ?? {}) as { ok?: boolean; status?: string; reason?: string };
  console.log('[xmoney] settled', {
    intentId,
    transactionStatus: notification.transactionStatus,
    result,
  });

  return {
    intentId,
    status: (result.status as SettlementResult['status']) ?? 'unknown',
    notification,
    error: result.ok === false ? result.reason : undefined,
  };
}
