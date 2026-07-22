import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../../src/theme/theme';
import { CoachDataProvider } from '../../src/coach/CoachData';
import { Icon } from '../../src/components/Icon';
import type { IconName } from '../../src/components/Icon';
import { Text } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthProvider';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'My day', icon: 'calendar' },
  athletes: { label: 'Athletes', icon: 'users' },
  availability: { label: 'Availability', icon: 'clock' },
  profile: { label: 'Profile', icon: 'user' },
};

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

function BlurTabBar({ state, navigation }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <BlurView intensity={40} tint="dark" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.hairline, backgroundColor: t.colors.tabBarBg, paddingBottom: insets.bottom || 12 }}>
      <View style={{ flexDirection: 'row', paddingTop: 8, paddingHorizontal: 4 }}>
        {state.routes.filter((r) => TABS[r.name]).map((route) => {
          const cfg = TABS[route.name];
          const idx = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === idx;
          const color = focused ? t.colors.brand : t.colors.faint;
          return (
            <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 }}>
              <Icon name={cfg.icon} size={22} color={color} strokeWidth={focused ? 2 : 1.6} />
              <Text size={10.5} weight={focused ? '600' : '500'} color={color}>{cfg.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}

export default function CoachLayout() {
  const { session, loading } = useAuth();
  if (!loading && !session) return <Redirect href="/sign-in" />;
  return (
    <ThemeProvider role="coach">
      <CoachDataProvider>
        <Tabs tabBar={(props) => <BlurTabBar {...(props as unknown as TabBarProps)} />} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="athletes" />
          <Tabs.Screen name="availability" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="session" options={{ href: null }} />
          <Tabs.Screen name="lesson" options={{ href: null }} />
        </Tabs>
      </CoachDataProvider>
    </ThemeProvider>
  );
}
