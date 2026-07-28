-- Run in Supabase Dashboard → SQL Editor → New query
-- =============================================================
-- Card payments via xMoney (hosted checkout).
--
-- Adds the pieces the payment flow needs on top of `plans` / `payments`:
--   1. a real *numeric* price on plans (the existing `price` is a display
--      string like '€120/mo', which can't be charged),
--   2. `payment_intents` — one row per checkout attempt, the record the
--      xMoney webhook settles against,
--   3. `settle_xmoney_payment()` — the single, atomic, idempotent settlement
--      path. Both the server-to-server webhook and the browser return URL
--      call it; whichever arrives first does the work, the other no-ops.
--
-- Nothing here trusts the client: `payment_intents` is read-only to members
-- (RLS below) and the settlement function is executable by `service_role`
-- only, i.e. exclusively by the Edge Functions in supabase/functions/.
-- =============================================================

-- ── Plans: chargeable price ──────────────────────────────────
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS price_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency     text    NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS purchasable  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN plans.price_amount IS 'Amount actually charged. `price` stays a display string.';
COMMENT ON COLUMN plans.purchasable  IS 'Offered for in-app card payment. Admin-controlled.';

-- Backfill the amount from the display string: '€120/mo' → 120.00,
-- '€18/session' → 18.00. Rows that carry no digits are left NULL.
UPDATE plans
   SET price_amount = replace(
         regexp_replace(price, '^[^0-9]*([0-9]+([.,][0-9]+)?).*$', '\1'), ',', '.')::numeric
 WHERE price_amount IS NULL
   AND price ~ '[0-9]';

-- Only genuinely one-off items are switched on: the checkout charges once
-- (`purchase` / `authAndCapture`), so a price quoted per period or per session
-- ('€120/mo', '€18/session') would be billed as a single payment and quietly
-- misrepresent what the athlete is buying. Those stay off until an admin opts
-- them in from Plans & settings.
UPDATE plans
   SET purchasable = true
 WHERE credits > 0
   AND price_amount IS NOT NULL
   AND price_amount > 0
   AND price !~ '/';

-- ── Payments: provider provenance + idempotency key ──────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider     text,
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS intent_id    uuid;

COMMENT ON COLUMN payments.provider_ref IS 'Provider-side id (xMoney transaction id), unique per provider — the idempotency key for webhook replays.';

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_ref_uniq
  ON payments (provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

-- ── Payment intents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_intents (
  id                    uuid primary key default gen_random_uuid(),
  member_id             uuid not null references members(id) on delete cascade,
  plan_id               text references plans(id) on delete set null,
  description           text,
  amount                numeric(10,2) not null,
  currency              text not null default 'EUR',
  credits               int  not null default 0,
  -- pending | paid | failed | canceled | refunded
  status                text not null default 'pending',
  provider              text not null default 'xmoney',
  -- Single-use token that lets the (cookie-less) system browser fetch the
  -- hosted-checkout form without carrying the user's Supabase JWT in a URL.
  checkout_token        text unique,
  token_expires_at      timestamptz,
  token_used_at         timestamptz,
  xmoney_order_id       text,
  xmoney_transaction_id text,
  transaction_status    text,
  last_payload          jsonb,
  error_message         text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  settled_at            timestamptz
);

CREATE INDEX IF NOT EXISTS payment_intents_member_idx
  ON payment_intents (member_id, created_at DESC);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Members read their own intents (the app polls one after checkout);
-- admins read all. Nobody writes from a client — only `service_role`,
-- which bypasses RLS, via the Edge Functions.
DROP POLICY IF EXISTS payment_intents_select ON payment_intents;
CREATE POLICY payment_intents_select ON payment_intents FOR SELECT
  USING (member_id = public.current_member_id() OR public.is_admin());

-- ── Settlement ───────────────────────────────────────────────
-- Called with the decrypted xMoney notification. Locks the intent, so a
-- webhook and a browser return racing each other settle exactly once.
--
-- Returns { ok, status, already_settled, reason } as jsonb.
CREATE OR REPLACE FUNCTION public.settle_xmoney_payment(
  p_intent_id          uuid,
  p_transaction_status text,
  p_transaction_id     text    DEFAULT NULL,
  p_order_id           text    DEFAULT NULL,
  p_amount             numeric DEFAULT NULL,
  p_currency           text    DEFAULT NULL,
  p_payload            jsonb   DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_intent  payment_intents%ROWTYPE;
  v_kind    text;
  v_credits int;
BEGIN
  SELECT * INTO v_intent FROM payment_intents WHERE id = p_intent_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'intent_not_found');
  END IF;

  -- ── Success ────────────────────────────────────────────────
  IF p_transaction_status = 'complete-ok' THEN
    -- Never credit an amount that doesn't match what we asked for. A
    -- mismatch means the payload was tampered with or points elsewhere.
    IF (p_amount IS NOT NULL AND round(p_amount, 2) <> round(v_intent.amount, 2))
       OR (p_currency IS NOT NULL AND upper(p_currency) <> upper(v_intent.currency)) THEN
      UPDATE payment_intents
         SET status = 'failed', transaction_status = p_transaction_status,
             error_message = format('amount/currency mismatch: got %s %s, expected %s %s',
                                    p_amount, p_currency, v_intent.amount, v_intent.currency),
             last_payload = COALESCE(p_payload, last_payload), updated_at = now()
       WHERE id = p_intent_id;
      RETURN jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
    END IF;

    IF v_intent.status IN ('paid', 'refunded') THEN
      RETURN jsonb_build_object('ok', true, 'status', v_intent.status, 'already_settled', true);
    END IF;

    v_kind := CASE WHEN v_intent.credits > 0 THEN 'topup' ELSE 'payment' END;

    INSERT INTO payments (member_id, amount, kind, note, status, credits_delta,
                          provider, provider_ref, intent_id)
    VALUES (v_intent.member_id, v_intent.amount, v_kind,
            COALESCE(v_intent.description, 'Card payment'), 'paid', v_intent.credits,
            v_intent.provider,
            COALESCE(p_transaction_id, v_intent.xmoney_transaction_id), v_intent.id)
    ON CONFLICT (provider, provider_ref) WHERE provider_ref IS NOT NULL DO NOTHING;

    IF v_intent.credits > 0 THEN
      UPDATE members SET credits = COALESCE(credits, 0) + v_intent.credits
       WHERE id = v_intent.member_id;
    END IF;

    -- A settled card payment clears an outstanding balance flag.
    UPDATE members SET pay_status = 'paid'
     WHERE id = v_intent.member_id AND pay_status IN ('due', 'overdue');

    UPDATE payment_intents
       SET status = 'paid', transaction_status = p_transaction_status,
           xmoney_transaction_id = COALESCE(p_transaction_id, xmoney_transaction_id),
           xmoney_order_id       = COALESCE(p_order_id, xmoney_order_id),
           last_payload = COALESCE(p_payload, last_payload),
           settled_at = now(), updated_at = now()
     WHERE id = p_intent_id;

    RETURN jsonb_build_object('ok', true, 'status', 'paid', 'already_settled', false);
  END IF;

  -- ── Refund / void of an already-settled intent ─────────────
  IF p_transaction_status IN ('refund-ok', 'void-ok') THEN
    IF v_intent.status <> 'paid' THEN
      RETURN jsonb_build_object('ok', true, 'status', v_intent.status, 'already_settled', true);
    END IF;

    INSERT INTO payments (member_id, amount, kind, note, status, credits_delta,
                          provider, provider_ref, intent_id)
    VALUES (v_intent.member_id, v_intent.amount, 'refund',
            COALESCE(v_intent.description, 'Card payment'), 'refunded', -v_intent.credits,
            v_intent.provider,
            COALESCE(p_transaction_id, v_intent.xmoney_transaction_id) || ':' || p_transaction_status,
            v_intent.id)
    ON CONFLICT (provider, provider_ref) WHERE provider_ref IS NOT NULL DO NOTHING;

    IF v_intent.credits > 0 THEN
      SELECT GREATEST(0, COALESCE(credits, 0) - v_intent.credits) INTO v_credits
        FROM members WHERE id = v_intent.member_id;
      UPDATE members SET credits = v_credits WHERE id = v_intent.member_id;
    END IF;

    UPDATE payment_intents
       SET status = 'refunded', transaction_status = p_transaction_status,
           last_payload = COALESCE(p_payload, last_payload), updated_at = now()
     WHERE id = p_intent_id;

    RETURN jsonb_build_object('ok', true, 'status', 'refunded', 'already_settled', false);
  END IF;

  -- ── Still in flight (start / in-progress / 3d-pending) ─────
  IF p_transaction_status IN ('start', 'in-progress', '3d-pending') THEN
    UPDATE payment_intents
       SET transaction_status = p_transaction_status,
           xmoney_transaction_id = COALESCE(p_transaction_id, xmoney_transaction_id),
           xmoney_order_id       = COALESCE(p_order_id, xmoney_order_id),
           last_payload = COALESCE(p_payload, last_payload), updated_at = now()
     WHERE id = p_intent_id AND status = 'pending';
    RETURN jsonb_build_object('ok', true, 'status', 'pending', 'already_settled', false);
  END IF;

  -- ── Anything else is a failure ─────────────────────────────
  IF v_intent.status = 'pending' THEN
    UPDATE payment_intents
       SET status = 'failed', transaction_status = p_transaction_status,
           xmoney_transaction_id = COALESCE(p_transaction_id, xmoney_transaction_id),
           xmoney_order_id       = COALESCE(p_order_id, xmoney_order_id),
           last_payload = COALESCE(p_payload, last_payload), updated_at = now()
     WHERE id = p_intent_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', 'failed', 'already_settled', v_intent.status <> 'pending');
END $$;

-- Edge Functions only. A SECURITY DEFINER function that moves money must not
-- be reachable with an anon/authenticated token.
REVOKE ALL ON FUNCTION public.settle_xmoney_payment(uuid, text, text, text, numeric, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_xmoney_payment(uuid, text, text, text, numeric, text, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_xmoney_payment(uuid, text, text, text, numeric, text, jsonb) TO service_role;
