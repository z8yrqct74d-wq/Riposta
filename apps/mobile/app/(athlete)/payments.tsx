import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme/theme';
import { Text, Pill, Button } from '../../src/components/ui';
import { db } from '../../src/lib/supabase';
import { useAthlete } from '../../src/athlete/AthleteData';
import { useCardCheckout } from '../../src/athlete/useCardCheckout';
import { PAYMENT_STATUS } from '@riposte/core';
import type { Payment, Plan } from '@riposte/core';

const KIND_LABEL: Record<string, string> = { payment: 'Payment', topup: 'Top-up', refund: 'Refund' };

function paymentDate(p: Payment) {
  if (!p.created_at) return '';
  return new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** '€' for EUR, 'RON ' etc. — enough for the currencies a club actually bills in. */
const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' };

function formatAmount(amount: number, currency?: string | null): string {
  const code = (currency ?? 'EUR').toUpperCase();
  const symbol = CURRENCY_SYMBOL[code];
  return symbol ? `${symbol}${amount.toFixed(2)}` : `${amount.toFixed(2)} ${code}`;
}

export default function PaymentsScreen() {
  const t = useTheme();
  const { member, memberId, credits, refresh } = useAthlete();
  const params = useLocalSearchParams<{ intent?: string }>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    if (!memberId) return;
    const pays = await db.getPaymentsForMember(memberId).catch(() => [] as Payment[]);
    setPayments(pays);
  }, [memberId]);

  // After a card payment settles: pull the new balance and the new history row.
  const onSettled = useCallback(async () => {
    await Promise.all([refresh(), loadPayments()]);
  }, [refresh, loadPayments]);

  const { busyPlanId, outcome, clearOutcome, buy, resume } = useCardCheckout(onSettled);

  useEffect(() => {
    let cancelled = false;
    Promise.all([db.getPlans().catch(() => [] as Plan[]), memberId ? db.getPaymentsForMember(memberId).catch(() => [] as Payment[]) : Promise.resolve([] as Payment[])])
      .then(([ps, pays]) => { if (!cancelled) { setPlans(ps); setPayments(pays); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [memberId]);

  // Cold-start deep link from the payment page (`riposte://payments?intent=…`):
  // the in-app browser handed back to a fresh process, so pick the intent up
  // here instead of in the checkout hook's own await.
  const resumedIntent = useRef<string | null>(null);
  useEffect(() => {
    const intentId = typeof params.intent === 'string' ? params.intent : null;
    if (!intentId || !memberId || resumedIntent.current === intentId) return;
    resumedIntent.current = intentId;
    resume(intentId);
  }, [params.intent, memberId, resume]);

  const plan = plans.find((p) => p.name === member?.plan_name) || null;
  const payTone = PAYMENT_STATUS[member?.pay_status ?? 'paid'].tone;
  const payToneColor = ({ success: t.colors.success, warning: t.colors.warning, danger: t.colors.danger, muted: t.colors.muted } as Record<string, string>)[payTone] || t.colors.muted;
  const packages = plans.filter((p) => (p.credits ?? 0) > 0);
  const anyPayable = packages.some((p) => p.purchasable && Number(p.price_amount) > 0);

  const outcomeColor = outcome?.status === 'paid' ? t.colors.success
    : outcome?.status === 'failed' || outcome?.status === 'error' ? t.colors.danger
    : t.colors.warning;
  const outcomeTint = outcome?.status === 'paid' ? t.colors.successTint
    : outcome?.status === 'failed' || outcome?.status === 'error' ? t.colors.dangerTint
    : t.colors.warningTint;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text variant="display" size={30}>Payments</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Current plan + balance */}
        <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text variant="label" color={t.colors.faint}>Current plan</Text>
              <Text variant="display" size={22} style={{ marginTop: 4 }}>{member?.plan_name || 'No plan'}</Text>
            </View>
            <Pill label={PAYMENT_STATUS[member?.pay_status ?? 'paid'].label} tone={payTone} />
          </View>
          {plan?.price ? (
            <Text variant="mono" color={t.colors.muted} size={12.5} style={{ marginTop: 8 }}>{plan.price}{plan.credits ? ` · ${plan.credits} lesson credits` : ''}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
            <Text variant="display" size={26} color={payToneColor}>{credits}</Text>
            <Text color={t.colors.muted} size={13}>credit{credits === 1 ? '' : 's'} remaining</Text>
          </View>
        </View>

        {/* Card payment result */}
        {outcome && (
          <View
            style={{
              backgroundColor: outcomeTint,
              borderWidth: 1,
              borderColor: outcomeColor,
              borderRadius: t.radius.card,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text color={outcomeColor} size={13.5} weight="500" style={{ flex: 1 }}>{outcome.message}</Text>
            <Text color={t.colors.faint} size={13} weight="600" onPress={clearOutcome}>Dismiss</Text>
          </View>
        )}

        {/* Available packages (real plans that carry credits) */}
        {packages.length > 0 && (
          <View>
            <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8, marginLeft: 2 }}>Credit packages</Text>
            <View style={{ gap: 8 }}>
              {packages.map((p) => {
                const payable = Boolean(p.purchasable && p.price_amount && Number(p.price_amount) > 0);
                return (
                  <View key={p.id} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text weight="600" size={14.5}>{p.name}</Text>
                        {p.sub || p.description ? <Text color={t.colors.muted} size={12.5} style={{ marginTop: 2 }}>{p.sub || p.description}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {p.price ? <Text variant="mono" weight="600" size={14}>{p.price}</Text> : null}
                        <Text color={t.colors.faint} size={11.5}>{p.credits} credits</Text>
                      </View>
                    </View>
                    {payable && (
                      <Button
                        label={busyPlanId === p.id ? 'Opening…' : `Pay ${formatAmount(Number(p.price_amount), p.currency)} by card`}
                        onPress={() => buy(p)}
                        loading={busyPlanId === p.id}
                        disabled={busyPlanId !== null}
                        style={{ marginTop: 12 }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <Text color={t.colors.faint} size={12} style={{ marginTop: 10, marginLeft: 2, lineHeight: 18 }}>
              {anyPayable
                ? 'Card payments are handled by xMoney on a secure page. Credits are added as soon as the payment clears.'
                : 'To top up, speak to your club — card payments are not enabled for these packages yet.'}
            </Text>
          </View>
        )}

        {/* Payment history */}
        <View>
          <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8, marginLeft: 2 }}>History</Text>
          {loading ? (
            <Text color={t.colors.faint} size={13} style={{ textAlign: 'center', padding: 20 }}>Loading…</Text>
          ) : payments.length === 0 ? (
            <Text color={t.colors.muted} size={13.5} style={{ textAlign: 'center', padding: 20 }}>No payments yet.</Text>
          ) : (
            <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, overflow: 'hidden' }}>
              {payments.map((p, i) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: i < payments.length - 1 ? 1 : 0, borderBottomColor: t.colors.hairline }}>
                  <View style={{ flex: 1 }}>
                    <Text size={14} weight="500">{KIND_LABEL[p.kind] || p.kind}{p.note ? ` · ${p.note}` : ''}</Text>
                    <Text color={t.colors.faint} size={12} style={{ marginTop: 2 }}>{paymentDate(p)}</Text>
                  </View>
                  <Text variant="mono" size={14} weight="600" color={p.kind === 'refund' ? t.colors.danger : t.colors.ink}>
                    {p.kind === 'refund' ? '−' : ''}{Number(p.amount).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
