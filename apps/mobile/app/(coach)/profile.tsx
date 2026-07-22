import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WEAPON_LABEL } from '@riposte/core';
import { useTheme } from '../../src/theme/theme';
import { Text, Avatar } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { db } from '../../src/lib/supabase';
import { useAuth } from '../../src/auth/AuthProvider';
import { useCoach } from '../../src/coach/CoachData';

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: on ? t.colors.brand : t.colors.hairline, justifyContent: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: on ? 21 : 3 }} />
    </Pressable>
  );
}

export default function CoachProfile() {
  const t = useTheme();
  const { coach } = useCoach();
  const { signOut } = useAuth();
  const [stats, setStats] = useState({ lessons: 0, att: 0 });
  const [notifs, setNotifs] = useState(true);
  const [digest, setDigest] = useState(true);

  useEffect(() => { if (coach?.id) db.getCoachWeekStats(coach.id).then(setStats).catch(() => {}); }, [coach?.id]);

  const name = coach?.name || 'Coach';
  const email = coach?.email || '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, backgroundColor: t.colors.surface, borderBottomWidth: 1, borderBottomColor: t.colors.hairline }}>
        <Avatar name={name} size={60} />
        <View style={{ flex: 1 }}>
          <Text variant="display" size={20}>{name}</Text>
          {coach?.weapon && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <WeaponGlyph type={coach.weapon} size={16} color={t.colors.steel} />
              <Text color={t.colors.muted} size={12}>{WEAPON_LABEL[coach.weapon]}</Text>
            </View>
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 22 }} showsVerticalScrollIndicator={false}>
        <View>
          <Text variant="label" color={t.colors.faint} style={{ marginBottom: 10, marginLeft: 2 }}>This week</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[[String(stats.lessons), 'lessons'], [stats.att ? `${stats.att}%` : '—', 'attendance']].map(([v, l]) => (
              <View key={l} style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, paddingVertical: 13, alignItems: 'center' }}>
                <Text variant="display" size={22}>{v}</Text>
                <Text color={t.colors.muted} size={11.5} style={{ marginTop: 2 }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text variant="label" color={t.colors.faint} style={{ marginBottom: 10, marginLeft: 2 }}>Notifications</Text>
          <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.colors.hairline }}>
              <Text style={{ flex: 1 }} size={14}>Session reminders</Text>
              <Toggle on={notifs} onPress={() => setNotifs((v) => !v)} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
              <Text style={{ flex: 1 }} size={14}>AI digest</Text>
              <Toggle on={digest} onPress={() => setDigest((v) => !v)} />
            </View>
          </View>
        </View>

        <View>
          <Text variant="label" color={t.colors.faint} style={{ marginBottom: 10, marginLeft: 2 }}>Account</Text>
          <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.colors.hairline }}>
              <Text style={{ flex: 1 }} size={14}>Email</Text>
              <Text color={t.colors.muted} size={13.5}>{email || '—'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
              <Text style={{ flex: 1 }} size={14}>Role</Text>
              <Text color={t.colors.muted} size={13.5}>Coach</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={signOut} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
          <Icon name="lock" size={16} color={t.colors.brand} />
          <Text color={t.colors.brand} size={14} weight="600">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
