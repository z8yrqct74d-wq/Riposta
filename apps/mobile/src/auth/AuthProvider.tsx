import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import type { Role, RoleResolution } from '@riposte/core';
import { supabase, auth, db } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/notifications';

// Finalises any in-flight auth session when the app regains focus (web/dev).
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  role: Role | null;
  resolution: RoleResolution | null;
  loading: boolean;
  /** Athlete signed in after choosing "coach" — coach access not yet granted. */
  coachPending: boolean;
  signInWithGoogle: (hint?: 'athlete' | 'coach') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const redirectTo = AuthSession.makeRedirectUri({ scheme: 'riposte', path: 'auth/callback' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [resolution, setResolution] = useState<RoleResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [coachPending, setCoachPending] = useState(false);
  const hintRef = useRef<'athlete' | 'coach' | null>(null);

  const resolve = useCallback(async (s: Session | null) => {
    if (!s?.user) { setResolution(null); setCoachPending(false); return; }
    try {
      const res = await auth.resolveUserRole(s.user);
      setResolution(res);
      setCoachPending(res.role !== 'coach' && hintRef.current === 'coach');
    } catch {
      setResolution({ role: 'athlete', member: null, coach: null, admin: null });
    }
  }, []);

  // Best-effort push-token registration once authenticated. No-ops silently
  // if permission is denied or no Expo push token can be obtained (e.g. no
  // Expo project id configured yet) — the app never blocks on it.
  const pushRegistered = useRef(false);
  const registerPush = useCallback(async (s: Session | null) => {
    if (!s?.user?.id || pushRegistered.current) return;
    pushRegistered.current = true;
    try {
      const token = await registerForPushNotifications();
      if (token) await db.registerDeviceToken(s.user.id, token, Platform.OS);
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await resolve(data.session);
      setLoading(false);
      registerPush(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!active) return;
      setSession(s);
      await resolve(s);
      registerPush(s);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [resolve, registerPush]);

  const signInWithGoogle = useCallback(async (hint?: 'athlete' | 'coach') => {
    hintRef.current = hint ?? null;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) return;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      const code = Linking.parse(result.url).queryParams?.code;
      if (typeof code === 'string') {
        await supabase.auth.exchangeCodeForSession(code);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    hintRef.current = null;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, role: resolution?.role ?? null, resolution, loading, coachPending, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
