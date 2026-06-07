import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiposteLogo } from '../components/SystemScreens';

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
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 540, color: 'var(--ink)', lineHeight: 1 }}>Riposte</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 3 }}>CS Riposta · sportriposta.ro</div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
          Choose your surface.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 32px', lineHeight: 1.55 }}>
          This is a prototype launcher. Select a role to explore the interface.
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

        <div style={{ marginTop: 32, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontSize: 12.5, color: 'var(--faint)', lineHeight: 1.5 }}>
            Or go through the <button onClick={() => navigate('/auth')} style={{ font: 'inherit', fontSize: 12.5, background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>auth flow</button> to simulate sign-in with role detection.
          </span>
        </div>
      </div>
    </div>
  );
}
