# _reference — port source (temporary)

Snapshot of the old single-app source that the **mobile** rewrite ports
from. Not built, not shipped, and intentionally left with its original
imports intact so the screens read as they did in the combined app.

- `athlete/`, `coach/` — surfaces to rebuild in React Native (Phases 3–4)
- `pages/`, `App.jsx`, `main.jsx`, `components/SystemScreens.jsx` — the old
  auth/landing/routing shell; reference for the RN auth flow (Phase 2)
- `components/IOSFrame.jsx`, `lib/native.js`, `capacitor.config.ts`,
  `scripts/` — Capacitor/native scaffolding, fully retired in Phase 7

Delete this directory once the mobile port (Phases 2–4) is complete.
