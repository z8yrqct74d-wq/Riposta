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

// Large fencer illustration for the welcome slide
function FencerHero() {
  return (
    <svg width="180" height="180" viewBox="0 0 100 100" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>
      {/* Blade */}
      <line x1="62" y1="42" x2="90" y2="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" />
      {/* Guard */}
      <path d="M59 45 A5 5 0 0 0 68 37" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      {/* Forearm */}
      <line x1="54" y1="50" x2="62" y2="42" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Grip point */}
      <circle cx="52" cy="52" r="3" fill="rgba(255,255,255,0.9)" />
      {/* Head */}
      <circle cx="40" cy="21" r="7.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      {/* Torso */}
      <line x1="40" y1="29" x2="40" y2="53" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      {/* Sword arm */}
      <line x1="40" y1="35" x2="59" y2="46" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      {/* Off arm */}
      <line x1="40" y1="35" x2="27" y2="43" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" />
      {/* Front leg */}
      <line x1="40" y1="53" x2="53" y2="70" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <line x1="53" y1="70" x2="62" y2="72" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      {/* Back leg */}
      <line x1="40" y1="53" x2="27" y2="65" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" />
      <line x1="27" y1="65" x2="18" y2="67" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" />
      {/* Ground shadow */}
      <ellipse cx="40" cy="78" rx="22" ry="3" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

// Decorative dots pattern for feature slides
function DotsPattern({ color }) {
  return (
    <svg width="160" height="100" viewBox="0 0 160 100" style={{ position: 'absolute', right: -10, top: -10, opacity: 0.08 }}>
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => (
          <circle key={`${row}-${col}`} cx={col * 16 + 8} cy={row * 16 + 8} r="2.5" fill={color} />
        ))
      )}
    </svg>
  );
}

const SLIDES = [
  { id: 'welcome', dark: true },
  {
    id: 'book',
    dark: false,
    icon: 'calendar',
    iconBg: 'var(--brand-tint)',
    iconColor: 'var(--brand)',
    title: 'Book in\n30 seconds.',
    sub: 'Choose your coach, pick a free slot, and confirm with one tap.',
    dotColor: '#3B6FE0',
  },
  {
    id: 'progress',
    dark: false,
    icon: 'chart',
    iconBg: 'var(--steel-tint)',
    iconColor: 'var(--steel)',
    title: 'Track every\nsession.',
    sub: 'Attendance history, coach notes, and your progress — all in one place.',
    dotColor: '#637082',
  },
];

const N = SLIDES.length; // 3 slides
const N_TOTAL = N + 1;   // + sign-in panel

export function AthleteOnboarding({ onContinue }) {
  const [step, setStep] = React.useState(0);
  const [signingIn, setSigningIn] = React.useState(false);

  const isSignIn = step >= N;
  const slide = SLIDES[step] || null;
  const isDark = slide?.dark === true;

  const goNext = () => setStep(s => Math.min(s + 1, N));
  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleSignIn = async () => {
    setSigningIn(true);
    sessionStorage.setItem('auth_return', '/athlete');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* ── Sliding panels ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        width: `${N_TOTAL * 100}%`,
        height: '100%',
        transform: `translateX(-${step * (100 / N_TOTAL)}%)`,
        transition: 'transform 380ms cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
      }}>

        {/* ── Slide 0: Welcome ─── */}
        <div style={{
          width: `${100 / N_TOTAL}%`, height: '100%',
          background: 'linear-gradient(160deg, #1C2A44 0%, #0D1B2F 100%)',
          display: 'flex', flexDirection: 'column', padding: '56px 28px 154px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,224,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

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

          {/* Text */}
          <div style={{ zIndex: 1 }}>
            <h1 className="r-display" style={{ fontSize: 38, color: '#fff', margin: '0 0 12px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
              Your training,<br />your way.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              Book lessons, track progress, and check in — all from your phone.
            </p>
          </div>
        </div>

        {/* ── Slides 1 & 2: Features ─── */}
        {SLIDES.slice(1).map((s) => (
          <div key={s.id} style={{
            width: `${100 / N_TOTAL}%`, height: '100%',
            background: 'var(--paper)',
            display: 'flex', flexDirection: 'column', padding: '72px 28px 154px',
            position: 'relative', overflow: 'hidden',
          }}>
            <DotsPattern color={s.dotColor} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Icon */}
              <div style={{
                width: 84, height: 84, borderRadius: 22,
                background: s.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 30,
                animation: 'r-pop 400ms var(--e-spring) both',
              }}>
                <Icon name={s.icon} size={42} color={s.iconColor} strokeWidth={1.6} />
              </div>

              {/* Text */}
              <h2 className="r-display" style={{ fontSize: 36, color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.08, whiteSpace: 'pre-line' }}>
                {s.title}
              </h2>
              <p style={{ fontSize: 15.5, color: 'var(--muted)', lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
                {s.sub}
              </p>
            </div>
          </div>
        ))}

        {/* ── Sign-in panel ─── */}
        <div style={{
          width: `${100 / N_TOTAL}%`, height: '100%',
          background: 'var(--paper)',
          display: 'flex', flexDirection: 'column', padding: '60px 28px 40px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RiposteLogo size={26} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>Riposte</div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 className="r-display" style={{ fontSize: 36, color: 'var(--ink)', margin: '0 0 10px', lineHeight: 1.08 }}>
              Let's get<br />started.
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 280 }}>
              Sign in to save your bookings, progress, and training history.
            </p>

            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="r-focusable"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--r-btn)',
                border: '1px solid var(--hairline)', background: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                font: 'inherit', fontSize: 15, fontWeight: 500, color: 'var(--ink)',
                cursor: signingIn ? 'default' : 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'opacity var(--d-fast)',
                opacity: signingIn ? 0.7 : 1,
              }}>
              <GoogleLogo />
              {signingIn ? 'Redirecting…' : 'Continue with Google'}
            </button>
          </div>

          <button
            onClick={onContinue}
            className="r-focusable"
            style={{
              font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent',
              fontSize: 13.5, color: 'var(--faint)', padding: '12px 0', textAlign: 'center',
            }}>
            Continue without account →
          </button>
        </div>
      </div>

      {/* ── Bottom nav (visible on slides 0-2 only) ────────── */}
      {!isSignIn && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 24px 40px',
          background: isDark
            ? 'linear-gradient(to top, rgba(13,27,47,0.96) 70%, transparent)'
            : 'linear-gradient(to top, rgba(255,255,255,0.98) 70%, transparent)',
          animation: 'r-rise var(--d-base) var(--e-enter) both',
        }}>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {SLIDES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3,
                width: i === step ? 22 : 5,
                background: isDark ? '#fff' : 'var(--brand)',
                opacity: i === step ? 1 : 0.25,
                transition: 'width 280ms var(--e-standard), opacity 280ms',
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
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

            <button onClick={goNext} className="r-focusable" style={{
              flex: 2, padding: 14, font: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 600,
              background: isDark ? '#fff' : 'var(--brand)',
              color: isDark ? '#1C2A44' : '#fff',
              border: 'none', borderRadius: 'var(--r-btn)',
              boxShadow: isDark ? '0 4px 16px rgba(255,255,255,0.1)' : '0 4px 16px rgba(59,111,224,0.3)',
            }}>
              {step === N - 1 ? 'Sign in' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes r-pop {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
