import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/theme';
import { Text, Avatar, Button, Sheet } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { CoachHeader } from '../../src/coach/CoachHeader';
import { db } from '../../src/lib/supabase';
import { useCoach } from '../../src/coach/CoachData';
import type { Member, AttendanceStatus, Weapon } from '@riposte/core';

interface RosterMember { id: string; name: string; category?: string | null; weapon?: Weapon | null; dropin?: boolean; }

function AttToggle({ value, onChange }: { value?: AttendanceStatus; onChange: (v: AttendanceStatus) => void }) {
  const t = useTheme();
  const states: { id: AttendanceStatus; label: string; color: string }[] = [
    { id: 'present', label: 'Present', color: t.colors.success },
    { id: 'late', label: 'Late', color: t.colors.warning },
    { id: 'absent', label: 'Absent', color: t.colors.muted },
  ];
  const idx = states.findIndex((s) => s.id === value);
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const segW = w > 0 ? (w - 6) / states.length : 0;
  useEffect(() => { x.value = withTiming(idx < 0 ? 0 : idx * segW, { duration: 220 }); }, [idx, segW]);
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: idx < 0 ? 0 : 1 }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', backgroundColor: t.colors.elevated, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: 999, padding: 3, position: 'relative' }}>
      {segW > 0 && idx >= 0 && (
        <Animated.View style={[{ position: 'absolute', top: 3, bottom: 3, left: 3, width: segW, borderRadius: 999, backgroundColor: states[idx].color }, pillStyle]} />
      )}
      {states.map((s) => {
        const on = s.id === value;
        return (
          <Pressable key={s.id} onPress={() => onChange(s.id)} style={{ flex: 1, paddingVertical: 7, alignItems: 'center' }}>
            <Text size={11.5} weight="600" color={on ? (s.id === 'absent' ? t.colors.ink : '#fff') : t.colors.muted}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SessionAttendance() {
  const t = useTheme();
  const router = useRouter();
  const { selected: item } = useCoach();
  const [att, setAtt] = useState<Record<string, AttendanceStatus>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [dropIns, setDropIns] = useState<RosterMember[]>([]);
  const [sheet, setSheet] = useState(false);
  const [dropName, setDropName] = useState('');
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allMembers, existing] = await Promise.all([db.getMembers(), item?.blockId ? db.getSessionAttendance(item.blockId, today) : Promise.resolve([])]);
        if (cancelled) return;
        const existingAtt: Record<string, AttendanceStatus> = {};
        (existing || []).forEach((r) => { if (r.member_id) existingAtt[r.member_id] = r.status; });
        setMembers(allMembers || []);
        setAtt(existingAtt);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [item?.blockId]);

  const addDropIn = () => {
    const name = dropName.trim();
    if (!name) return;
    const id = `dropin_${Date.now()}`;
    setDropIns((d) => [...d, { id, name, category: 'Drop-in', weapon: 'foil', dropin: true }]);
    setAtt((a) => ({ ...a, [id]: 'present' }));
    setDropName(''); setSheet(false);
  };

  const done = async () => {
    if (!item?.blockId) { router.back(); return; }
    setSaving(true);
    try {
      await Promise.all(members.filter((m) => att[m.id]).map((m) => db.upsertSessionAttendance({ block_id: item.blockId!, session_date: today, member_id: m.id, status: att[m.id], is_dropin: false })));
    } catch { /* ignore */ }
    setSaving(false);
    router.back();
  };

  const roster: RosterMember[] = [...members, ...dropIns];
  const marked = Object.keys(att).length;
  const sub = item ? `${item.t}${item.piste ? ` · Piste ${item.piste}` : ''} · ${item.durMin} min` : '';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <CoachHeader title={item?.title || 'Session'} sub={sub} weapon={item?.weapon} live={item?.live} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 }}>
        <Text color={t.colors.muted} size={12.5}>{marked} of {roster.length} marked</Text>
        <Pressable onPress={() => setSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 }}>
          <Icon name="plus" size={14} color={t.colors.ink} /><Text size={12.5} weight="600">Drop-in</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}>
        {roster.map((p) => (
          <View key={p.id} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar name={p.name} size={34} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text weight="600" size={14}>{p.name}</Text>
                  {p.weapon && <WeaponGlyph type={p.weapon} size={15} color={t.colors.steel} />}
                </View>
                <Text size={11.5} color={t.colors.faint} style={{ marginTop: 1 }}>{p.category}</Text>
              </View>
              {p.dropin && <Text size={10} weight="600" color={t.colors.steel} style={{ backgroundColor: t.colors.steelTint, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999, overflow: 'hidden' }}>NEW</Text>}
            </View>
            <AttToggle value={att[p.id]} onChange={(v) => setAtt((a) => ({ ...a, [p.id]: v }))} />
          </View>
        ))}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: t.colors.hairline, backgroundColor: t.colors.surface }}>
        <Button label={saving ? 'Saving…' : `Done · ${marked} marked`} onPress={done} disabled={saving} />
      </View>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Add a drop-in">
        <TextInput value={dropName} onChangeText={setDropName} placeholder="Athlete name" placeholderTextColor={t.colors.faint} style={{ borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.btn, backgroundColor: t.colors.paper, padding: 12, color: t.colors.ink, fontSize: 15, marginBottom: 14 }} />
        <Button label="Add to roster" onPress={addDropIn} disabled={!dropName.trim()} />
      </Sheet>
    </View>
  );
}
