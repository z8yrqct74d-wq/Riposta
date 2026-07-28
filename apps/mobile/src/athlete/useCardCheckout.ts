// Card checkout (xMoney) for the athlete app.
//
// The device never touches card data or the xMoney secret: it asks the
// `xmoney-checkout` Edge Function for a URL, opens it in the system's auth
// browser, and waits for the intent to settle. The `xmoney-webhook` function
// is what actually grants credits, so "did it work?" is answered by polling
// the intent — never by whatever the browser came back with.
import { useCallback, useRef, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { db } from '../lib/supabase';
import type { Plan, PaymentIntent } from '@riposte/core';

/** Must match the server's `XMONEY_APP_RETURN_URL` (default `riposte://payments`). */
export const CHECKOUT_RETURN_URL = AuthSession.makeRedirectUri({ scheme: 'riposte', path: 'payments' });

export type CheckoutStatus = 'paid' | 'failed' | 'pending' | 'canceled' | 'error';

export interface CheckoutOutcome {
  status: CheckoutStatus;
  message: string;
  credits?: number;
}

const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1500;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const OUTCOME: Record<string, (intent: PaymentIntent) => CheckoutOutcome> = {
  paid: (intent) => ({
    status: 'paid',
    credits: intent.credits,
    message: intent.credits > 0
      ? `Payment complete — ${intent.credits} credit${intent.credits === 1 ? '' : 's'} added.`
      : 'Payment complete.',
  }),
  failed: (intent) => ({
    status: 'failed',
    message: intent.error_message
      ? 'Payment was not completed.'
      : 'Payment was not completed. Your card has not been charged.',
  }),
  refunded: () => ({ status: 'failed', message: 'This payment was refunded.' }),
  canceled: () => ({ status: 'canceled', message: 'Payment canceled.' }),
};

/**
 * Polls an intent until it leaves `pending`. Returns null if it's still
 * pending when we give up — a real state (bank still processing), not an
 * error, so callers say "still processing" rather than "failed".
 */
export async function waitForSettlement(
  intentId: string,
  attempts = POLL_ATTEMPTS,
): Promise<PaymentIntent | null> {
  for (let i = 0; i < attempts; i += 1) {
    const intent = await db.getPaymentIntent(intentId).catch(() => null);
    if (intent && intent.status !== 'pending') return intent;
    if (i < attempts - 1) await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

export function outcomeFor(intent: PaymentIntent | null): CheckoutOutcome {
  if (!intent) {
    return { status: 'pending', message: 'Payment is still processing. Your balance will update shortly.' };
  }
  return (OUTCOME[intent.status] ?? OUTCOME.failed)(intent);
}

export interface UseCardCheckout {
  /** Plan id currently being paid for, or null. Drives per-row spinners. */
  busyPlanId: string | null;
  outcome: CheckoutOutcome | null;
  clearOutcome: () => void;
  buy: (plan: Plan) => Promise<CheckoutOutcome>;
  /** Resume an intent we were handed by a deep link (app was cold-started). */
  resume: (intentId: string) => Promise<CheckoutOutcome>;
}

export function useCardCheckout(onSettled?: () => void | Promise<void>): UseCardCheckout {
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CheckoutOutcome | null>(null);
  const inFlight = useRef(false);

  const finish = useCallback(async (result: CheckoutOutcome): Promise<CheckoutOutcome> => {
    setOutcome(result);
    if (result.status === 'paid' || result.status === 'pending') await onSettled?.();
    return result;
  }, [onSettled]);

  const buy = useCallback(async (plan: Plan): Promise<CheckoutOutcome> => {
    if (inFlight.current) return { status: 'pending', message: 'A payment is already in progress.' };
    inFlight.current = true;
    setBusyPlanId(plan.id);
    setOutcome(null);
    try {
      const checkout = await db.startCardPayment(plan.id);
      const browser = await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, CHECKOUT_RETURN_URL);

      // `dismiss`/`cancel` only means the browser closed — the payment may
      // still have gone through before the user swiped it away, so poll
      // either way, just less patiently.
      const settled = await waitForSettlement(
        checkout.intentId,
        browser.type === 'success' ? POLL_ATTEMPTS : 3,
      );
      if (!settled && browser.type !== 'success') {
        return await finish({ status: 'canceled', message: 'Payment canceled.' });
      }
      return await finish(outcomeFor(settled));
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Could not start the payment.';
      return await finish({ status: 'error', message });
    } finally {
      inFlight.current = false;
      setBusyPlanId(null);
    }
  }, [finish]);

  const resume = useCallback(async (intentId: string): Promise<CheckoutOutcome> => {
    setOutcome(null);
    const settled = await waitForSettlement(intentId, 6);
    return await finish(outcomeFor(settled));
  }, [finish]);

  return { busyPlanId, outcome, clearOutcome: () => setOutcome(null), buy, resume };
}
