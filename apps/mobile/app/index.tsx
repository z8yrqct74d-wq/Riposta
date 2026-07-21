import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';

// Entry route: send the user to the right place once auth + role resolve.
export default function Index() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F6FB' }}>
        <ActivityIndicator color="#1C2A44" />
      </View>
    );
  }
  if (!session) return <Redirect href="/sign-in" />;
  if (role === 'coach') return <Redirect href="/(coach)" />;
  // Admins manage the club on the web console; on mobile they fall through to
  // the athlete surface (their own athlete record, if any).
  return <Redirect href="/(athlete)" />;
}
