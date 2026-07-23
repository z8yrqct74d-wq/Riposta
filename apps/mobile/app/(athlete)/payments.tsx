import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/theme';
import { Text, Pill } from '../../src/components/ui';
import { db } from '../../src/lib/supabase';
import { useAthlete } from '../../src/athlete/AthleteData';
import { PAYMENT_STATUS } from '@riposte/core';
import type { Payment, Plan } from '@riposte/core';

const KIND_LABEL: Record<string, string> = { payment: 'Payment', topup: 'Top-up', refund: 'Refund' };

function paymentDate(p: Payment) {
  if (!p.created_at) return '';
  return new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentsScreen() {
  const t = useTheme();
  const { member, memberId, credits } = useAthlete();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([db.getPlans().catch(() => [] as Plan[]), memberId ? db.getPaymentsForMember(memberId).catch(() => [] as Payment[]) : Promise.resolve([] as Payment[])])
      .then(([ps, pays]) => { if (!cancelled) { setPlans(ps); setPayments(pays); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [memberId]);

  const plan = plans.find((p) => p.name === member?.plan_name) || null;
  const payTone = PAYMENT_STATUS[member?.pay_status ?? 'paid'].tone;
  const payToneColor = ({ success: t.colors.success, warning: t.colors.warning, danger: t.colors.danger, muted: t.colors.muted } as Record<string, string>)[payTone] || t.colors.muted;
  const packages = plans.filter((p) => (p.credits ?? 0) > 0);

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

        {/* Available packages (real plans that carry credits) */}
        {packages.length > 0 && (
          <View>
            <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8, marginLeft: 2 }}>Credit packages</Text>
            <View style={{ gap: 8 }}>
              {packages.map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text weight="600" size={14.5}>{p.name}</Text>
                    {p.sub || p.description ? <Text color={t.colors.muted} size={12.5} style={{ marginTop: 2 }}>{p.sub || p.description}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {p.price ? <Text variant="mono" weight="600" size={14}>{p.price}</Text> : null}
                    <Text color={t.colors.faint} size={11.5}>{p.credits} credits</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text color={t.colors.faint} size={12} style={{ marginTop: 10, marginLeft: 2, lineHeight: 18 }}>
              To top up, speak to your club — in-app card payments are being set up.
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
