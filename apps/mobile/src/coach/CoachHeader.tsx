import React from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/theme';
import { Text } from '../components/ui';
import { Icon } from '../components/Icon';
import { WeaponGlyph } from '../components/WeaponGlyph';
import type { Weapon } from '@riposte/core';

export function CoachHeader({ title, sub, weapon, live }: { title: string; sub?: string; weapon?: Weapon | null; live?: boolean }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: t.colors.surface, borderBottomWidth: 1, borderBottomColor: t.colors.hairline }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: t.colors.hairline, backgroundColor: t.colors.paper, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={t.colors.ink} />
        </Pressable>
        {weapon && <WeaponGlyph type={weapon} size={24} color={t.colors.steel} />}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="display" size={21}>{title}</Text>
            {live && <Text size={10.5} weight="700" color={t.colors.live}>● LIVE</Text>}
          </View>
          {sub ? <Text variant="mono" color={t.colors.muted} size={12.5} style={{ marginTop: 1 }}>{sub}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
