import { createCore } from '@riposte/core';

// Web app: persist the session in localStorage and let supabase-js parse the
// OAuth redirect off the URL. (Mobile injects AsyncStorage + PKCE instead.)
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the build is missing its Supabase vars. `App` renders a config
 *  screen instead of the console — see AdminGate's `ConfigError`. */
export const configMissing = !url || !anonKey;

/**
 * Callable, infinitely-traversable placeholder used when config is missing.
 *
 * `createCore` throws on an absent url/anonKey, and this module runs at import
 * time — so throwing here kills the whole bundle before React can mount, and
 * the operator gets a blank page instead of the reason. Handing back a stub
 * keeps `./db`'s module-scope destructuring valid (it pulls ~45 functions off
 * `db`) and turns any call that does slip through into a named error.
 */
function stub(path) {
  const fn = () => Promise.reject(new Error(
    `Riposte admin is not configured: ${path}() needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`
  ));
  return new Proxy(fn, {
    get: (_target, prop) => (typeof prop === 'symbol' ? undefined : stub(`${path}.${String(prop)}`)),
  });
}

if (configMissing) {
  // Surface misconfiguration early rather than as opaque 401s later.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

const core = configMissing
  ? { supabase: stub('supabase'), db: stub('db'), auth: stub('auth') }
  : createCore({
      url,
      anonKey,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
    });

export const { supabase, db, auth } = core;
