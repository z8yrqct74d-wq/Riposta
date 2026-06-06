// ============================================================
// RIPOSTE — D1 Auth · D2 Empty states · D3 Error/offline · D5 Skeletons
// All cross-cutting. Mounted standalone in auth.html or injected.
// ============================================================

// ---- D1 AUTH — magic-link ----
function AuthApp() {
  const [step, setStep] = React.useState('input'); // input | sent | landing
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState(null);

  const send = () => { if (!email.includes('@')) return; setStep('sent'); };
  const arrive = (r) => { setRole(r); setStep('landing'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {step === 'input' && (
          <div style={{ animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <RiposteLogo size={30} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 540, color: 'var(--ink)' }}>Riposte</span>
            </div>
            <h1 className="r-display" style={{ fontSize: 36, margin: '0 0 8px', color: 'var(--ink)' }}>Sign in.</h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 32px', lineHeight: 1.5 }}>We'll send a sign-in link to your email — no password needed.</p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Email address</div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="you@example.com" autoFocus className="r-focusable"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--surface)', font: 'inherit', fontSize: 15, color: 'var(--ink)', boxSizing: 'border-box', transition: 'border-color var(--d-fast)' }}
              />
            </div>
            <button onClick={send} className="r-focusable" style={{ width: '100%', padding: 14, borderRadius: 'var(--r-btn)', border: 'none', background: email.includes('@') ? 'var(--brand)' : 'var(--hairline)', color: email.includes('@') ? '#fff' : 'var(--faint)', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: email.includes('@') ? 'pointer' : 'default', transition: 'background var(--d-fast)' }}>
              Send sign-in link
            </button>
            <div style={{ marginTop: 32, padding: '14px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Demo — jump straight in</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['Admin',  'admin@riposte.ro'], ['Coach', 'sandu@riposte.ro'], ['Athlete', 'maya@riposte.ro']].map(([role, em]) => (
                  <button key={role} onClick={() => { setEmail(em); setTimeout(() => arrive(role.toLowerCase()), 200); }} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--steel-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--steel)', flexShrink: 0 }}>{role[0]}</span>
                    {role} <span style={{ color: 'var(--faint)', fontSize: 12, marginLeft: 4 }}>{em}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 'sent' && (
          <div style={{ textAlign: 'center', animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--success-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Icon name="message" size={28} color="var(--success)" />
            </div>
            <h1 className="r-display" style={{ fontSize: 28, margin: '0 0 10px', color: 'var(--ink)' }}>Check your email.</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 28px' }}>We sent a link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. It expires in 15 minutes.</p>
            <button onClick={() => setStep('input')} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid var(--hairline)', background: 'transparent', borderRadius: 'var(--r-btn)', padding: '10px 20px', fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>Use a different email</button>
            <div style={{ marginTop: 24, padding: '12px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)' }}>
              <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 8 }}>Simulate link click:</div>
              {[['admin','Admin console'],['coach','Coach console'],['athlete','Athlete app']].map(([r, l]) => (
                <button key={r} onClick={() => arrive(r)} className="r-focusable" style={{ display: 'block', width: '100%', font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', padding: '6px', fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>{l} →</button>
              ))}
            </div>
          </div>
        )}
        {step === 'landing' && <RoleAwareLanding role={role} />}
      </div>
    </div>
  );
}

function RoleAwareLanding({ role }) {
  const map = {
    admin:   { label: 'Admin',   dest: 'admin.html',  desc: 'Opening Admin console…', color: 'var(--ink)' },
    coach:   { label: 'Coach',   dest: 'coach.html',  desc: 'Opening Coach console…', color: 'var(--ink)' },
    athlete: { label: 'Athlete', dest: 'parent.html', desc: 'Opening Athlete app…',   color: 'var(--ink)' },
  };
  const m = map[role] || map.athlete;
  React.useEffect(() => { const t = setTimeout(() => { window.location.href = m.dest; }, 1800); return () => clearTimeout(t); }, [role]);
  return (
    <div style={{ textAlign: 'center', animation: 'r-rise var(--d-base) var(--e-enter) both' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--success-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon name="check" size={28} color="var(--success)" strokeWidth={2.5} />
      </div>
      <h1 className="r-display" style={{ fontSize: 28, margin: '0 0 8px', color: 'var(--ink)' }}>You're in.</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px' }}>{m.label} account · {m.desc}</p>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', opacity: 0.4, animation: `r-live-pulse 1s ease-in-out ${i*200}ms infinite` }} />)}
      </div>
    </div>
  );
}

function RiposteLogo({ size = 26, color = 'var(--brand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M7 17 L17 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 17 L15 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <circle cx="7" cy="17" r="1.4" fill={color} />
    </svg>
  );
}

// ---- D2 EMPTY STATES ----
function EmptyState({ title, sub, action, actionLabel }) {
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

function FencerLineart() {
  // simple line-art fencer silhouette in SVG
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--hairline)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* blade */}
      <line x1="62" y1="42" x2="88" y2="18" stroke="var(--faint)" />
      {/* guard */}
      <path d="M60 44 A4 4 0 0 0 68 38" />
      {/* grip + pommel */}
      <line x1="55" y1="49" x2="62" y2="42" strokeWidth="3" />
      <circle cx="53" cy="51" r="2.5" fill="var(--hairline)" />
      {/* body en garde */}
      <circle cx="40" cy="22" r="7" /> {/* head */}
      <line x1="40" y1="29" x2="40" y2="52" /> {/* torso */}
      <line x1="40" y1="35" x2="58" y2="45" /> {/* sword arm */}
      <line x1="40" y1="35" x2="28" y2="42" /> {/* rear arm */}
      <line x1="40" y1="52" x2="52" y2="68" /> {/* front leg */}
      <line x1="52" y1="68" x2="60" y2="70" /> {/* front foot */}
      <line x1="40" y1="52" x2="28" y2="64" /> {/* rear leg */}
      <line x1="28" y1="64" x2="20" y2="66" /> {/* rear foot */}
    </svg>
  );
}

// Named empty states
const EMPTY_STATES = {
  members: { title: 'No members yet.', sub: "Add your first athlete to get started. They'll receive an invitation email and can set up their profile." },
  calendar: { title: 'Nothing scheduled.', sub: 'Click any lane to create a session or lesson block, or use New block above.' },
  lessons: { title: 'No lessons booked.', sub: "When athletes book individual lessons they'll appear here." },
  coaches: { title: 'No coaches added.', sub: 'Add a coach to start scheduling sessions and individual lessons.' },
  payments: { title: 'All paid up.', sub: 'No outstanding payments right now.' },
  progress: { title: 'No notes yet.',        sub: "After a lesson is completed with a note, you'll see the progress timeline here." },
  search: { title: 'No results.', sub: 'Try a different search term or adjust your filters.' },
};

// ---- D3 ERROR / OFFLINE ----
function OfflineBanner({ onRetry }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: 'var(--ink)', color: 'var(--paper)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 -4px 16px rgba(0,0,0,0.2)', animation: 'r-rise var(--d-base) var(--e-enter) both' }}>
      <Icon name="cloudOff" size={18} color="var(--paper)" />
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>You're offline. Changes will sync when you reconnect.</span>
      <button onClick={onRetry} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'var(--paper)', borderRadius: 'var(--r-btn)', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>Retry</button>
    </div>
  );
}

function ErrorState({ title, sub, onRetry }) {
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

// ---- D4 PERMISSION GATE ----
function PermissionGate({ role = 'athlete' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--paper)', padding: 32, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--steel-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon name="lock" size={24} color="var(--steel)" />
      </div>
      <h1 className="r-display" style={{ fontSize: 28, color: 'var(--ink)', margin: '0 0 8px' }}>Access restricted.</h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 300 }}>Your {role} account doesn't have permission to view this page. Contact your club admin.</p>
      <a href="parent.html" style={{ display: 'inline-block', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--r-btn)', padding: '11px 22px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Go to my app</a>
    </div>
  );
}

// ---- D5 SKELETONS ----
function SkeletonBlock({ w = '100%', h = 16, style = {} }) {
  return <div className="r-skeleton" style={{ width: w, height: h, borderRadius: 6, ...style }} />;
}

function DashboardSkeleton() {
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

function TableSkeleton({ rows = 6 }) {
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

function MobileCardsSkeleton({ count = 3 }) {
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

Object.assign(window, {
  AuthApp, RiposteLogo, EmptyState, FencerLineart, EMPTY_STATES,
  OfflineBanner, ErrorState, PermissionGate,
  SkeletonBlock, DashboardSkeleton, TableSkeleton, MobileCardsSkeleton,
});
