import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/theme';
import { Text } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { db } from '../../src/lib/supabase';
import { useCoach } from '../../src/coach/CoachData';
import type { CoachItem } from '../../src/coach/CoachData';
import { isoDate } from '@riposte/core';
import type { CalendarBlock, Booking, Weapon } from '@riposte/core';

type CView = 'Day' | 'Week' | 'Month';
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const todayDow = () => (new Date().getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
function slotStatus(startMin: number, durMin: number) {
  const nm = nowMin();
  if (nm >= startMin + durMin) return 'done';
  if (nm >= startMin) return 'live';
  return 'future';
}
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}
function scopedToCoach(b: CalendarBlock, coachId: string | null) {
  return b.coach === coachId || b.coach === null;
}

function buildDayItems(blocks: CalendarBlock[], bookings: Booking[], todayStr: string, coachId: string | null): CoachItem[] {
  const blockItems: CoachItem[] = blocks.filter((b) => b.date === todayStr && scopedToCoach(b, coachId)).map((b) => (
    { id: b.id, blockId: b.id, t: minToTime(b.start), startMin: b.start, durMin: b.dur, type: b.kind || 'group', title: b.title, who: b.piste || 'Main Room', weapon: b.weapon, piste: b.piste }
  ));
  const lessonItems: CoachItem[] = (bookings || []).filter((bk) => bk.slot_date === todayStr).map((bk) => {
    const [h, m] = (bk.slot_time || '0:0').split(':').map(Number);
    const startMin = h * 60 + m;
    const mb = bk.members;
    return {
      id: bk.id, bookingId: bk.id, memberId: bk.member_id, t: (bk.slot_time || '').slice(0, 5), startMin, durMin: 45, type: 'lesson',
      title: mb?.name || 'Athlete',
      who: [mb?.weapon && mb.weapon[0].toUpperCase() + mb.weapon.slice(1), mb?.category].filter(Boolean).join(' · '),
      weapon: (mb?.weapon as Weapon) || 'foil', piste: bk.piste || 'Main Room',
      memberCredits: mb?.credits, memberCat: mb?.category, memberName: mb?.name,
    };
  });
  const all = [...blockItems, ...lessonItems].sort((a, b) => a.startMin - b.startMin);
  let nextSet = false;
  return all.map((item) => {
    const base = slotStatus(item.startMin, item.durMin);
    let status: string;
    if (base === 'future') { status = nextSet ? 'upcoming' : 'next'; nextSet = true; } else status = base;
    return { ...item, status, live: status === 'live' };
  });
}

interface WeekDay { dow: string; dom: number; today: boolean; items: { id: string; type: 'lesson' | 'group' | 'open'; title: string | null; t: string; weapon?: Weapon | null; status: string | null }[]; }
function buildWeekGrid(blocks: CalendarBlock[], bookings: Booking[], weekStart: string, todayStr: string, coachId: string | null): WeekDay[] {
  const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return LABELS.map((dow, di) => {
    const dateStr = addDays(weekStart, di);
    const isToday = dateStr === todayStr;
    const blockItems = blocks.filter((b) => b.date === dateStr && scopedToCoach(b, coachId)).map((b) => (
      { id: b.id, type: b.kind || 'group', title: b.title, t: minToTime(b.start), weapon: b.weapon, status: isToday ? slotStatus(b.start, b.dur) : null }
    ));
    const lessonItems = bookings.filter((bk) => bk.slot_date === dateStr).map((bk) => {
      const [h, m] = (bk.slot_time || '0:0').split(':').map(Number);
      return { id: bk.id, type: 'lesson' as const, title: bk.members?.name || 'Athlete', t: (bk.slot_time || '').slice(0, 5), weapon: (bk.members?.weapon as Weapon) || null, status: isToday ? slotStatus(h * 60 + m, 45) : null };
    });
    const items = [...blockItems, ...lessonItems].sort((a, b) => a.t.localeCompare(b.t));
    return { dow, dom: Number(dateStr.split('-')[2]), items, today: isToday };
  });
}

function buildMonthGrid(blocks: CalendarBlock[], bookings: Booking[], monthStart: string, monthEnd: string, coachId: string | null): Record<number, { type: 'lesson' | 'group' | 'open'; title: string | null }[]> {
  const [y, m] = monthStart.split('-').map(Number);
  const daysInMonth = Number(monthEnd.split('-')[2]);
  const result: Record<number, { type: 'lesson' | 'group' | 'open'; title: string | null }[]> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const blockSessions = blocks.filter((b) => b.date === dateStr && scopedToCoach(b, coachId)).map((b) => ({ type: b.kind || 'group', title: b.title }));
    const lessonSessions = bookings.filter((bk) => bk.slot_date === dateStr).map((bk) => ({ type: 'lesson' as const, title: bk.members?.name || 'Athlete' }));
    const sessions = [...blockSessions, ...lessonSessions];
    if (sessions.length) result[d] = sessions;
  }
  return result;
}

function ViewSwitcher({ view, onChange }: { view: CView; onChange: (v: CView) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.colors.elevated, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: 999, padding: 3 }}>
      {(['Day', 'Week', 'Month'] as CView[]).map((o) => {
        const on = view === o;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={{ borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: on ? t.colors.brand : 'transparent' }}>
            <Text size={13} weight="600" color={on ? '#fff' : t.colors.muted}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatusTag({ status }: { status?: string }) {
  const t = useTheme();
  if (status === 'done') return <Text size={10.5} weight="700" color={t.colors.muted} style={{ textTransform: 'uppercase' }}>Done</Text>;
  if (status === 'live') return <Text size={10.5} weight="700" color={t.colors.live} style={{ textTransform: 'uppercase' }}>● Live</Text>;
  if (status === 'next') return <Text size={10.5} weight="700" color={t.colors.brand} style={{ textTransform: 'uppercase', backgroundColor: t.colors.brandTint, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, overflow: 'hidden' }}>Up next</Text>;
  return null;
}

export default function MyDay() {
  const t = useTheme();
  const router = useRouter();
  const { coach, setSelected } = useCoach();
  const [view, setView] = useState<CView>('Day');
  const [dayItems, setDayItems] = useState<CoachItem[]>([]);
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [monthData, setMonthData] = useState<Record<number, { type: 'lesson' | 'group' | 'open'; title: string | null }[]>>({});
  const [selDay, setSelDay] = useState(new Date().getDate());

  const today = new Date();
  const todayStr = isoDate(today);
  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const weekStart = addDays(todayStr, -todayDow());
  const weekEnd = addDays(weekStart, 6);
  const monthStart = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthEnd = isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const rangeFrom = weekStart < monthStart ? weekStart : monthStart;
  const rangeTo = weekEnd > monthEnd ? weekEnd : monthEnd;
  const coachId = coach?.id ?? null;

  const CKIND: Record<string, string> = { lesson: t.colors.brand, group: t.colors.steel, open: t.colors.hairline };

  useEffect(() => {
    Promise.all([db.getCalendarBlocks(rangeFrom, rangeTo), coachId ? db.getBookingsForCoachInRange(coachId, rangeFrom, rangeTo) : Promise.resolve([])])
      .then(([blocks, bookings]) => {
        setDayItems(buildDayItems(blocks, bookings, todayStr, coachId));
        setWeekData(buildWeekGrid(blocks, bookings, weekStart, todayStr, coachId));
        setMonthData(buildMonthGrid(blocks, bookings, monthStart, monthEnd, coachId));
      })
      .catch(() => {});
  }, [coachId, rangeFrom, rangeTo]);

  const open = (it: CoachItem) => { setSelected(it); router.push(it.type === 'lesson' ? '/lesson' : '/session'); };

  const sessions = dayItems.length;
  const lessons = dayItems.filter((i) => i.type === 'lesson').length;
  const live = dayItems.filter((i) => i.live).length;

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const firstDow = (new Date(today.getFullYear(), today.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <Text color={t.colors.muted} size={13}>{todayLabel}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text variant="display" size={28}>My day</Text>
          <ViewSwitcher view={view} onChange={setView} />
        </View>
        {view === 'Day' && (
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
            <Text><Text variant="display" size={22}>{sessions}</Text><Text color={t.colors.muted} size={12.5}> sessions</Text></Text>
            <Text><Text variant="display" size={22}>{lessons}</Text><Text color={t.colors.muted} size={12.5}> lessons</Text></Text>
            <Text><Text variant="display" size={22} color={live > 0 ? t.colors.live : t.colors.ink}>{live}</Text><Text color={t.colors.muted} size={12.5}> live</Text></Text>
          </View>
        )}
      </View>

      {view === 'Day' && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 8 }} showsVerticalScrollIndicator={false}>
          {dayItems.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 60 }}>
              <Text variant="display" size={20}>Nothing scheduled</Text>
              <Text color={t.colors.faint} size={13} style={{ marginTop: 6 }}>No sessions or lessons for today.</Text>
            </View>
          ) : dayItems.map((it) => (
            <Pressable key={it.id} onPress={() => open(it)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderLeftWidth: 3, borderLeftColor: it.status === 'done' ? t.colors.hairline : (CKIND[it.type] || t.colors.brand), borderRadius: t.radius.card, padding: 13, opacity: it.status === 'done' ? 0.55 : 1 }}>
              <View style={{ width: 44, alignItems: 'center' }}>
                <Text variant="mono" size={15} weight="600">{it.t}</Text>
                <Text size={10} color={t.colors.faint} style={{ textTransform: 'uppercase' }}>{it.type}</Text>
              </View>
              <WeaponGlyph type={it.weapon || 'foil'} size={22} color={t.colors.steel} />
              <View style={{ flex: 1 }}>
                <Text weight="600" size={14.5}>{it.title}</Text>
                <Text color={t.colors.muted} size={12} style={{ marginTop: 2 }}>{it.who}{it.who && it.piste ? ' · ' : ''}{it.piste}</Text>
              </View>
              <StatusTag status={it.status} />
              <Icon name="chevR" size={18} color={t.colors.faint} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {view === 'Week' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, padding: 16, minWidth: 520 }}>
            {weekData.map((d) => (
              <View key={d.dow} style={{ width: 68, gap: 6 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text size={10.5} weight="600" color={d.today ? t.colors.brand : t.colors.faint} style={{ textTransform: 'uppercase' }}>{d.dow}</Text>
                  <View style={{ width: 28, height: 28, borderRadius: 14, marginTop: 3, backgroundColor: d.today ? t.colors.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    <Text size={14} weight={d.today ? '700' : '500'} color={d.today ? '#fff' : t.colors.ink}>{d.dom}</Text>
                  </View>
                </View>
                <View style={{ gap: 4 }}>
                  {d.items.length === 0 ? (
                    <View style={{ height: 48, borderRadius: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.hairline, opacity: 0.4 }} />
                  ) : d.items.map((it) => (
                    <Pressable key={it.id} disabled={!d.today} style={{ backgroundColor: t.colors.surface, borderLeftWidth: 3, borderLeftColor: CKIND[it.type] || t.colors.brand, borderRadius: 4, padding: 6, opacity: it.status === 'done' ? 0.45 : 1 }}>
                      <Text size={11} weight="600" numberOfLines={1}>{it.title}</Text>
                      <Text variant="mono" size={10} color={t.colors.faint}>{it.t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {view === 'Month' && (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} size={10.5} weight="600" color={t.colors.faint} style={{ flex: 1, textAlign: 'center', paddingVertical: 6 }}>{d}</Text>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
              const sessions = monthData[d] || [];
              const isToday = d === today.getDate();
              const isSel = d === selDay;
              return (
                <Pressable key={d} onPress={() => setSelDay(d)} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel ? t.colors.brand : isToday ? t.colors.brandTint : 'transparent' }}>
                    <Text size={13.5} weight={isToday || isSel ? '700' : '400'} color={isSel ? '#fff' : isToday ? t.colors.brand : t.colors.ink}>{d}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {sessions.slice(0, 3).map((s, si) => <View key={si} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSel ? 'rgba(255,255,255,0.7)' : (CKIND[s.type] || t.colors.steel) }} />)}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={{ paddingHorizontal: 4, paddingTop: 14 }}>
            <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8 }}>{selDay === today.getDate() ? `Today · ${selDay} ${MONTH_NAMES[today.getMonth()]}` : `${selDay} ${MONTH_NAMES[today.getMonth()]}`}</Text>
            {(monthData[selDay] || []).length === 0 ? (
              <Text color={t.colors.faint} size={13} style={{ paddingVertical: 20, textAlign: 'center' }}>No sessions</Text>
            ) : (monthData[selDay] || []).map((s, i) => (
              <View key={i} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderLeftWidth: 3, borderLeftColor: CKIND[s.type] || t.colors.brand, borderRadius: 4, padding: 10, marginBottom: 7 }}>
                <Text size={13} weight="500">{s.title || (s.type === 'group' ? 'Group session' : s.type === 'lesson' ? 'Lesson slot' : 'Open fencing')}<Text color={t.colors.muted} size={12} style={{ textTransform: 'capitalize' }}>  {s.type}</Text></Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
