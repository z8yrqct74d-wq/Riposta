import React from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen, Text, Button } from '../../src/components/ui';

// Placeholder — ported in Phase 4 (chunk 4c: CoachSession).
export default function LessonScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text variant="display" size={24}>Lesson</Text>
        <Text color="#8BA0BC">Coming in the next Phase 4 chunk.</Text>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
