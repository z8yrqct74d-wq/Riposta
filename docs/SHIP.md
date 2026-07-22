# Shipping Riposte

Config for deploys is in the repo; the deploys themselves need your Vercel /
Expo (EAS) / Apple accounts.

## Environment variables

Never commit secrets. Set these in the respective dashboards.

| App | Var | Where |
|-----|-----|-------|
| `apps/admin` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vercel project env |
| `apps/mobile` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` locally; EAS secrets for builds |

`apps/mobile/.env.example` documents the mobile vars.

## Admin web → Vercel

`vercel.json` (repo root) builds the admin workspace and serves its output:

- Build command: `npm run build` → `npm --workspace @riposte/admin run build`
- Output: `apps/admin/dist`
- Install: `npm install` (workspace-aware, resolves `@riposte/core`)

Steps:
1. Import the repo into Vercel; keep **Root Directory = repo root** (the
   `vercel.json` handles the monorepo build).
2. Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Deploy. The SPA rewrite serves `index.html` for all routes.

## Mobile → EAS Build → TestFlight

`apps/mobile/eas.json` defines `development` / `preview` / `production`
profiles. `app.json` sets `scheme: "riposte"` and bundle id
`ro.sportriposta.riposte` (matches the old Capacitor id, so the Apple app
record carries over).

```sh
cd apps/mobile
npx expo install --check          # confirm native versions (Expo API needed)
eas login
eas build:configure
# put the anon key + url in EAS secrets:
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://…
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value …
eas build -p ios --profile preview     # internal test build
eas build -p ios --profile production  # store build
eas submit -p ios                      # → App Store Connect → TestFlight
```

Google OAuth: add the `riposte://auth/callback` redirect (and the Supabase
callback URL) to the Google OAuth client and to Supabase Auth → URL config.

## Push notifications

`expo-notifications` is installed and configured (`app.json` plugin) with a
`registerForPushNotifications()` scaffold in `src/lib/notifications.ts`. Not
wired into the app yet — a later phase stores the token per member and sends
lesson reminders / booking confirmations.

## Capacitor

Fully retired — no `capacitor.config.ts`, `ios/`, `@capacitor/*`, or
`scripts/ios-setup.sh` remain. The mobile app is pure Expo.

## Security migration

Before real users: apply `supabase/migrations/add_rls_hardening.sql` and test
with scoped tokens (see `rewrite-plan.md` → Verification). Coaches/admins must
sign in once (or be linked manually) so their `user_id` populates.
