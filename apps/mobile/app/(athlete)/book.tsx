import React from 'react';
import { useRouter } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Screen, Text, Button } from '../../src/components/ui';

// Placeholder — ported in Phase 3 (chunk 3b: booking flow).
export default function BookScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text variant="display" size={24}>Book</Text>
        <Text color="#7A90A8">Coming in the next Phase 3 chunk.</Text>
        <Button label="Close" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
