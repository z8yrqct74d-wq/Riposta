# Riposte — React Native Rewrite + Admin Web Split

> The approved multi-phase plan, committed to the repo so it survives across
> environments. Phase status is tracked at the bottom.

## Context

Riposte today is a single Vite + React web app wrapped in Capacitor for iOS.
It hosts three surfaces off one router — athlete (`/athlete`), coach
(`/coach`), admin (`/admin`) — all sharing one Supabase backend. Goals:

1. Athlete + Coach → a real React Native app (not a Capacitor web wrapper),
   for the best native UX and a clean TestFlight path.
2. Admin → a standalone web app, and its currently-hardcoded screens wired
   to the backend.
3. Simple, fast, secure, best-UX — including closing the current security
   hole (all Supabase RLS is `USING(true)`; anyone with the public anon key
   can read/write every table).

**Approved decisions:** monorepo with a shared core package; JS theme object
+ Reanimated/Moti for styling/animation; harden security as part of this
project; split admin out AND wire its backend.

## Target structure (npm workspaces monorepo)

```
riposte/
  apps/
    mobile/                 Expo (React Native) — athlete + coach
    admin/                  Vite React web — the current app, trimmed to admin
  packages/
    core/                   shared, platform-agnostic
      supabase.ts           createSupabaseClient(storage) factory (no browser assumptions)
      db.ts                 all query fns (ported from src/lib/db.js, upload fns reworked)
      auth.ts               resolveUserRole, getCoachByEmail, getMemberByEmail, upsertMemberFromAuth
      tokens.ts             light + dark theme values (from tokens.css)
      constants.ts          WEAPON_LABEL, ATT_STATES, AVAIL_DAYS/SLOTS, status maps, time helpers
      types.ts              Member, Coach, Booking, CalendarBlock, etc.
  supabase/
    migrations/             existing + new RLS/auth-linkage migrations
```

`packages/core` is TypeScript, framework-free (imports only
`@supabase/supabase-js`). Both apps depend on it via the workspace.

## Phase 0 — Monorepo scaffold + shared core

- Convert repo to npm workspaces (`"workspaces": ["apps/*", "packages/*"]`).
- Create `packages/core` and port the reusable logic. db.js is RN-safe —
  port near-verbatim to `db.ts`, EXCEPT:
  - `uploadMemberAvatar` / `uploadMemberDocument`: rework to accept
    `{ uri, name, type }` and upload via `ArrayBuffer`/`FormData` (works for
    both web `File` and RN image-picker results).
  - `supabase.js` (`import.meta.env`, default localStorage) →
    `createSupabaseClient({ storage, detectSessionInUrl })` factory. Web
    passes `localStorage` + `detectSessionInUrl:true`; mobile passes
    `AsyncStorage` + `detectSessionInUrl:false`, `flowType:'pkce'`.
- `tokens.ts`: transcribe every CSS var from `src/tokens.css` into `light`
  and `dark` objects. Precompute the two `color-mix(in oklab,…)` values
  (TabBar bg, skeleton) since RN has no `color-mix`.

## Phase 1 — Admin web app (`apps/admin`) + auth gate + backend wiring

- Move the current Vite app into `apps/admin`; strip athlete/coach/onboarding,
  native/Capacitor, `IOSFrame.jsx`, `src/lib/native.js`. Keep
  `BrowserWindow.jsx`, `Shared.jsx`, `src/data/adminData.js`.
- Router collapses to admin only. Add an admin auth gate: new `admins` table,
  gate the route via `resolveUserRole` extended to return `'admin'`.
- Wire the hardcoded admin screens to Supabase:
  - `AdminCoaches.jsx` — `getCoaches` + `coaches.availability_json`;
    create-coach (sets `email`) and availability persistence.
  - `AdminMemberDetail.jsx` — real reads: bookings/attendance, payments
    (Phase 6 `payments` table), notes, compliance. Wire record payment /
    top-up credits / request renewal.
  - `AdminPlansSettings.jsx` — `plans` table + single-row `settings` table;
    catalogue CRUD + settings persistence.
  - `AdminViews.jsx` `AdminDashboard` — compute KPIs from real queries.
- Reuse as-is: `AdminCalendar.jsx` drag-drop + block CRUD, `AdminViews`
  members read.

## Phase 2 — Mobile scaffold + theme + navigation + auth (`apps/mobile`)

- `create-expo-app` (managed, TypeScript). expo-router (file-based).
- ThemeProvider from `packages/core` tokens: `light` for athlete, `dark` for
  coach. Styled primitives: `Text` (display/mono/body), `Card`, `Button`,
  `Pill`, `Screen`, `Sheet`.
- Icon system: port `Shared.jsx`'s 35-icon set + WeaponGlyph + RiposteLogo to
  `react-native-svg`.
- Auth: `@supabase/supabase-js` + AsyncStorage; Google OAuth via
  `expo-web-browser` + `expo-auth-session`, PKCE, `exchangeCodeForSession`.
  Reuse `resolveUserRole`; keep the `coachPending` fallback logic.
- Role routing: after login, `resolveUserRole` → athlete stack or coach stack
  (expo-router groups `(athlete)` / `(coach)`).

## Phase 3 — Port athlete surface

- Onboarding — 4-panel carousel → `react-native-pager-view`; gradients →
  `expo-linear-gradient`.
- Home — CreditMeter, alert chips, next-lesson row, Book CTA. Tab bar frosted
  glass → `expo-blur`.
- Booking — 4-step slider → pager; `SuccessRing` → Reanimated
  `useAnimatedProps` on `react-native-svg`; credit float-up → Moti.
- Schedule / Payments / Progress / Check-in / Profile:
  - Bottom sheets → `@gorhom/bottom-sheet`.
  - Slide-in panels → expo-router modals or Moti translateX.
  - WheelPicker → native pickers (`@react-native-community/datetimepicker`
    for DOB, bottom-sheet lists for plan/weapon/category) — a UX upgrade.
  - ProgressScreen → segmented control + `react-native-svg` bars with Moti.
  - Check-in QR → `react-native-qrcode-svg`.
  - Avatar/doc upload → `expo-image-picker` / `expo-document-picker`.

## Phase 4 — Port coach surface

- CoachApp — MyDay (Day/Week/Month), roster, profile toggles, availability
  grid with debounced save.
- CoachSession — animated attendance toggle (Reanimated sliding pill),
  session roster + drop-in sheet, lesson view with credit deduction + notes.
- All data functions already exist in core.

## Phase 5 — Security hardening (RLS + auth linkage)

- Add `user_id uuid references auth.users(id)` to `members` and `coaches`;
  populate on login. Add an `admins` table (keyed by user_id).
- Replace every `USING(true)` policy with real scoping: members see/write
  only their own row; coaches scoped to their sessions; admin sees all;
  storage scoped to `${auth.uid()}/…`.
- Extend `resolveUserRole` to check `admins` (done in Phase 0's `auth.ts`).
- Add the missing unique constraint backing the `session_attendance` upsert
  (`block_id, session_date, member_id`).

## Phase 6 — Backend gaps for wired admin

- `plans` table, single-row `settings` table, `payments`/`invoices` table +
  matching `db.ts` functions. (Brought forward into Phase 1b.)

## Phase 7 — Build + ship

- `apps/admin`: Vercel deploy, env `VITE_SUPABASE_*`.
- `apps/mobile`: EAS Build → iOS → TestFlight. `scheme: 'riposte'`, bundle id
  `ro.sportriposta.riposte`. `expo-notifications` scaffolded for later.
- Retire Capacitor entirely.

## Verification

- Admin: log in as admin-linked email (blocked for non-admins); newly-wired
  screens round-trip to Supabase.
- Mobile: onboarding → OAuth → role routing → book → shows in coach MyDay →
  mark attendance persists → avatar upload → QR check-in → Progress chart.
- Security: with a member's JWT, confirm reading another member's row /
  another coach's bookings is denied; admin routes blocked for non-admin.
- TestFlight: `eas build -p ios --profile preview` → real device.

## Risks / calls made

- Biggest UI-port clusters: wheel pickers (→ native pickers), 3 translateX
  carousels (→ pager-view), ~12 keyframes/~50 transitions (→ Moti/Reanimated),
  backdrop-filter blur (→ expo-blur).
- RLS hardening touches every flow — sequenced last so functionality is proven
  first, then locked down.
- Coach identity (`coaches.id text`, e.g. 'sandu') isn't auth-linked today —
  Phase 5 adds `user_id`; admin coach-creation (Phase 1) sets `email` so login
  resolves.

---

## Phase status

- [x] **Phase 0** — monorepo + `@riposte/core` (commit `a1ac8e2`)
- [x] **Phase 1a** — admin split into `apps/admin` + `AdminGate` (`2706b8f`)
- [x] **Phase 1b** — admin screens wired + Phase 6 backend tables (`6f0062e`)
- [x] **Phase 2** — Expo mobile scaffold (theme, nav, auth, icons) — typechecks
- [x] **Phase 3** — port athlete surface (onboarding, home, booking, schedule, payments, progress, check-in, profile) — typechecks
- [x] **Phase 4** — port coach surface (MyDay, roster, availability, session attendance, lesson) — typechecks
- [x] **Phase 5** — security hardening: RLS migration + auth linkage written (⚠ apply + test in Supabase with scoped tokens before relying on it)
- [ ] **Phase 6** — remaining backend gaps (core tables done in 1b)
- [ ] **Phase 7** — build + ship (Vercel / EAS / retire Capacitor)
