import React, { useState } from 'react';
import { View } from 'react-native';
import { ThemeProvider } from '../src/theme/theme';
import { Screen, Text, Button } from '../src/components/ui';
import { RiposteLogo } from '../src/components/RiposteLogo';
import { useAuth } from '../src/auth/AuthProvider';

function SignInContent() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState<null | 'athlete' | 'coach'>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (hint: 'athlete' | 'coach') => {
    setBusy(hint); setError(null);
    try {
      await signInWithGoogle(hint);
    } catch (e) {
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <RiposteLogo size={48} />
        <Text variant="display" size={28} style={{ marginTop: 12 }}>Riposte</Text>
        <Text variant="body" color="#4E6888">Book lessons. Track progress.</Text>
        {error && <Text variant="body" color="#9B2020" style={{ marginTop: 8 }}>{error}</Text>}
        <View style={{ alignSelf: 'stretch', marginTop: 28, gap: 10 }}>
          <Button label="Continue as athlete" onPress={() => go('athlete')} loading={busy === 'athlete'} />
          <Button label="I'm a coach" variant="secondary" onPress={() => go('coach')} loading={busy === 'coach'} />
        </View>
        <Text variant="body" size={12} color="#7A90A8" style={{ marginTop: 16, textAlign: 'center' }}>
          Signs you in with Google.
        </Text>
      </View>
    </Screen>
  );
}

export default function SignIn() {
  return (
    <ThemeProvider role="athlete">
      <SignInContent />
    </ThemeProvider>
  );
}
