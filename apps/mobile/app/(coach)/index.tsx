import React from 'react';
import { View } from 'react-native';
import { Screen, Text, Card, Button, Pill } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useAuth } from '../../src/auth/AuthProvider';

// Placeholder coach home (dark theme) — Phase 4 rebuilds MyDay, roster,
// availability, and the session/attendance flows.
export default function CoachHome() {
  const { session, resolution, signOut } = useAuth();
  const email = session?.user?.email ?? '';
  const coachName = resolution?.coach?.name ?? email;

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Icon name="calendar" size={22} color="#C9A252" />
        <Text variant="display" size={24}>My day</Text>
      </View>

      <Card>
        <Text variant="label">Signed in as</Text>
        <Text style={{ marginTop: 4 }}>{coachName}</Text>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Pill label="Coach" tone="brand" />
        </View>
      </Card>

      <Text variant="body" color="#8BA0BC" style={{ marginTop: 16 }}>
        Phase 2 scaffold. The full coach surface (MyDay, roster, availability,
        session attendance) arrives in Phase 4.
      </Text>

      <Button label="Sign out" variant="secondary" onPress={signOut} style={{ marginTop: 20 }} />
    </Screen>
  );
}
