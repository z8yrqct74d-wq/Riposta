import React from 'react';
import { supabase } from '../../lib/supabase';
import { RiposteLogo } from '../../components/SystemScreens';
import { Icon } from '../../components/Shared';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FencerHero() {
  return (
    <svg width="180" height="180" viewBox="0 0 100 100" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>
      <line x1="62" y1="42" x2="90" y2="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" />
      <path d="M59 45 A5 5 0 0 0 68 37" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <line x1="54" y1="50" x2="62" y2="42" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      <circle cx="52" cy="52" r="3" fill="rgba(255,255,255,0.9)" />
      <circle cx="40" cy="21" r="7.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <line x1="40" y1="29" x2="40" y2="53" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <line x1="40" y1="35" x2="59" y2="46" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <line x1="40" y1="35" x2="27" y2="43" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" />
      <line x1="40" y1="53" x2="53" y2="70" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <line x1="53" y1="70" x2="62" y2="72" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <line x1="40" y1="53" x2="27" y2="65" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" />
      <line x1="27" y1="65" x2="18" y2="67" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" />
      <ellipse cx="40" cy="78" rx="22" ry="3" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: 'calendar',
    color: 'var(--brand)',
    bg: 'var(--brand-tint)',
    label: 'Book lessons',
    sub: 'Pick a coach, choose a free slot, and confirm in seconds.',
  },
  {
    icon: 'chart',
    color: 'var(--steel)',
    bg: 'var(--steel-tint)',
    label: 'Track your progress',
    sub: 'Attendance, coach notes, and your training history.',
  },
  {
    icon: 'qr',
    color: 'var(--success)',
    bg: 'var(--success-tint)',
    label: 'Check in at the salle',
    sub: 'Show your QR code at the entrance — no paper needed.',
  },
];

// Exactly 4 screens: welcome, features, role, login
const N_TOTAL = 4;

export function AthleteOnboarding({ onContinue }) {
  const [step, setStep] = React.useState(0);
  const [signingIn, setSigningIn] = React.useState(false);
  const [role, setRole] = React.useState('athlete');

  const isDark = step === 0;
  const isLogin = step === 3;

  const goNext = () => setStep(s => Math.min(s + 1, N_TOTAL - 1));
  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleSignIn = async () => {
    setSigningIn(true);
    // Hint only — the backend (coaches table) decides the real role on callback.
    sessionStorage.setItem('auth_role_hint', role);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  };

  const panelW = `${100 / N_TOTAL}%`;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* ── Sliding panels ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        width: `${N_TOTAL * 100}%`,
        height: '100%',
        transform: `translateX(-${step * (100 / N_TOTAL)}%)`,
        transition: 'transform 380ms cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
      }}>

        {/* ── Screen 1 of 3: Welcome ─────────────────────────── */}
        <div style={{
          width: panelW, height: '100%',
          background: 'linear-gradient(160deg, #1C2A44 0%, #0D1B2F 100%)',
          display: 'flex', flexDirection: 'column',
          padding: '56px 28px 160px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Radial glow */}
          <div style={{ position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,224,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
            <RiposteLogo size={26} color="#fff" />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1 }}>Riposte</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>CS Riposta</div>
            </div>
          </div>

          {/* Illustration */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <FencerHero />
          </div>

          {/* Headline */}
          <div style={{ zIndex: 1 }}>
            <h1 className="r-display" style={{ fontSize: 38, color: '#fff', margin: '0 0 12px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
              Your training,<br />your way.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              Book lessons, track progress, and check in — all from your phone.
            </p>
          </div>
        </div>

        {/* ── Screen 2 of 3: Features ────────────────────────── */}
        <div style={{
          width: panelW, height: '100%',
          background: 'var(--paper)',
          display: 'flex', flexDirection: 'column',
          padding: '64px 24px 160px',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>What's inside</div>
            <h2 className="r-display" style={{ fontSize: 34, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
              Everything<br />you need.
            </h2>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div key={f.label} style={{
                background: 'var(--surface)', border: '1px solid var(--hairline)',
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', gap: 14, alignItems: 'center',
                animation: `r-rise var(--d-base) var(--e-enter) ${i * 70}ms both`,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                  background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={f.icon} size={23} color={f.color} strokeWidth={1.8} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{f.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.45 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Screen 3 of 4: Role choice ─────────────────────── */}
        <div style={{
          width: panelW, height: '100%',
          background: 'var(--paper)',
          display: 'flex', flexDirection: 'column',
          padding: '64px 24px 160px',
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Who are you?</div>
            <h2 className="r-display" style={{ fontSize: 34, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
              Choose your<br />role.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'athlete', icon: 'user', color: 'var(--brand)', bg: 'var(--brand-tint)', label: "I'm an athlete", sub: 'Book lessons, track progress, and check in.' },
              { id: 'coach',   icon: 'users', color: 'var(--steel)', bg: 'var(--steel-tint)', label: "I'm a coach", sub: 'Manage your schedule, sessions, and roster.' },
            ].map((r, i) => {
              const on = role === r.id;
              return (
                <button key={r.id} onClick={() => setRole(r.id)} className="r-focusable" style={{
                  display: 'flex', gap: 14, alignItems: 'center', textAlign: 'left', width: '100%',
                  background: 'var(--surface)',
                  border: on ? '2px solid var(--brand)' : '1px solid var(--hairline)',
                  borderRadius: 16, padding: on ? '13px 15px' : '14px 16px',
                  cursor: 'pointer', font: 'inherit',
                  animation: `r-rise var(--d-base) var(--e-enter) ${i * 70}ms both`,
                  transition: 'border var(--d-fast)',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={r.icon} size={23} color={r.color} strokeWidth={1.8} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{r.label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.45 }}>{r.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: on ? 'none' : '2px solid var(--hairline)', background: on ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Screen 4 of 4: Login ───────────────────────────── */}
        <div style={{
          width: panelW, height: '100%',
          background: 'var(--paper)',
          display: 'flex', flexDirection: 'column',
          padding: '56px 28px 160px',
        }}>
          {/* Top logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RiposteLogo size={26} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>Riposte</div>
          </div>

          {/* Centered content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Club badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--brand-tint)', borderRadius: 'var(--r-pill)',
              padding: '6px 12px', marginBottom: 24, alignSelf: 'flex-start',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', letterSpacing: '0.02em' }}>CS Riposta · sportriposta.ro</span>
            </div>

            <h1 className="r-display" style={{ fontSize: 38, color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.08 }}>
              Let's get<br />started.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              Sign in to save your bookings, track your progress, and check in at the salle.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom nav — shows on all 3 screens ──────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 24px 40px',
        background: isDark
          ? 'linear-gradient(to top, rgba(13,27,47,0.98) 60%, transparent)'
          : 'linear-gradient(to top, rgba(255,255,255,0.99) 60%, transparent)',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {Array.from({ length: N_TOTAL }).map((_, i) => (
            <div key={i} style={{
              height: 5, borderRadius: 3,
              width: i === step ? 22 : 5,
              background: isDark ? '#fff' : 'var(--brand)',
              opacity: i === step ? 1 : 0.22,
              transition: 'width 280ms var(--e-standard), opacity 280ms',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Left: Skip (step 0) or Back (steps 1-2) */}
          {step === 0 ? (
            <button onClick={onContinue} className="r-focusable" style={{
              flex: 1, padding: 14, font: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 500,
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)',
              border: 'none', borderRadius: 'var(--r-btn)',
            }}>Skip</button>
          ) : (
            <button onClick={goPrev} className="r-focusable" style={{
              flex: 1, padding: 14, font: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 600,
              background: 'var(--surface)', color: 'var(--ink)',
              border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)',
            }}>Back</button>
          )}

          {/* Right: Continue (steps 0-1) or Sign in (step 2) */}
          {isLogin ? (
            <button onClick={handleSignIn} disabled={signingIn} className="r-focusable" style={{
              flex: 2, padding: 14, font: 'inherit', cursor: signingIn ? 'default' : 'pointer',
              fontSize: 15, fontWeight: 600,
              background: 'var(--brand)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-btn)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 16px rgba(59,111,224,0.35)',
              opacity: signingIn ? 0.75 : 1,
              transition: 'opacity var(--d-fast)',
            }}>
              {signingIn ? 'Redirecting…' : <><GoogleLogo />Continue with Google</>}
            </button>
          ) : (
            <button onClick={goNext} className="r-focusable" style={{
              flex: 2, padding: 14, font: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 600,
              background: isDark ? '#fff' : 'var(--brand)',
              color: isDark ? '#1C2A44' : '#fff',
              border: 'none', borderRadius: 'var(--r-btn)',
              boxShadow: isDark ? '0 4px 16px rgba(255,255,255,0.08)' : '0 4px 16px rgba(59,111,224,0.3)',
            }}>
              Continue
            </button>
          )}
        </div>

        {/* Guest link — only on login screen */}
        {isLogin && (
          <button onClick={onContinue} className="r-focusable" style={{
            display: 'block', width: '100%', marginTop: 14,
            font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent',
            fontSize: 13, color: 'var(--faint)', padding: '6px 0', textAlign: 'center',
          }}>
            Continue without account →
          </button>
        )}
      </div>

      <style>{`
        @keyframes r-pop {
          from { opacity: 0; transform: scale(0.72); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
