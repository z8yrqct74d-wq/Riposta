import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/theme/theme';
import { Text, Pill } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';

// Payments is gated behind a "coming soon" frosted overlay (as on web):
// dummy content sits underneath a BlurView with the notice card on top.
export default function PaymentsScreen() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ flex: 1 }}>
        <ScrollView style={{ opacity: 0.55 }} contentContainerStyle={{ padding: 16, paddingTop: 12, gap: 14 }} scrollEnabled={false} showsVerticalScrollIndicator={false}>
          <Text variant="display" size={30} style={{ marginBottom: 4 }}>Payments</Text>
          <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text variant="label" color={t.colors.faint}>Current plan</Text>
                <Text variant="display" size={22} style={{ marginTop: 4 }}>Competitor · Monthly</Text>
              </View>
              <Pill label="Paid" tone="success" />
            </View>
            <Text variant="mono" color={t.colors.muted} size={12.5} style={{ marginTop: 8 }}>Renews 1 Jul · €120/mo · 6 lesson credits</Text>
          </View>
          <View style={{ backgroundColor: t.colors.ink, borderRadius: t.radius.card, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text color="#fff" weight="600" size={15}>Buy a lesson package</Text>
              <Text color="rgba(255,255,255,0.6)" size={12.5} style={{ marginTop: 2 }}>5 / 10 / 20 credits · save up to 15%</Text>
            </View>
            <Icon name="chevR" size={20} color="rgba(255,255,255,0.5)" />
          </View>
        </ScrollView>

        <BlurView intensity={40} tint={t.name === 'dark' ? 'dark' : 'light'} style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 300 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.colors.brandTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon name="card" size={28} color={t.colors.brand} strokeWidth={1.6} />
            </View>
            <View style={{ marginBottom: 16 }}><Pill label="Coming soon" tone="warning" /></View>
            <Text variant="display" size={22}>Payments</Text>
            <Text color={t.colors.muted} size={13.5} style={{ marginTop: 10, textAlign: 'center', lineHeight: 21 }}>
              We're setting up secure payments. Fees, lesson credits, and invoices will all live here.
            </Text>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}
