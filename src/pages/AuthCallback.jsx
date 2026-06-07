import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RiposteLogo } from '../components/SystemScreens';

export default function AuthCallback() {
  const navigate = useNavigate();

  React.useEffect(() => {
    function getReturnUrl() {
      const stored = sessionStorage.getItem('auth_return');
      if (stored) { sessionStorage.removeItem('auth_return'); return stored; }
      return '/';
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe();
        navigate(getReturnUrl(), { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(getReturnUrl(), { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
        <RiposteLogo size={40} />
        <div style={{ marginTop: 24, fontSize: 15, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Signing you in…</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', opacity: 0.4, animation: `r-live-pulse 1s ease-in-out ${i * 200}ms infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
