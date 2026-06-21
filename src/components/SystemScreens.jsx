import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { Icon } from './Shared';
import { supabase } from '../lib/supabase';
import { isNative, NATIVE_REDIRECT } from '../lib/native';

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


export function RiposteLogo({ size = 26, color = 'var(--brand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M7 17 L17 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 17 L15 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <circle cx="7" cy="17" r="1.4" fill={color} />
    </svg>
  );
}

export function AuthApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(null);

  const signIn = async (provider) => {
    setLoading(provider);
    if (isNative()) {
      const { data } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
      });
      if (data?.url) await Browser.open({ url: data.url });
    } else {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + '/auth/callback' },
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <RiposteLogo size={30} />
          <span className="r-display" style={{ fontSize: 22, color: 'var(--ink)' }}>Riposte</span>
        </div>
        <h1 className="r-display" style={{ fontSize: 36, margin: '0 0 8px', color: 'var(--ink)' }}>Sign in.</h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 36px', lineHeight: 1.5 }}>
          Use your existing account — no password needed.
        </p>

        <button
          onClick={() => signIn('google')}
          disabled={!!loading}
          className="r-focusable"
          style={{ width: '100%', padding: '13px 16px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, font: 'inherit', fontSize: 15, fontWeight: 500, color: 'var(--ink)', cursor: loading ? 'default' : 'pointer', transition: 'opacity var(--d-fast)' }}
        >
          <GoogleLogo />
          {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <button onClick={() => navigate('/')} className="r-focusable" style={{ marginTop: 28, width: '100%', font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--faint)', padding: 8 }}>
          ← Back
        </button>
      </div>
    </div>
  );
}

export function FencerLineart() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--hairline)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="62" y1="42" x2="88" y2="18" stroke="var(--faint)" />
      <path d="M60 44 A4 4 0 0 0 68 38" />
      <line x1="55" y1="49" x2="62" y2="42" strokeWidth="3" />
      <circle cx="53" cy="51" r="2.5" fill="var(--hairline)" />
      <circle cx="40" cy="22" r="7" />
      <line x1="40" y1="29" x2="40" y2="52" />
      <line x1="40" y1="35" x2="58" y2="45" />
      <line x1="40" y1="35" x2="28" y2="42" />
      <line x1="40" y1="52" x2="52" y2="68" />
      <line x1="52" y1="68" x2="60" y2="70" />
      <line x1="40" y1="52" x2="28" y2="64" />
      <line x1="28" y1="64" x2="20" y2="66" />
    </svg>
  );
}

export function EmptyState({ title, sub, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
      <FencerLineart />
      <h2 className="r-display" style={{ fontSize: 26, color: 'var(--ink)', margin: '24px 0 8px' }}>{title}</h2>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 320 }}>{sub}</p>
      {action && (
        <button onClick={action} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-btn)', padding: '11px 22px', fontSize: 14, fontWeight: 600 }}>{actionLabel}</button>
      )}
    </div>
  );
}

export const EMPTY_STATES = {
  members:  { title: 'No members yet.',      sub: "Add your first athlete to get started. They'll receive an invitation email and can set up their profile." },
  calendar: { title: 'Nothing scheduled.',   sub: 'Click any lane to create a session or lesson block, or use New block above.' },
  lessons:  { title: 'No lessons booked.',   sub: "When athletes book individual lessons they'll appear here." },
  coaches:  { title: 'No coaches added.',    sub: 'Add a coach to start scheduling sessions and individual lessons.' },
  payments: { title: 'All paid up.',         sub: 'No outstanding payments right now.' },
  progress: { title: 'No notes yet.',        sub: "After a lesson is completed with a note, you'll see the progress timeline here." },
  search:   { title: 'No results.',          sub: 'Try a different search term or adjust your filters.' },
};

export function OfflineBanner({ onRetry }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: 'var(--ink)', color: 'var(--paper)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 -4px 16px rgba(0,0,0,0.2)', animation: 'r-rise var(--d-base) var(--e-enter) both' }}>
      <Icon name="cloudOff" size={18} color="var(--paper)" />
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>You're offline. Changes will sync when you reconnect.</span>
      <button onClick={onRetry} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'var(--paper)', borderRadius: 'var(--r-btn)', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>Retry</button>
    </div>
  );
}

export function ErrorState({ title, sub, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon name="refresh" size={24} color="var(--danger)" />
      </div>
      <h2 className="r-display" style={{ fontSize: 24, color: 'var(--ink)', margin: '0 0 8px' }}>{title || 'Something went wrong.'}</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 320 }}>{sub || "We couldn't load this page. Check your connection and try again."}</p>
      <button onClick={onRetry || (() => {})} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--r-btn)', padding: '11px 22px', fontSize: 14, fontWeight: 600 }}>Try again</button>
    </div>
  );
}

export function PermissionGate({ role = 'athlete' }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--paper)', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--steel-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon name="lock" size={24} color="var(--steel)" />
      </div>
      <h1 className="r-display" style={{ fontSize: 28, color: 'var(--ink)', margin: '0 0 8px' }}>Access restricted.</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 300 }}>Your {role} account doesn't have permission to view this page. Contact your club admin.</p>
      <button onClick={() => navigate('/athlete')} style={{ display: 'inline-block', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--r-btn)', padding: '11px 22px', fontSize: 14, fontWeight: 600, textDecoration: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Go to my app</button>
    </div>
  );
}

function SkeletonBlock({ w = '100%', h = 16, style = {} }) {
  return <div className="r-skeleton" style={{ width: w, height: h, borderRadius: 6, ...style }} />;
}

export function DashboardSkeleton() {
  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonBlock w="40%" h={11} />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SkeletonBlock w={40} h={12} style={{ flexShrink: 0 }} />
            <SkeletonBlock w={3} h={36} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBlock w="60%" h={13} />
              <SkeletonBlock w="40%" h={11} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 18 }}>
          <SkeletonBlock w="50%" h={11} style={{ marginBottom: 14 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80 }}>
            {[70, 55, 85, 45, 30].map((h, i) => <SkeletonBlock key={i} w="100%" h={h} style={{ alignSelf: 'flex-end' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[1,2].map(i => (
            <div key={i} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonBlock w="60%" h={11} />
              <SkeletonBlock w="40%" h={28} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden', margin: 24 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', gap: 16 }}>
        {[22, 14, 18, 10, 12, 14, 10].map((w, i) => <SkeletonBlock key={i} w={`${w}%`} h={11} />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 16px', borderBottom: i < rows-1 ? '1px solid var(--hairline)' : 'none', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '22%' }}>
            <SkeletonBlock w={30} h={30} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <SkeletonBlock w="70%" h={13} />
          </div>
          {[14, 18, 10, 12, 14, 10].map((w, j) => <SkeletonBlock key={j} w={`${w}%`} h={13} />)}
        </div>
      ))}
    </div>
  );
}

export function MobileCardsSkeleton({ count = 3 }) {
  return (
    <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderLeft: '3px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <SkeletonBlock w={36} h={36} style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <SkeletonBlock w="55%" h={14} />
            <SkeletonBlock w="35%" h={11} />
          </div>
        </div>
      ))}
    </div>
  );
}
