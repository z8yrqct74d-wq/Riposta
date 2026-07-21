import { createCore } from '@riposte/core';

// Web app: persist the session in localStorage and let supabase-js parse the
// OAuth redirect off the URL. (Mobile injects AsyncStorage + PKCE instead.)
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surface misconfiguration early rather than as opaque 401s later.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

export const { supabase, db, auth } = createCore({
  url,
  anonKey,
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  detectSessionInUrl: true,
});
