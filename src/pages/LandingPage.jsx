import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiposteLogo } from '../components/SystemScreens';
import { supabase } from '../lib/supabase';

const SURFACES = [
  {
    path: '/admin',
    label: 'Admin Console',
    role: 'Club administrator',
    desc: 'Calendar, members, plans & settings',
    color: '#1C2A44',
    accent: '#C9A252',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/coach',
    label: 'Coach Console',
    role: 'Fencing coach',
    desc: 'Schedule, sessions & athlete roster',
    color: '#C9A252',
    accent: '#1C2A44',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/athlete',
    label: 'Athlete App',
    role: 'Parent / Athlete',
    desc: 'Book lessons, track progress & pay',
    color: '#3B6FE0',
    accent: '#fff',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <RiposteLogo size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 540, color: 'var(--ink)', lineHeight: 1 }}>Riposte</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 3 }}>CS Riposta · sportriposta.ro</div>
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
                <button onClick={signOut} style={{ font: 'inherit', fontSize: 11.5, color: 'var(--faint)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Sign out</button>
              </div>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}</div>
              }
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="r-focusable" style={{ font: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--brand)', background: 'none', border: '1px solid var(--brand)', borderRadius: 'var(--r-btn)', padding: '7px 14px', cursor: 'pointer' }}>Sign in</button>
          )}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
          {user ? `Welcome back.` : 'Choose your surface.'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 32px', lineHeight: 1.55 }}>
          {user ? 'Select a surface to open.' : 'Sign in or select a surface to explore the prototype.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SURFACES.map((s, i) => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className="r-focusable"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                padding: '18px 20px',
                borderRadius: 'var(--r-card)',
                border: '1px solid var(--hairline)',
                background: 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                transition: 'transform var(--d-fast), box-shadow var(--d-fast)',
                animation: `r-rise var(--d-slow) var(--e-enter) ${i * 60 + 80}ms both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: s.color,
                color: s.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{s.role} · {s.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        {!user && (
          <div style={{ marginTop: 32, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Sign in to save your data across sessions.</span>
            <button onClick={() => navigate('/auth')} className="r-focusable" style={{ font: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--brand)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign in →</button>
          </div>
        )}
      </div>
    </div>
  );
}
