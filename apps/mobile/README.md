# @riposte/mobile

Placeholder for the Riposte **athlete + coach** app — a real React Native
(Expo, managed, TypeScript) application, replacing the Capacitor web wrapper.

Scaffolded in **Phase 2** of the rewrite (see the migration plan):

- `create-expo-app` + `expo-router` (file-based navigation)
- `ThemeProvider` from [`@riposte/core`](../../packages/core) tokens
  (`light` for athlete, `dark` for coach)
- Styled primitives (`Text`, `Card`, `Button`, `Pill`, `Screen`, `Sheet`)
- Icon set / `WeaponGlyph` / `RiposteLogo` ported to `react-native-svg`
- Auth: `@supabase/supabase-js` + AsyncStorage, Google OAuth via
  `expo-web-browser` + `expo-auth-session` (PKCE, `riposte://` scheme),
  role routing via `resolveUserRole` from core

The athlete/coach source to port from lives in `../../_reference/` once
Phase 1 relocates it there.
