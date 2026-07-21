import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/theme';
import { Text, ColorBarRow, Sheet } from '../../src/components/ui';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { db } from '../../src/lib/supabase';
import { useAthlete } from '../../src/athlete/AthleteData';
import type { Booking } from '@riposte/core';

const COACH_MAP: Record<string, string> = { sandu: 'C. Sandu', dina: 'L. Dina' };
const coachName = (b: Booking) => b.coaches?.name || COACH_MAP[b.coach_id ?? ''] || b.coach_id || 'Coach';

function bookingDayLabel(b: Booking) {
  if (!b?.slot_date) return 'Today';
  const today = new Date().toISOString().split('T')[0];
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(b.slot_date + 'T12:00:00');
  return b.slot_date === today ? 'Today' : `${DOWS[d.getDay()]} ${d.getDate()}`;
}

function canRefund(b: Booking) {
  if (!b?.slot_date || !b?.slot_time) return true;
  const [h, m] = b.slot_time.split(':').map(Number);
  const target = new Date(b.slot_date + 'T00:00:00');
  target.setHours(h, m, 0, 0);
  return target.getTime() - Date.now() > 12 * 3600 * 1000;
}

export default function ScheduleScreen() {
  const t = useTheme();
  const { upcoming, memberId, refresh } = useAthlete();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const item = upcoming.find((b) => b.id === confirmId) || null;
  const refundable = item ? canRefund(item) : false;

  const doCancel = async () => {
    if (!item) return;
    setCancelling(true);
    try {
      await db.cancelBooking(item.id);
      if (refundable && memberId) {
        const m = await db.getMember(memberId);
        if (m) await db.updateMemberCredits(memberId, (m.credits || 0) + 1);
      }
      await refresh();
    } catch { /* ignore */ }
    setCancelling(false);
    setConfirmId(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text variant="display" size={30}>Schedule</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 10 }} showsVerticalScrollIndicator={false}>
        {upcoming.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 48 }}>
            <Text variant="display" size={20}>Nothing scheduled.</Text>
            <Text color={t.colors.muted} size={13.5} style={{ marginTop: 6 }}>Book a lesson from the home screen.</Text>
          </View>
        ) : (
          upcoming.map((b) => (
            <ColorBarRow key={b.id} bar={t.colors.brand}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <WeaponGlyph type={b.weapon || 'sabre'} size={22} color={t.colors.steel} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text weight="600" size={14.5}>{coachName(b)}</Text>
                    <Text variant="label" color={t.colors.faint} size={10.5}>Lesson</Text>
                  </View>
                  <Text variant="mono" color={t.colors.muted} size={12.5} style={{ marginTop: 2 }}>{bookingDayLabel(b)} · {b.slot_time} · {b.piste || 'Riposte Main Room'}</Text>
                </View>
                <Pressable onPress={() => setConfirmId(b.id)} style={{ borderWidth: 1, borderColor: t.colors.hairline, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 }}>
                  <Text color={t.colors.muted} size={12.5} weight="600">Cancel</Text>
                </Pressable>
              </View>
            </ColorBarRow>
          ))
        )}
      </ScrollView>

      <Sheet visible={!!item} onClose={() => setConfirmId(null)} title="Cancel this lesson?">
        {item && (
          <>
            <Text color={t.colors.muted} size={13.5} style={{ lineHeight: 20, marginBottom: 18 }}>
              {coachName(item)} · {bookingDayLabel(item)} at {item.slot_time}.{' '}
              {refundable ? 'You’re outside the 12-hour window, so your credit will be refunded.' : 'You’re inside the 12-hour window, so this credit will be forfeited.'}
            </Text>
            <Pressable onPress={doCancel} disabled={cancelling} style={{ width: '100%', padding: 14, borderRadius: t.radius.btn, borderWidth: 1, borderColor: t.colors.brand, alignItems: 'center', marginBottom: 8 }}>
              <Text color={t.colors.brand} weight="600" size={15}>{cancelling ? 'Cancelling…' : refundable ? 'Cancel & refund credit' : 'Cancel & forfeit credit'}</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmId(null)} style={{ width: '100%', padding: 14, borderRadius: t.radius.btn, backgroundColor: t.colors.ink, alignItems: 'center' }}>
              <Text color={t.colors.paper} weight="600" size={15}>Keep lesson</Text>
            </Pressable>
          </>
        )}
      </Sheet>
    </SafeAreaView>
  );
}
