import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCore } from '@riposte/core';

// Native app: persist the session in AsyncStorage, disable URL parsing
// (the OAuth deep link is handled manually via exchangeCodeForSession), and
// use the PKCE flow required for native OAuth.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const { supabase, db, auth } = createCore({
  url,
  anonKey,
  storage: AsyncStorage,
  detectSessionInUrl: false,
  flowType: 'pkce',
});
