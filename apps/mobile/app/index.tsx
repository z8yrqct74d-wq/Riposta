import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { RiposteLogo } from '../src/components/RiposteLogo';
import { useAuth } from '../src/auth/AuthProvider';

// Entry route: send the user to the right place once auth + role resolve.
export default function Index() {
  const { session, role, loading } = useAuth();

  if (loading) {
    // Normally hidden behind the native splash. Matches its navy background and
    // mark so any moment it is visible reads as the app starting, not a blank
    // screen. See `app/_layout.tsx`.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: '#0F1E38' }}>
        <RiposteLogo size={72} color="#fff" />
        <ActivityIndicator color="rgba(255,255,255,0.55)" />
      </View>
    );
  }
  if (!session) return <Redirect href="/sign-in" />;
  if (role === 'coach') return <Redirect href="/(coach)" />;
  // Admins manage the club on the web console; on mobile they fall through to
  // the athlete surface (their own athlete record, if any).
  return <Redirect href="/(athlete)" />;
}
