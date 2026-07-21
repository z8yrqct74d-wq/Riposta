import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { useTheme } from '../../src/theme/theme';
import { Text, Avatar } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { db } from '../../src/lib/supabase';
import { useAthlete } from '../../src/athlete/AthleteData';
import type { Coach, Weapon } from '@riposte/core';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Weekly availability by day-of-week (1=Mon … 6=Sat).
const COACH_SCHEDULE: Record<string, Record<number, { t: string; piste: string }[]>> = {
  sandu: {
    1: [{ t: '18:00', piste: 'Riposte Main Room' }, { t: '18:45', piste: 'Riposte Main Room' }],
    4: [{ t: '18:00', piste: 'Riposte Main Room' }, { t: '18:45', piste: 'Riposte Main Room' }],
    5: [{ t: '17:00', piste: 'Riposte Main Room' }, { t: '17:45', piste: 'Riposte Main Room' }],
    6: [{ t: '10:00', piste: 'Riposte Main Room' }, { t: '10:45', piste: 'Riposte Main Room' }],
  },
  dina: {
    2: [{ t: '18:30', piste: 'Riposte Main Room' }],
    4: [{ t: '19:30', piste: 'Riposte Main Room' }],
    5: [{ t: '17:00', piste: 'Riposte Main Room' }, { t: '17:45', piste: 'Riposte Main Room' }],
    6: [{ t: '11:30', piste: 'Riposte Main Room' }, { t: '12:15', piste: 'Riposte Main Room' }],
  },
};

interface Day { id: string; dow: string; dom: string; label?: string; date: string; dayOfWeek: number; }
interface UICoach { id: string; name: string; short: string; weapons: Weapon[]; maitre: boolean; blurb: string; next: string; }

function buildDays(): Day[] {
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const days: Day[] = [];
  let offset = 0;
  while (days.length < 7) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    if (d.getDay() !== 0) {
      days.push({ id: `d${offset}`, dow: DOWS[d.getDay()], dom: String(d.getDate()), label: offset === 0 ? 'Today' : undefined, date: d.toISOString().split('T')[0], dayOfWeek: d.getDay() });
    }
    offset++;
  }
  return days;
}

function coachShort(name: string) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : name;
}

function mapDbCoach(c: Pick<Coach, 'id' | 'name' | 'weapon' | 'maitre' | 'blurb'>, days: Day[]): UICoach {
  const sched = COACH_SCHEDULE[c.id] || {};
  const nextDay = days.find((d) => (sched[d.dayOfWeek] || []).length > 0);
  const nextSlot = nextDay ? (sched[nextDay.dayOfWeek] || [])[0] : null;
  const next = nextDay && nextSlot ? `${nextDay.label || nextDay.dow + ' ' + nextDay.dom} ${nextSlot.t}` : '';
  return { id: c.id, name: c.name, short: coachShort(c.name), weapons: c.weapon ? [c.weapon] : ['sabre'], maitre: c.maitre || false, blurb: c.blurb || '', next };
}

function buildSlots(ids: string[], days: Day[]) {
  const s: Record<string, { t: string; piste: string }[]> = {};
  for (const id of ids) {
    const sched = COACH_SCHEDULE[id] || {};
    for (const day of days) {
      const daySlots = sched[day.dayOfWeek] || [];
      if (daySlots.length) s[`${id}|${day.id}`] = daySlots;
    }
  }
  return s;
}

const DAYS = buildDays();
const FALLBACK = [
  { id: 'sandu', name: 'Constantin Sandu', weapon: 'sabre' as Weapon, maitre: true, blurb: 'Sabre · technique' },
  { id: 'dina', name: 'Lucian Dina', weapon: 'sabre' as Weapon, maitre: false, blurb: 'Sabre · footwork & tactics' },
];

function StepDots({ step }: { step: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 4, borderRadius: 2, width: i === step ? 20 : 6, backgroundColor: i <= step ? t.colors.brand : t.colors.hairline }} />
      ))}
    </View>
  );
}

function MaitrePill() {
  const t = useTheme();
  return <Text size={10.5} weight="600" color={t.colors.steel} style={{ backgroundColor: t.colors.steelTint, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999, overflow: 'hidden', textTransform: 'uppercase', letterSpacing: 0.4 }}>Maître</Text>;
}

function SuccessRing({ size = 96 }: { size?: number }) {
  const t = useTheme();
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = useSharedValue(c);
  useEffect(() => { offset.value = withDelay(120, withTiming(0, { duration: 360 })); }, []);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }], position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.colors.successTint} strokeWidth={4} />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.colors.success} strokeWidth={4} strokeLinecap="round" strokeDasharray={c} animatedProps={animatedProps} />
      </Svg>
      <Icon name="check" size={40} color={t.colors.success} strokeWidth={2.4} />
    </View>
  );
}

function PrimaryBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: '100%', padding: 14, borderRadius: t.radius.btn, backgroundColor: disabled ? t.colors.hairline : t.colors.brand, alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
      <Text color={disabled ? t.colors.faint : '#fff'} weight="600" size={15}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.hairline }}>
      <Text color={t.colors.muted} size={13}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{typeof value === 'string' ? <Text weight="500" size={14}>{value}</Text> : value}</View>
    </View>
  );
}

export default function BookFlow() {
  const t = useTheme();
  const router = useRouter();
  const pager = useRef<PagerView>(null);
  const { credits, book } = useAthlete();
  const [step, setStep] = useState(0);
  const [coaches, setCoaches] = useState<UICoach[]>(() => FALLBACK.map((c) => mapDbCoach(c, DAYS)));
  const [slots, setSlots] = useState(() => buildSlots(FALLBACK.map((c) => c.id), DAYS));
  const [coachId, setCoachId] = useState<string | null>(null);
  const [dayId, setDayId] = useState(DAYS[0]?.id || 'd0');
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    db.getCoaches().then((data) => {
      if (!data?.length) return;
      setCoaches(data.map((c) => mapDbCoach(c, DAYS)));
      setSlots(buildSlots(data.map((c) => c.id), DAYS));
    }).catch(() => {});
  }, []);

  const go = (s: number) => { setStep(s); pager.current?.setPage(s); };
  const coach = coaches.find((c) => c.id === coachId) || null;
  const daySlots = slots[`${coachId}|${dayId}`] || [];
  const day = DAYS.find((d) => d.id === dayId) || null;
  const slot = slotIdx != null ? daySlots[slotIdx] : null;

  const confirm = async () => {
    setConfirming(true);
    await book({ coachId, date: day?.date, time: slot?.t, piste: slot?.piste, weapon: coach?.weapons[0] || 'sabre' });
    setBooked(true);
  };

  const headers = ['Pick a coach', 'Choose a time', 'Confirm'];

  if (booked && coach && slot) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <SuccessRing />
        <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} delay={360} style={{ alignItems: 'center', maxWidth: 270, marginTop: 22 }}>
          <Text variant="display" size={30}>You're booked.</Text>
          <Text color={t.colors.muted} size={14} style={{ marginTop: 10, textAlign: 'center', lineHeight: 21 }}>
            {coach.short} · {day?.label || day?.dow + ' ' + day?.dom} at {slot.t}, {slot.piste}. We'll remind you an hour before.
          </Text>
        </MotiView>
        <View style={{ marginTop: 28, width: '100%', maxWidth: 280 }}>
          <PrimaryBtn label="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => (step === 0 ? router.back() : go(step - 1))} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.colors.hairline, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={step === 0 ? 'x' : 'chevL'} size={18} color={t.colors.ink} />
          </Pressable>
          <StepDots step={step} />
          <View style={{ width: 36 }} />
        </View>
        <View>
          <Text variant="label" color={t.colors.faint}>Step {step + 1} of 3</Text>
          <Text variant="display" size={26} style={{ marginTop: 2 }}>{headers[step]}</Text>
        </View>
      </View>

      <PagerView ref={pager} style={{ flex: 1 }} initialPage={0} scrollEnabled={false} onPageSelected={(e) => setStep(e.nativeEvent.position)}>
        {/* Step 1 · coach */}
        <View key="coach">
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
            {coaches.map((c) => {
              const sel = coachId === c.id;
              return (
                <Pressable key={c.id} onPress={() => { setCoachId(c.id); setSlotIdx(null); setTimeout(() => go(1), 120); }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: sel ? t.colors.brandTint : t.colors.surface, borderWidth: 1, borderColor: sel ? t.colors.brand : t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
                  <Avatar name={c.short} size={46} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text weight="600" size={15}>{c.short}</Text>
                      {c.maitre && <MaitrePill />}
                    </View>
                    <Text color={t.colors.muted} size={12.5} style={{ marginTop: 3 }}>{c.blurb}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 4 }}>{c.weapons.map((w) => <WeaponGlyph key={w} type={w} size={20} color={t.colors.steel} />)}</View>
                    <Text variant="mono" color={t.colors.faint} size={11}>{c.next}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Step 2 · time */}
        <View key="time">
          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {coach && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Avatar name={coach.short} size={34} />
                <Text weight="600" size={14}>{coach.short}</Text>
                {coach.maitre && <MaitrePill />}
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 18 }}>
              {DAYS.map((d) => {
                const has = (slots[`${coachId}|${d.id}`] || []).length > 0;
                const sel = dayId === d.id;
                return (
                  <Pressable key={d.id} disabled={!has} onPress={() => { setDayId(d.id); setSlotIdx(null); }} style={{ width: 52, paddingVertical: 8, backgroundColor: sel ? t.colors.ink : t.colors.surface, borderWidth: 1, borderColor: sel ? t.colors.ink : t.colors.hairline, borderRadius: t.radius.btn, opacity: has ? 1 : 0.4, alignItems: 'center', gap: 2 }}>
                    <Text size={11} color={sel ? 'rgba(255,255,255,0.7)' : t.colors.faint}>{d.label || d.dow}</Text>
                    <Text size={17} weight="600" color={sel ? '#fff' : t.colors.ink}>{d.dom}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {daySlots.length > 0 ? (
              <>
                <Text color={t.colors.faint} size={12} style={{ marginBottom: 10 }}>{day?.label || `${day?.dow} ${day?.dom}`} · {daySlots.length} open</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {daySlots.map((s, i) => {
                    const sel = slotIdx === i;
                    return (
                      <Pressable key={i} onPress={() => setSlotIdx(i)} style={{ width: '47%', backgroundColor: sel ? t.colors.brand : t.colors.surface, borderWidth: 1, borderColor: sel ? t.colors.brand : t.colors.hairline, borderRadius: t.radius.btn, padding: 11, gap: 2 }}>
                        <Text variant="mono" size={16} weight="600" color={sel ? '#fff' : t.colors.ink}>{s.t}</Text>
                        <Text size={11.5} color={sel ? 'rgba(255,255,255,0.8)' : t.colors.faint}>{s.piste}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text variant="display" size={18}>No open slots</Text>
                <Text color={t.colors.muted} size={13} style={{ marginTop: 4 }}>Try another day.</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Step 3 · confirm */}
        <View key="confirm">
          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {coach && slot && (
              <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, overflow: 'hidden' }}>
                <SummaryRow label="Coach" value={coach.short} />
                <SummaryRow label="Weapon" value={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><WeaponGlyph type={coach.weapons[0] || 'sabre'} size={18} color={t.colors.steel} /><Text weight="500" size={14} style={{ textTransform: 'capitalize' }}>{coach.weapons[0] || 'sabre'}</Text></View>} />
                <SummaryRow label="When" value={`${day?.label || day?.dow + ' ' + day?.dom} · ${slot.t}`} />
                <SummaryRow label="Piste" value={slot.piste} />
                <SummaryRow label="Length" value="45 min" />
                <SummaryRow label="Cost" value={<Text color={t.colors.brand} weight="600" size={14}>1 credit</Text>} last />
              </View>
            )}
            <View style={{ marginTop: 16, padding: 14, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text color={t.colors.muted} size={13}>Your balance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="mono" size={18} weight="600">{credits}</Text>
                <Text color={t.colors.faint} size={12}>credits</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </PagerView>

      {step === 1 && (
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: t.colors.hairline, backgroundColor: t.colors.surface }}>
          <PrimaryBtn label={slotIdx == null ? 'Select a time' : 'Continue'} disabled={slotIdx == null} onPress={() => go(2)} />
        </View>
      )}
      {step === 2 && (
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: t.colors.hairline, backgroundColor: t.colors.surface }}>
          <PrimaryBtn label={confirming ? 'Booking…' : 'Confirm — use 1 credit'} disabled={confirming} onPress={confirm} />
        </View>
      )}
    </SafeAreaView>
  );
}
