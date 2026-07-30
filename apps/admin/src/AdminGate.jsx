import React from 'react';
import { supabase, auth } from './lib/core';

function Logo({ size = 34, color = 'var(--brand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M7 17 L17 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 17 L15 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <circle cx="7" cy="17" r="1.4" fill={color} />
    </svg>
  );
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--paper)', fontFamily: 'var(--font-ui)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: 'var(--surface)', border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-raise)', padding: '36px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}

function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.7 2.6 1.8 6.4l3.8 3C6.5 6.7 9 4.8 12 4.8z" />
    </svg>
  );
}

/**
 * Shown instead of the gate when the build has no Supabase vars. Without this
 * the console renders nothing at all — the failure is invisible unless you have
 * devtools open, which is a bad way to find out a Vercel env var is missing.
 */
export function ConfigError() {
  return (
    <Shell>
      <Logo color="var(--danger)" />
      <h1 className="r-display" style={{ margin: '14px 0 0', fontSize: 22, color: 'var(--ink)' }}>Not configured</h1>
      <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
        This build is missing its Supabase environment variables, so it can’t reach the club’s data.
      </p>
      <div className="r-mono" style={{
        marginTop: 16, width: '100%', padding: '11px 12px', borderRadius: 'var(--r-btn)',
        border: '1px solid var(--hairline)', background: 'var(--paper)', textAlign: 'left',
        fontSize: 12, color: 'var(--ink)', lineHeight: 1.7,
      }}>
        VITE_SUPABASE_URL<br />VITE_SUPABASE_ANON_KEY
      </div>
      <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--faint)', lineHeight: 1.5 }}>
        Set both in the Vercel project’s environment variables and redeploy.
      </p>
    </Shell>
  );
}

/**
 * Admin-only auth gate. `/admin` was previously wide open; now it resolves
 * the signed-in user's role via core and only renders children for admins.
 * Non-admins (athletes/coaches, or signed-out visitors) are stopped here.
 */
export function AdminGate({ children }) {
  const [status, setStatus] = React.useState('loading'); // loading | signedOut | denied | admin
  const [email, setEmail] = React.useState(null);
  const [error, setError] = React.useState(null);

  const evaluate = React.useCallback(async (session) => {
    if (!session?.user) { setStatus('signedOut'); setEmail(null); return; }
    setEmail(session.user.email ?? null);
    try {
      const { role } = await auth.resolveUserRole(session.user);
      setStatus(role === 'admin' ? 'admin' : 'denied');
    } catch (e) {
      console.error('Role resolution failed', e);
      setError('Could not verify your access. Please try again.');
      setStatus('denied');
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) evaluate(data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) evaluate(session);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [evaluate]);

  const signIn = async () => {
    setError(null);
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (e) { console.error(e); setError('Sign-in failed. Please try again.'); }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  if (status === 'admin') return children;

  if (status === 'loading') {
    return (
      <Shell>
        <Logo />
        <div className="r-skeleton" style={{ width: 160, height: 14, marginTop: 18 }} />
        <div className="r-skeleton" style={{ width: 120, height: 12 }} />
      </Shell>
    );
  }

  if (status === 'denied') {
    return (
      <Shell>
        <Logo color="var(--danger)" />
        <h1 className="r-display" style={{ margin: '14px 0 0', fontSize: 22, color: 'var(--ink)' }}>Access restricted</h1>
        <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          {email
            ? <>The account <strong style={{ color: 'var(--ink)' }}>{email}</strong> isn’t an admin for this club.</>
            : 'This account isn’t authorised for the admin console.'}
        </p>
        {error && <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{error}</p>}
        <button onClick={signOut} className="r-focusable" style={{
          marginTop: 20, font: 'inherit', cursor: 'pointer', width: '100%', padding: '11px',
          borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'transparent',
          color: 'var(--ink)', fontSize: 13.5, fontWeight: 600,
        }}>Sign in with a different account</button>
      </Shell>
    );
  }

  // signedOut
  return (
    <Shell>
      <Logo />
      <h1 className="r-display" style={{ margin: '14px 0 0', fontSize: 24, color: 'var(--ink)' }}>Riposte Admin</h1>
      <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>Salle management console</p>
      {error && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{error}</p>}
      <button onClick={signIn} className="r-focusable" style={{
        marginTop: 22, font: 'inherit', cursor: 'pointer', width: '100%', padding: '11px',
        borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--surface)',
        color: 'var(--ink)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-rest)',
      }}>
        <GoogleMark /> Continue with Google
      </button>
    </Shell>
  );
}
