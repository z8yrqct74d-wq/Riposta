import React from 'react';
import { View } from 'react-native';
import { Screen, Text, Card, Button, Pill } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useAuth } from '../../src/auth/AuthProvider';

// Placeholder athlete home — Phase 3 rebuilds the full surface (home, booking,
// schedule, progress, check-in, profile).
export default function AthleteHome() {
  const { session, coachPending, signOut } = useAuth();
  const email = session?.user?.email ?? '';

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Icon name="home" size={22} color="#1C2A44" />
        <Text variant="display" size={24}>Athlete</Text>
      </View>

      {coachPending && (
        <Card style={{ marginBottom: 12 }}>
          <Text variant="label" color="#B5791A">Coach access pending</Text>
          <Text style={{ marginTop: 4 }}>Your coach account isn’t linked yet. An admin adds your email in the console; meanwhile you can use the athlete app.</Text>
        </Card>
      )}

      <Card>
        <Text variant="label">Signed in as</Text>
        <Text style={{ marginTop: 4 }}>{email}</Text>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Pill label="Athlete" tone="brand" />
        </View>
      </Card>

      <Text variant="body" color="#7A90A8" style={{ marginTop: 16 }}>
        Phase 2 scaffold. The full athlete surface (booking, schedule, progress,
        check-in, profile) arrives in Phase 3.
      </Text>

      <Button label="Sign out" variant="secondary" onPress={signOut} style={{ marginTop: 20 }} />
    </Screen>
  );
}
