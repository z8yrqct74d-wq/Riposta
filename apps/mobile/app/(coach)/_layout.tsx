import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { ThemeProvider } from '../../src/theme/theme';
import { useAuth } from '../../src/auth/AuthProvider';

export default function CoachLayout() {
  const { session, loading } = useAuth();
  if (!loading && !session) return <Redirect href="/sign-in" />;
  return (
    <ThemeProvider role="coach">
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
