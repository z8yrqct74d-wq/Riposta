import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PAYMENT_STATUS, isoDate } from '@riposte/core';
import type { Booking } from '@riposte/core';
import { useTheme } from '../../src/theme/theme';
import { Text, Pill, ColorBarRow } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { useAuth } from '../../src/auth/AuthProvider';
import { useAthlete } from '../../src/athlete/AthleteData';

function coachShortName(fullName?: string | null) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : fullName;
}

function bookingDayLabel(b: Booking) {
  if (!b?.slot_date) return 'Today';
  const today = isoDate();
  const tomorrow = isoDate(new Date(Date.now() + 86400000));
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(b.slot_date + 'T12:00:00');
  if (b.slot_date === today) return 'Today';
  if (b.slot_date === tomorrow) return 'Tomorrow';
  return `${DOWS[d.getDay()]} ${d.getDate()}`;
}

function timeUntil(b: Booking) {
  if (!b?.slot_date || !b?.slot_time) return null;
  const [h, m] = b.slot_time.split(':').map(Number);
  const target = new Date(b.slot_date + 'T00:00:00');
  target.setHours(h, m, 0, 0);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours === 0) return `${mins}m`;
  return `${hours}h`;
}

function CreditMeter({ total, left }: { total: number; left: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: i < left ? t.colors.brand : t.colors.hairline }} />
      ))}
    </View>
  );
}

function AlertChip({ tone, icon, label, onPress }: { tone: 'warning' | 'danger'; icon: 'clock' | 'money'; label: string; onPress: () => void }) {
  const t = useTheme();
  const [fg, bg] = tone === 'danger' ? [t.colors.danger, t.colors.dangerTint] : [t.colors.warning, t.colors.warningTint];
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: bg, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 }}>
      <Icon name={icon} size={14} color={fg} />
      <Text color={fg} size={12.5} weight="500">{label}</Text>
    </Pressable>
  );
}

export default function AthleteHome() {
  const t = useTheme();
  const router = useRouter();
  const { session, coachPending } = useAuth();
  const { member, credits, upcoming } = useAthlete();

  const firstName = ((session?.user?.user_metadata?.full_name as string | undefined) || member?.name || '').split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const nextLesson = upcoming[0] ?? null;
  const showCert = member?.visa_status === 'expiring' || member?.visa_status === 'expired';
  const showPay = member?.pay_status === 'due' || member?.pay_status === 'overdue';
  const creditTotal = Math.max(credits, 1);
  const payTone = PAYMENT_STATUS[member?.pay_status ?? 'paid'].tone;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {coachPending && (
          <View style={{ margin: 16, marginBottom: 0, flexDirection: 'row', gap: 11, backgroundColor: t.colors.steelTint, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 13 }}>
            <Icon name="alertCircle" size={18} color={t.colors.steel} />
            <View style={{ flex: 1 }}>
              <Text weight="600" size={13.5}>Coach access not set up yet</Text>
              <Text color={t.colors.muted} size={12.5} style={{ marginTop: 2, lineHeight: 18 }}>You're signed in as an athlete. Ask your club admin to add you as a coach.</Text>
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text color={t.colors.muted} size={13}>{todayLabel}</Text>
            <Text variant="display" size={30} style={{ marginTop: 4, lineHeight: 34 }}>{greeting},{'\n'}{firstName}.</Text>
          </View>
          <Pressable onPress={() => router.push('/checkin')} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: t.colors.hairline, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="qr" size={20} color={t.colors.ink} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 14 }}>
          {(showCert || showPay) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {showCert && <AlertChip tone="warning" icon="clock" label={member?.visa_status === 'expired' ? 'Certificate expired' : 'Certificate expires soon'} onPress={() => router.push('/profile')} />}
              {showPay && <AlertChip tone="danger" icon="money" label={member?.pay_status === 'overdue' ? 'Payment overdue' : 'Payment due'} onPress={() => router.push('/payments')} />}
            </View>
          )}

          {nextLesson ? (
            <ColorBarRow bar={t.colors.brand}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="label" color={t.colors.brand}>Next · {bookingDayLabel(nextLesson)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <WeaponGlyph type={nextLesson.weapon || 'sabre'} size={22} color={t.colors.steel} />
                    <Text weight="600" size={16}>Lesson · {coachShortName(nextLesson.coaches?.name || nextLesson.coach_id || '')}</Text>
                  </View>
                  <Text variant="mono" color={t.colors.muted} size={13} style={{ marginTop: 4 }}>{nextLesson.slot_time} · {nextLesson.piste || 'Riposte Main Room'} · 45 min</Text>
                </View>
                {timeUntil(nextLesson) && (
                  <View style={{ alignItems: 'center', paddingLeft: 8 }}>
                    <Text variant="display" size={28} style={{ lineHeight: 30 }}>{timeUntil(nextLesson)}</Text>
                    <Text color={t.colors.faint} size={11}>away</Text>
                  </View>
                )}
              </View>
            </ColorBarRow>
          ) : (
            <ColorBarRow bar={t.colors.hairline}>
              <Text color={t.colors.muted} size={14}>No upcoming lessons</Text>
              <Text color={t.colors.faint} size={12.5} style={{ marginTop: 2 }}>Book your next session below</Text>
            </ColorBarRow>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1.3, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <Text color={t.colors.muted} size={12.5}>Lesson credits</Text>
                <Text variant="mono" weight="600" size={18}>{credits}<Text variant="mono" color={t.colors.faint} size={12}>/{creditTotal}</Text></Text>
              </View>
              <CreditMeter total={creditTotal} left={credits} />
            </View>
            <View style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14, justifyContent: 'space-between' }}>
              <Text color={t.colors.muted} size={12.5}>Account</Text>
              <View style={{ marginTop: 8 }}><Pill label={PAYMENT_STATUS[member?.pay_status ?? 'paid'].label} tone={payTone} /></View>
            </View>
          </View>

          <Pressable onPress={() => router.push('/book')} style={{ backgroundColor: t.colors.brand, borderRadius: t.radius.card, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text color="#fff" weight="600" size={16}>Book a lesson</Text>
              <Text color="rgba(255,255,255,0.85)" size={12.5} style={{ marginTop: 2 }}>Pick a coach & a free piste</Text>
            </View>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} color="#fff" />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
