import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ThemeProvider } from '../../src/theme/theme';
import { useAuth } from '../../src/auth/AuthProvider';

export default function AthleteLayout() {
  const { session, loading } = useAuth();
  if (!loading && !session) return <Redirect href="/sign-in" />;
  return (
    <ThemeProvider role="athlete">
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
