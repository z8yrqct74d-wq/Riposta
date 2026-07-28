import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../../src/theme/theme';
import { AthleteDataProvider } from '../../src/athlete/AthleteData';
import { Icon } from '../../src/components/Icon';
import type { IconName } from '../../src/components/Icon';
import { Text } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthProvider';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  schedule: { label: 'Schedule', icon: 'calendar' },
  payments: { label: 'Pay', icon: 'card' },
  progress: { label: 'Progress', icon: 'chart' },
  profile: { label: 'Profile', icon: 'user' },
};

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

function BlurTabBar({ state, navigation }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Routes outside TABS (book, checkin) are full-screen flows with their own
  // sticky action button. The bar floats over the content, so it would sit on
  // top of that button — hide it entirely while one of them is focused.
  if (!TABS[state.routes[state.index]?.name]) return null;
  return (
    <BlurView
      intensity={40}
      tint={t.name === 'dark' ? 'dark' : 'light'}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.hairline, backgroundColor: t.colors.tabBarBg, paddingBottom: insets.bottom || 12 }}
    >
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

export default function AthleteLayout() {
  const { session, role, loading } = useAuth();
  if (!loading && !session) return <Redirect href="/sign-in" />;
  // The entry route may have sent us here optimistically (cached role, or the
  // role lookup still in flight). Correct course once the real role lands.
  if (role === 'coach') return <Redirect href="/(coach)" />;
  return (
    <ThemeProvider role="athlete">
      <AthleteDataProvider>
        <Tabs tabBar={(props) => <BlurTabBar {...(props as unknown as TabBarProps)} />} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="schedule" />
          <Tabs.Screen name="payments" />
          <Tabs.Screen name="progress" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="book" options={{ href: null }} />
          <Tabs.Screen name="checkin" options={{ href: null }} />
        </Tabs>
      </AthleteDataProvider>
    </ThemeProvider>
  );
}
