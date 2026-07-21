// @riposte/core — shared, platform-agnostic core for the Riposte apps.
// Depends only on @supabase/supabase-js; no browser or React Native APIs.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase';
import type { CreateSupabaseClientConfig } from './supabase';
import { createDb } from './db';
import { createAuth } from './auth';

export * from './types';
export * from './constants';
export * from './tokens';

export { createSupabaseClient } from './supabase';
export type { CreateSupabaseClientConfig, KeyValueStorage } from './supabase';
export { createDb } from './db';
export type { Db } from './db';
export { createAuth } from './auth';
export type { Auth } from './auth';

export interface Core {
  supabase: SupabaseClient;
  db: ReturnType<typeof createDb>;
  auth: ReturnType<typeof createAuth>;
}

/**
 * Convenience: build a client and the full data + auth layer in one call.
 * Apps that need finer control can call {@link createSupabaseClient},
 * {@link createDb}, and {@link createAuth} individually.
 */
export function createCore(config: CreateSupabaseClientConfig): Core {
  const supabase = createSupabaseClient(config);
  return { supabase, db: createDb(supabase), auth: createAuth(supabase) };
}
