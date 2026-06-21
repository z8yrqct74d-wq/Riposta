import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import { AuthApp } from './components/SystemScreens';
import { AdminAppPage } from './surfaces/admin/AdminApp';
import { CoachAppPage } from './surfaces/coach/CoachApp';
import { AthleteAppPage } from './surfaces/athlete/AthleteApp';
import { supabase } from './lib/supabase';
import { resolveUserRole } from './lib/db';
import { isNative } from './lib/native';

// Listens for the OAuth deep link on iOS (riposte://auth/callback?code=...)
// and completes the PKCE code exchange, then routes by role. Web users go
// through AuthCallback.jsx instead — this component is a no-op on web.
function NativeAuthHandler() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isNative()) return;
    let listener;
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.includes('auth/callback')) return;
      Browser.close().catch(() => {});
      try {
        await supabase.auth.exchangeCodeForSession(url);
        const { data } = await supabase.auth.getUser();
        const hint = sessionStorage.getItem('auth_role_hint');
        sessionStorage.removeItem('auth_role_hint');
        let role = 'athlete';
        try { ({ role } = await resolveUserRole(data.user)); } catch {}
        if (role === 'coach') navigate('/coach', { replace: true });
        else if (hint === 'coach') navigate('/athlete?coachPending=1', { replace: true });
        else navigate('/athlete', { replace: true });
      } catch (e) {
        console.error('Native auth failed', e);
      }
    }).then(l => { listener = l; });

    return () => { listener?.remove(); };
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <NativeAuthHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthApp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin" element={<AdminAppPage />} />
        <Route path="/coach" element={<CoachAppPage />} />
        <Route path="/athlete" element={<AthleteAppPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
