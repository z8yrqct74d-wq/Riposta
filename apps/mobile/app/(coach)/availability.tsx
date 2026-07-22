import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AVAIL_DAYS, AVAIL_SLOTS } from '@riposte/core';
import { useTheme } from '../../src/theme/theme';
import { Text } from '../../src/components/ui';
import { db } from '../../src/lib/supabase';
import { useCoach } from '../../src/coach/CoachData';

export default function Availability() {
  const t = useTheme();
  const { coach } = useCoach();
  const [grid, setGrid] = useState<Record<string, boolean>>(() => {
    const g: Record<string, boolean> = {};
    AVAIL_DAYS.forEach((d) => AVAIL_SLOTS.forEach((s) => { g[`${d}|${s}`] = true; }));
    return g;
  });
  const [blackout, setBlackout] = useState<Record<string, boolean>>({});
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror the latest values + a save-pending flag in refs so the unmount
  // cleanup below (which only fires once, with a stale closure otherwise)
  // can flush the last edit instead of just dropping it.
  const latest = useRef({ grid, blackout, coachId: coach?.id, pending: false });
  latest.current.grid = grid;
  latest.current.blackout = blackout;
  latest.current.coachId = coach?.id;

  useEffect(() => {
    if (!coach?.id) return;
    const av = coach.availability_json;
    if (av?.slots && Object.keys(av.slots).length > 0) setGrid(av.slots);
    if (av?.blackout) setBlackout(av.blackout);
    ready.current = true;
  }, [coach?.id]);

  useEffect(() => {
    if (!ready.current || !coach?.id) return;
    if (timer.current) clearTimeout(timer.current);
    latest.current.pending = true;
    timer.current = setTimeout(() => {
      latest.current.pending = false;
      db.updateCoachAvailability(coach.id, { slots: grid, blackout }).catch(() => {});
    }, 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [grid, blackout, coach?.id]);

  // Flush a still-pending debounced save on unmount (e.g. sign-out or
  // navigating away right after a toggle) instead of silently losing it.
  useEffect(() => {
    return () => {
      if (latest.current.pending && latest.current.coachId) {
        db.updateCoachAvailability(latest.current.coachId, { slots: latest.current.grid, blackout: latest.current.blackout }).catch(() => {});
      }
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Text variant="display" size={30}>Availability</Text>
          <Text color={t.colors.muted} size={13} style={{ marginTop: 4 }}>Tap a slot to toggle. Saved automatically.</Text>
        </View>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <View style={{ width: 44 }} />
            {AVAIL_DAYS.map((d) => (
              <Text key={d} size={11.5} weight="600" color={blackout[d] ? t.colors.danger : t.colors.muted} style={{ flex: 1, textAlign: 'center' }}>{d}</Text>
            ))}
          </View>
          {AVAIL_SLOTS.map((s) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text variant="mono" size={10.5} color={t.colors.faint} style={{ width: 44, textAlign: 'right', paddingRight: 6 }}>{s}</Text>
              {AVAIL_DAYS.map((d) => {
                const key = `${d}|${s}`;
                const on = grid[key] && !blackout[d];
                return (
                  <View key={key} style={{ flex: 1, paddingHorizontal: 2 }}>
                    <Pressable disabled={blackout[d]} onPress={() => setGrid((g) => ({ ...g, [key]: !g[key] }))} style={{ aspectRatio: 1, borderRadius: 6, borderWidth: 1, borderColor: on ? t.colors.brand : t.colors.hairline, backgroundColor: blackout[d] ? t.colors.hairline : on ? t.colors.brand : t.colors.surface, opacity: blackout[d] ? 0.4 : 1 }} />
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ marginTop: 22 }}>
            <Text variant="label" color={t.colors.faint} style={{ marginBottom: 10 }}>Blackout days</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AVAIL_DAYS.map((d) => {
                const on = blackout[d];
                return (
                  <Pressable key={d} onPress={() => setBlackout((b) => ({ ...b, [d]: !b[d] }))} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: on ? t.colors.danger : t.colors.hairline, backgroundColor: on ? t.colors.dangerTint : t.colors.surface }}>
                    <Text size={13} weight="600" color={on ? t.colors.danger : t.colors.muted}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
