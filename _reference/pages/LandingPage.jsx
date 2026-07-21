import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiposteLogo } from '../components/SystemScreens';
import { supabase } from '../lib/supabase';
import { resolveUserRole } from '../lib/db';

// The public entry point. Logged-in users are routed to their flow by role
// (coach vs athlete); everyone else goes to the athlete onboarding. Admin
// lives at its own /admin route and is not surfaced here.
export default function LandingPage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    let done = false;
    async function route() {
      const { data: { session } } = await supabase.auth.getSession();
      if (done) return;
      if (!session?.user) { navigate('/athlete', { replace: true }); return; }
      let role = 'athlete';
      try { ({ role } = await resolveUserRole(session.user)); } catch {}
      navigate(role === 'coach' ? '/coach' : '/athlete', { replace: true });
    }
    route();
    return () => { done = true; };
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
        <RiposteLogo size={40} />
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', opacity: 0.4, animation: `r-live-pulse 1s ease-in-out ${i * 200}ms infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
