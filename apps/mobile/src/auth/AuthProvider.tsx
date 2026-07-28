import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import type { Role, RoleResolution } from '@riposte/core';
import { supabase, auth, db } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/notifications';

// Finalises any in-flight auth session when the app regains focus (web/dev).
WebBrowser.maybeCompleteAuthSession();

/**
 * Hard ceiling on how long the app is allowed to sit behind the splash on a
 * cold start. Session recovery hits the network (token refresh) and role
 * resolution hits it again; if any of that stalls we render anyway and let the
 * role land in the background. The gate must never be able to hang.
 */
const BOOTSTRAP_TIMEOUT_MS = 8000;

/** Last known role, so a returning user is routed without waiting on the network. */
const ROLE_CACHE_KEY = 'riposte.role';

interface CachedRole { userId: string; role: Role; }

async function readCachedRole(): Promise<CachedRole | null> {
  try {
    const raw = await AsyncStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRole;
    return parsed?.userId && parsed?.role ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedRole(userId: string, role: Role): void {
  AsyncStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role })).catch(() => {});
}

function clearCachedRole(): void {
  AsyncStorage.removeItem(ROLE_CACHE_KEY).catch(() => {});
}

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
  const activeRef = useRef(true);
  /** User whose role has already been resolved, so repeat auth events are no-ops. */
  const resolvedForRef = useRef<string | null>(null);

  const resolve = useCallback(async (s: Session | null) => {
    if (!s?.user) { setResolution(null); setCoachPending(false); return; }
    // A lookup that lands after the user changed (sign-out, account switch)
    // must not write its stale role over the current one.
    const isStale = () => !activeRef.current || resolvedForRef.current !== (s.user.id ?? null);
    try {
      const res = await auth.resolveUserRole(s.user);
      if (isStale()) return;
      setResolution(res);
      setCoachPending(res.role !== 'coach' && hintRef.current === 'coach');
      if (s.user.id) writeCachedRole(s.user.id, res.role);
    } catch {
      if (isStale()) return;
      // Never downgrade a role we already have (e.g. one seeded from cache) —
      // that would bounce a coach onto the athlete surface on a flaky network.
      setResolution((prev) => prev ?? { role: 'athlete', member: null, coach: null, admin: null });
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

  /**
   * Resolve the role for a session exactly once per user. Both the cold-start
   * bootstrap and `onAuthStateChange` funnel through here, so the synthetic
   * INITIAL_SESSION event no longer repeats the bootstrap's round trips.
   */
  const resolveOnce = useCallback(async (s: Session | null) => {
    const userId = s?.user?.id ?? null;
    if (userId === resolvedForRef.current) return;
    resolvedForRef.current = userId;
    if (!userId) clearCachedRole();
    await resolve(s);
    registerPush(s);
  }, [resolve, registerPush]);

  useEffect(() => {
    activeRef.current = true;
    let settled = false;
    const stopGating = () => {
      if (settled) return;
      settled = true;
      if (activeRef.current) setLoading(false);
    };
    const timer = setTimeout(stopGating, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!activeRef.current) return;
        const s = data.session ?? null;
        setSession(s);

        // A returning user's last known role routes them straight away; the
        // authoritative lookup still runs, it just doesn't hold the screen.
        if (s?.user?.id) {
          const cached = await readCachedRole();
          if (!activeRef.current) return;
          if (cached && cached.userId === s.user.id) {
            setResolution({ role: cached.role, member: null, coach: null, admin: null });
            stopGating();
          }
        }

        await resolveOnce(s);
      } catch {
        // Session recovery failed — offline, an expired refresh token, a
        // storage-lock timeout. Fall through to the sign-in screen instead of
        // stranding on the loading gate forever.
      } finally {
        clearTimeout(timer);
        stopGating();
      }
    })();

    // Never await Supabase calls inside this callback: it runs inside auth-js's
    // storage lock, and re-entering the client from there is a documented
    // deadlock. Kick the work off and let it land on its own.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!activeRef.current) return;
      setSession(s);
      resolveOnce(s).catch(() => {});
    });

    return () => {
      activeRef.current = false;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [resolveOnce]);

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
    clearCachedRole();
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
