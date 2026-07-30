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

- `apps/admin`: Vercel deploy on a private, unlisted custom domain (e.g.
  `admin.sportriposta.ro`) — `noindex`/`robots.txt` + the existing
  Google-OAuth `AdminGate` as the real access control. Env `VITE_SUPABASE_*`.
- `apps/mobile`: Xcode Cloud → iOS → TestFlight, auto-build + auto-distribute
  to Internal Testing on every push to `main`. `scheme: 'riposte'`, bundle id
  `ro.sportriposta.riposte`. Requires a committed native project
  (`apps/mobile/ios/`, via `expo prebuild`) + `ios/ci_scripts/` — see
  `docs/SHIP.md` for the full runbook. `eas.json`/EAS Build kept only for
  optional ad hoc dev-client builds, not the shipping path.
  `expo-notifications` scaffolded for later (already added the
  `aps-environment` entitlement — the App ID's Push Notifications capability
  must be enabled before the first Xcode Cloud build).
- Retire Capacitor entirely (done — `ios/` that exists now is Expo-generated
  for Xcode Cloud, not a Capacitor leftover).

## Verification

- Admin: log in as admin-linked email (blocked for non-admins); newly-wired
  screens round-trip to Supabase.
- Mobile: onboarding → OAuth → role routing → book → shows in coach MyDay →
  mark attendance persists → avatar upload → QR check-in → Progress chart.
- Security: with a member's JWT, confirm reading another member's row /
  another coach's bookings is denied; admin routes blocked for non-admin.
- TestFlight: Xcode Cloud build on a push to `main` → Internal Testing → real device.

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

## v1 scope cut — no payments or credits in the mobile app

The mobile app ships its first version with **no payment and no lesson-credit
concepts**. Athletes book freely: nothing checks a balance, nothing is deducted
when a coach marks a lesson done, and cancelling refunds nothing. This removed
the athlete "Pay" tab, the Home credit meter and pay-status tile, the booking
flow's cost/balance rows and its "Not enough credits" block, the coach's credit
deduction and roster credits column, and the athlete's self-serve Plan picker.

Deliberately **retained**:

- **The admin console** — `Plans & billing`, per-member payment recording, and
  the pay-status/credit KPIs all still work. It's an internal tool, not
  store-shipped, so the club can keep its bookkeeping there.
- **The whole database** — `plans`, `payments`, `members.credits`,
  `members.plan_name`, `members.pay_status`, `settings.credit_cost_per_lesson`,
  `settings.dunning_offset_days`, and their RLS policies are untouched.
- **`@riposte/core`** — `Plan`/`Payment`/`PayStatus` types, `PAYMENT_STATUS`,
  `getPlans`, `recordPayment`, `updateMemberCredits` etc. remain, since admin
  uses them.

So re-enabling payments on mobile later is UI work only. Note that
`settings.cancellation_window_hours` is now unused by mobile — it only ever
decided whether a cancellation refunded a credit, and was never a hard cutoff.
The full pre-removal state is preserved on the `archive/payments-and-credits`
branch (snapshot of `5d9582d`).

---

## Phase status

- [x] **Phase 0** — monorepo + `@riposte/core` (commit `a1ac8e2`)
- [x] **Phase 1a** — admin split into `apps/admin` + `AdminGate` (`2706b8f`)
- [x] **Phase 1b** — admin screens wired + Phase 6 backend tables (`6f0062e`)
- [x] **Phase 2** — Expo mobile scaffold (theme, nav, auth, icons) — typechecks
- [x] **Phase 3** — port athlete surface (onboarding, home, booking, schedule, payments, progress, check-in, profile) — typechecks
- [x] **Phase 4** — port coach surface (MyDay, roster, availability, session attendance, lesson) — typechecks
- [x] **Phase 5** — security hardening: RLS migration + auth linkage written (⚠ apply + test in Supabase with scoped tokens before relying on it)
- [x] **Phase 6** — backend gaps for wired admin: `plans`/`settings`/`payments` tables + core functions, done as part of Phase 1b (`6f0062e`)
- [x] **Phase 7** — build + ship config: Vercel monorepo build for a private/unlisted admin domain, Xcode Cloud repo-side setup (`apps/mobile/ios/` + `ci_scripts/`) for TestFlight on every push to `main`, `docs/SHIP.md` runbook; actual account-side setup (Apple Developer/App Store Connect, Vercel domain + DNS) is on you — see `docs/SHIP.md`
