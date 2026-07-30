import React, { useEffect, useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/theme';
import { Text, Avatar } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { db } from '../../src/lib/supabase';
import { isoDate } from '@riposte/core';
import type { Member } from '@riposte/core';

interface Row extends Member { lastSeen: string; att: number; streak: number; }

export default function CoachAthletes() {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [athletes, setAthletes] = useState<Row[]>([]);

  useEffect(() => {
    Promise.all([db.getMembers(), db.getAllBookingsLight()]).then(([members, allBk]) => {
      const now = new Date();
      const today = isoDate(now);
      const yesterday = isoDate(new Date(now.getTime() - 86400000));
      setAthletes(members.map((m) => {
        const mb = allBk.filter((b) => b.member_id === m.id);
        const past = mb.filter((b) => (b.slot_date || '') <= today).sort((a, b) => (b.slot_date || '').localeCompare(a.slot_date || ''));
        let lastSeen = '—';
        if (past.length && past[0].slot_date) {
          const d = past[0].slot_date;
          lastSeen = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        }
        const w12ago = new Date(now); w12ago.setDate(now.getDate() - 84);
        const w12str = isoDate(w12ago);
        const recent = mb.filter((b) => (b.slot_date || '') >= w12str && (b.slot_date || '') <= today);
        const weeks = new Set(recent.map((b) => Math.floor((new Date((b.slot_date || '') + 'T12:00:00').getTime() - w12ago.getTime()) / (7 * 86400000))));
        const att = Math.round((weeks.size / 12) * 100);
        let streak = 0;
        for (let w = 0; w < 12; w++) {
          const ws = new Date(now); ws.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7); ws.setHours(0, 0, 0, 0);
          const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59, 999);
          const wsStr = isoDate(ws); const weStr = isoDate(we);
          if (mb.some((b) => (b.slot_date || '') >= wsStr && (b.slot_date || '') <= weStr)) streak++; else break;
        }
        return { ...m, lastSeen, att, streak };
      }));
    }).catch(() => {});
  }, []);

  const rows = athletes.filter((a) => (a.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <Text variant="display" size={28} style={{ marginBottom: 12 }}>Athletes</Text>
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: 12, zIndex: 1 }}><Icon name="search" size={16} color={t.colors.faint} /></View>
          <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={t.colors.faint} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.btn, paddingVertical: 9, paddingLeft: 36, paddingRight: 12, color: t.colors.ink, fontSize: 14 }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 8 }} showsVerticalScrollIndicator={false}>
        {rows.map((a) => (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 12 }}>
            <Avatar name={a.name} size={40} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text weight="600" size={14.5}>{a.name}</Text>
                {a.weapon && <WeaponGlyph type={a.weapon} size={15} color={t.colors.steel} />}
                <Text size={11.5} color={t.colors.faint}>{a.category || ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 5, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: t.colors.hairline, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${a.att}%`, backgroundColor: a.att >= 90 ? t.colors.success : a.att >= 75 ? t.colors.warning : t.colors.danger, borderRadius: 2 }} />
                  </View>
                  <Text variant="mono" size={11} color={t.colors.muted}>{a.att}%</Text>
                </View>
                {a.streak > 0 && <Text size={11} color={t.colors.steel}>{a.streak}wk streak</Text>}
                <Text size={11} color={t.colors.faint} style={{ marginLeft: 'auto' }}>Last {a.lastSeen}</Text>
              </View>
            </View>
          </View>
        ))}
        {rows.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text variant="display" size={20}>No results</Text>
            <Text color={t.colors.faint} size={13} style={{ marginTop: 4 }}>Try a different name.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
