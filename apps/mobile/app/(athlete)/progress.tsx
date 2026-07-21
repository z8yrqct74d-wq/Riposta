import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useTheme } from '../../src/theme/theme';
import { Text } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { db } from '../../src/lib/supabase';
import { useAthlete } from '../../src/athlete/AthleteData';
import type { Booking, LessonNote } from '@riposte/core';

const COACH_MAP: Record<string, string> = { sandu: 'C. Sandu', dina: 'L. Dina' };
type ViewMode = 'day' | 'week' | 'month';
const BAR_MAX_H = 52;

function buildDay(all: Booking[]) {
  const now = new Date();
  const out: { label: string; att: boolean; count: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now); day.setDate(now.getDate() - d); day.setHours(0, 0, 0, 0);
    const s = day.toISOString().split('T')[0];
    out.push({ label: String(day.getDate()), att: all.some((b) => b.slot_date === s && b.status !== 'cancelled'), count: 0 });
  }
  return out;
}
function buildWeek(all: Booking[]) {
  const now = new Date();
  const out: { label: string; att: boolean; count: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay() + 1 - w * 7); ws.setHours(0, 0, 0, 0);
    const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59, 999);
    const att = all.some((b) => { if (!b.slot_date || b.status === 'cancelled') return false; const d = new Date(b.slot_date + 'T12:00:00'); return d >= ws && d <= we; });
    out.push({ label: `W${12 - w}`, att, count: 0 });
  }
  return out;
}
function buildMonth(all: Booking[]) {
  const now = new Date();
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const out: { label: string; att: boolean; count: number }[] = [];
  for (let mo = 5; mo >= 0; mo--) {
    const d = new Date(now.getFullYear(), now.getMonth() - mo, 1);
    const ms = new Date(d.getFullYear(), d.getMonth(), 1);
    const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = all.filter((b) => { if (!b.slot_date || b.status === 'cancelled') return false; const bd = new Date(b.slot_date + 'T12:00:00'); return bd >= ms && bd <= me; }).length;
    out.push({ label: M[d.getMonth()], att: count > 0, count });
  }
  return out;
}

function Segmented({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: 30, padding: 3, gap: 2 }}>
      {(['day', 'week', 'month'] as ViewMode[]).map((v) => {
        const on = value === v;
        return (
          <Pressable key={v} onPress={() => onChange(v)} style={{ flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 24, backgroundColor: on ? t.colors.paper : 'transparent', borderWidth: 1, borderColor: on ? t.colors.hairline : 'transparent' }}>
            <Text size={13.5} weight={on ? '600' : '400'} color={on ? t.colors.ink : t.colors.muted} style={{ textTransform: 'capitalize' }}>{v}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProgressScreen() {
  const t = useTheme();
  const { memberId } = useAthlete();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [all, setAll] = useState<Booking[]>([]);
  const [view, setView] = useState<ViewMode>('week');

  useEffect(() => {
    if (!memberId) return;
    Promise.all([db.getBookingsForMember(memberId), db.getNotesForMember(memberId)])
      .then(([b, n]) => { setAll(b || []); setNotes(n || []); })
      .catch(() => {});
  }, [memberId]);

  const { history, attended, rate, streakLabel, periodLabel, maxCount } = useMemo(() => {
    const isMonth = view === 'month';
    const h = view === 'day' ? buildDay(all) : view === 'month' ? buildMonth(all) : buildWeek(all);
    const attended = isMonth ? h.reduce((s, m) => s + m.count, 0) : h.filter((x) => x.att).length;
    const activeCount = h.filter((x) => x.att).length;
    const rate = h.length ? Math.round(activeCount / h.length * 100) : 0;
    let streak = 0;
    for (let i = h.length - 1; i >= 0; i--) { if (h[i].att) streak++; else break; }
    const unit = view === 'day' ? 'd' : view === 'month' ? 'mo' : ' wk';
    const periodLabel = view === 'day' ? 'Last 30 days' : view === 'month' ? 'Last 6 months' : 'Last 12 weeks';
    const maxCount = Math.max(...h.map((m) => m.count), 1);
    return { history: h, attended, rate, streakLabel: streak > 0 ? `${streak}${unit}` : '—', periodLabel, maxCount };
  }, [view, all]);

  const isDay = view === 'day';
  const isMonth = view === 'month';

  const bars = history.map((item, i) => {
    const att = isMonth ? item.count > 0 : item.att;
    const barH = isMonth ? Math.max(6, Math.round(item.count / maxCount * BAR_MAX_H)) : 28;
    return (
      <View key={i} style={{ width: isDay ? 20 : undefined, flex: isDay ? undefined : 1, alignItems: 'center', gap: 3 }}>
        {isMonth && <Text size={9.5} color={t.colors.muted}>{item.count > 0 ? item.count : ''}</Text>}
        <MotiView from={{ height: 0 }} animate={{ height: barH }} style={{ width: '100%', borderRadius: 4, backgroundColor: att ? t.colors.brand : t.colors.hairline, opacity: att ? 1 : 0.45 }} />
        <Text size={9} color={t.colors.faint}>{item.label}</Text>
      </View>
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text variant="display" size={30}>Progress</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Segmented value={view} onChange={setView} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[['Attendance', `${rate}%`, t.colors.success], ['Sessions', String(attended), t.colors.ink], ['Streak', streakLabel, t.colors.steel]].map(([label, val, color]) => (
            <View key={label} style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, paddingVertical: 14, alignItems: 'center' }}>
              <Text variant="display" size={26} color={color}>{val}</Text>
              <Text color={t.colors.muted} size={11.5} style={{ marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
          <Text variant="label" color={t.colors.faint} style={{ marginBottom: 12 }}>{periodLabel}</Text>
          {isDay ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 44 }}>{bars}</View>
            </ScrollView>
          ) : (
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end', minHeight: 44 }}>{bars}</View>
          )}
        </View>

        <View>
          <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8, marginLeft: 2 }}>Coach notes</Text>
          <View style={{ gap: 10 }}>
            {notes.length === 0 ? (
              <Text color={t.colors.muted} size={13.5} style={{ textAlign: 'center', padding: 20 }}>No notes yet. Notes appear here after each lesson.</Text>
            ) : (
              notes.map((n) => {
                const dateStr = n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
                return (
                  <View key={n.id} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Icon name="sparkle" size={13} color={t.colors.steel} />
                      <Text size={11} weight="600" color={t.colors.steel} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>Focus</Text>
                      <Text size={11.5} color={t.colors.faint} style={{ marginLeft: 'auto' }}>{COACH_MAP[n.coach_id ?? ''] || n.coach_id} · {dateStr}</Text>
                    </View>
                    {n.tidied_focus ? (
                      <>
                        <Text weight="600" size={14} style={{ marginBottom: 6 }}>{n.tidied_focus}</Text>
                        <Text color={t.colors.muted} size={13} style={{ lineHeight: 20 }}>{[n.tidied_improved, n.tidied_homework].filter(Boolean).join(' ')}</Text>
                      </>
                    ) : (
                      <Text color={t.colors.muted} size={13} style={{ lineHeight: 20 }}>{n.raw_note}</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
