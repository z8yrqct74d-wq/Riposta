import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Minimal storage contract shared by web `localStorage` and React Native
 * `@react-native-async-storage/async-storage`. Matches what supabase-js
 * needs for session persistence without pulling in any platform types.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export interface CreateSupabaseClientConfig {
  url: string;
  anonKey: string;
  /**
   * Session store. Web → `localStorage`; RN → `AsyncStorage`.
   * Omit to use the platform default (browser localStorage).
   */
  storage?: KeyValueStorage;
  /**
   * Web (magic-link / OAuth redirect on the same origin) → `true`.
   * RN (deep-link handled manually via `exchangeCodeForSession`) → `false`.
   */
  detectSessionInUrl?: boolean;
  /** PKCE for native OAuth; implicit is the web default. */
  flowType?: 'pkce' | 'implicit';
  persistSession?: boolean;
  autoRefreshToken?: boolean;
}

/**
 * Framework-free Supabase client factory. Makes no browser assumptions —
 * each app injects its own storage + redirect handling so the same client
 * config works for the admin web app and the Expo mobile app.
 */
export function createSupabaseClient(config: CreateSupabaseClientConfig): SupabaseClient {
  const {
    url,
    anonKey,
    storage,
    detectSessionInUrl = true,
    flowType = 'implicit',
    persistSession = true,
    autoRefreshToken = true,
  } = config;

  if (!url || !anonKey) {
    throw new Error('createSupabaseClient: `url` and `anonKey` are required.');
  }

  return createClient(url, anonKey, {
    auth: {
      ...(storage ? { storage } : {}),
      persistSession,
      autoRefreshToken,
      detectSessionInUrl,
      flowType,
    },
  });
}
