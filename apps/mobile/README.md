# @riposte/mobile

Riposte **athlete + coach** app — Expo (React Native, managed, TypeScript),
built on the shared [`@riposte/core`](../../packages/core) package.

## Stack

- **expo-router** (file-based navigation) — `app/`
- **Theme**: `ThemeProvider` from core tokens — `light` for athlete, `dark`
  for coach (`src/theme/theme.tsx`)
- **Primitives**: `Text` / `Card` / `Button` / `Pill` / `Screen` / `Sheet`
  (`src/components/ui.tsx`)
- **Icons**: the 35-icon set + `WeaponGlyph` + `RiposteLogo` ported to
  `react-native-svg` (`src/components/`)
- **3D crest**: the onboarding welcome panel renders
  `assets/brand/riposta-crest.glb` with `three` on an `expo-gl` surface, drag
  to spin (`src/components/RiposteCrest3D.tsx`). Falls back to the flat SVG
  fencer if GL can't come up. `.glb` is registered in `metro.config.js`'s
  `assetExts`; `expo-gl` autolinks, so an iOS build needs a fresh `pod install`
- **Auth**: `@supabase/supabase-js` + AsyncStorage; Google OAuth via
  `expo-web-browser` + `expo-auth-session` (PKCE, `riposte://` deep link),
  role routing via `resolveUserRole` from core (`src/auth/AuthProvider.tsx`)

## Routes

```
app/
  _layout.tsx        SafeAreaProvider + AuthProvider + Stack
  index.tsx          redirect by auth/role → sign-in | (athlete) | (coach)
  sign-in.tsx        Google sign-in (athlete / coach hint)
  (athlete)/         light theme — Phase 3 builds the full surface
  (coach)/           dark theme  — Phase 4 builds the full surface
```

## Running

```sh
cp .env.example .env    # fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npm --workspace @riposte/mobile run start
```

App icons/splash are added with real branding in Phase 7. Phases 3–4 port the
athlete/coach surfaces from `../../_reference/`.
