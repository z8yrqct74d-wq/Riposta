import React from 'react';
import { Icon, PaymentPill } from '../../components/Shared';
import { IOSDevice } from '../../components/IOSFrame';
import { WeaponGlyph } from '../../components/Shared';
import { BookFlow } from './AthleteBook';
import { ScheduleScreen, PaymentsScreen, ProgressScreen, CheckinScreen, ColorBarRow } from './AthleteMisc';
import { ProfileScreen } from './AthleteMisc';
import { getMember, createBooking, upsertMemberFromAuth, getUpcomingBookings } from '../../lib/db';
import { supabase } from '../../lib/supabase';

function coachShortName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : fullName;
}

function bookingDayLabel(b) {
  if (!b?.slot_date) return 'Today';
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(b.slot_date + 'T12:00:00');
  if (b.slot_date === today) return 'Today';
  if (b.slot_date === tomorrow) return 'Tomorrow';
  return `${DOWS[d.getDay()]} ${d.getDate()}`;
}

function timeUntil(b) {
  if (!b?.slot_date || !b?.slot_time) return null;
  const [h, m] = b.slot_time.split(':').map(Number);
  const target = new Date(b.slot_date + 'T00:00:00');
  target.setHours(h, m, 0, 0);
  const diffMs = target - new Date();
  if (diffMs <= 0) return null;
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours === 0) return `${mins}m`;
  return `${hours}h`;
}

function CreditMeter({ total = 6, used = 1, compact }) {
  const left = total - used;
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: compact ? 6 : 8, borderRadius: 'var(--r-pill)',
            background: i < left ? 'var(--brand)' : 'var(--hairline)',
            transition: 'background var(--d-base)',
          }} />
        ))}
      </div>
    </div>
  );
}

function AlertChip({ tone, icon, children, onClick }) {
  const map = {
    warning: ['var(--warning)', 'var(--warning-tint)'],
    danger: ['var(--danger)', 'var(--danger-tint)'],
  };
  const [fg, bg] = map[tone] || map.warning;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={onClick ? 'r-focusable' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: bg, color: fg, padding: '7px 12px', borderRadius: 'var(--r-pill)', fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', border: 'none', font: 'inherit', cursor: onClick ? 'pointer' : 'default' }}>
      <Icon name={icon} size={14} color={fg} /> {children}
    </Tag>
  );
}

function HomeScreen({ credits, user, member, upcomingBookings, onBook, onCheckin, onTab, onGoProfile }) {
  const firstName = React.useMemo(() => {
    const name = user?.user_metadata?.full_name || member?.name || '';
    return name.split(' ')[0] || 'there';
  }, [user, member]);

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  const todayLabel = React.useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  const nextLesson = upcomingBookings?.[0] ?? null;
  const showCertAlert = member?.visa_status === 'expiring' || member?.visa_status === 'expired';
  const showPayAlert = member?.pay_status === 'due' || member?.pay_status === 'overdue';
  const creditTotal = Math.max(credits, 1);

  return (
    <div style={{ height: '100%' }}>
      <div className="r-scroll" style={{ overflowY: 'auto', height: '100%', paddingBottom: 100 }}>
        <div style={{ padding: '56px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{todayLabel}</div>
            <h1 className="r-display" style={{ margin: '4px 0 0', fontSize: 30, color: 'var(--ink)', lineHeight: 1.12 }}>{greeting},<br/>{firstName}.</h1>
          </div>
          <button onClick={onCheckin} className="r-focusable" style={{ width: 40, height: 40, borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="qr" size={20} color="var(--ink)" />
          </button>
        </div>

        <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(showCertAlert || showPayAlert) && (
            <div className="r-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', animation: 'r-rise var(--d-base) var(--e-enter) both' }}>
              {showCertAlert && (
                <AlertChip tone="warning" icon="clock" onClick={() => onGoProfile('compliance')}>
                  Medical certificate {member.visa_status === 'expired' ? 'expired' : 'expires soon'}
                </AlertChip>
              )}
              {showPayAlert && (
                <AlertChip tone="danger" icon="money" onClick={() => onTab('payments')}>
                  {member.pay_status === 'overdue' ? 'Payment overdue' : `Payment due`}
                </AlertChip>
              )}
            </div>
          )}

          <div style={{ animation: 'r-rise var(--d-base) var(--e-enter) 40ms both' }}>
            {nextLesson ? (
              <ColorBarRow bar="var(--brand)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand)' }}>Next · {bookingDayLabel(nextLesson)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <WeaponGlyph type={nextLesson.weapon || 'sabre'} size={22} />
                      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Lesson · {coachShortName(nextLesson.coaches?.name || nextLesson.coach_id || '')}</span>
                    </div>
                    <div className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{nextLesson.slot_time} · {nextLesson.piste || 'Riposte Main Room'} · 45 min</div>
                  </div>
                  {timeUntil(nextLesson) && (
                    <div style={{ textAlign: 'center', paddingLeft: 8 }}>
                      <div className="r-display r-tabular" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>{timeUntil(nextLesson)}</div>
                      <div style={{ fontSize: 11, color: 'var(--faint)' }}>away</div>
                    </div>
                  )}
                </div>
              </ColorBarRow>
            ) : (
              <ColorBarRow bar="var(--hairline)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--muted)' }}>No upcoming lessons</div>
                    <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 2 }}>Book your next session below</div>
                  </div>
                </div>
              </ColorBarRow>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, animation: 'r-rise var(--d-base) var(--e-enter) 80ms both' }}>
            <div style={{ flex: 1.3, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Lesson credits</span>
                <span className="r-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{credits}<span style={{ fontSize: 12, color: 'var(--faint)' }}>/{creditTotal}</span></span>
              </div>
              <CreditMeter total={creditTotal} used={creditTotal - credits} />
            </div>
            <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Account</span>
              <div style={{ marginTop: 8 }}><PaymentPill status={member?.pay_status || 'paid'} /></div>
            </div>
          </div>

          <button onClick={onBook} className="r-focusable" style={{ animation: 'r-rise var(--d-base) var(--e-enter) 120ms both', font: 'inherit', cursor: 'pointer', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--r-card)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-rest)' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Book a lesson</div>
              <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>Pick a coach & a free piste</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-pill)', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} color="#fff" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',     label: 'Home',     icon: 'home' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'payments', label: 'Pay',      icon: 'card' },
    { id: 'progress', label: 'Progress', icon: 'chart' },
    { id: 'profile',  label: 'Profile',  icon: 'user' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'color-mix(in oklab, var(--surface) 86%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid var(--hairline)', paddingBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px 4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 6px', flex: 1 }}>
            <Icon name={t.icon} size={22} color={active === t.id ? 'var(--brand)' : 'var(--faint)'} strokeWidth={active === t.id ? 2 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: active === t.id ? 600 : 500, color: active === t.id ? 'var(--brand)' : 'var(--faint)' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AthleteApp() {
  const [tab, setTab] = React.useState('home');
  const [profileSection, setProfileSection] = React.useState(null);
  const [booking, setBooking] = React.useState(false);
  const [checkin, setCheckin] = React.useState(false);
  const [credits, setCredits] = React.useState(0);
  const [memberId, setMemberId] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [member, setMember] = React.useState(null);
  const [upcomingBookings, setUpcomingBookings] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;

    async function loadFromSession(session) {
      if (!session?.user) return;
      const u = session.user;
      if (mounted) setUser(u);
      try {
        const m = await upsertMemberFromAuth(u);
        if (!mounted) return;
        setMember(m);
        setCredits(m.credits ?? 0);
        setMemberId(m.id);
        const bkgs = await getUpcomingBookings(m.id);
        if (mounted) setUpcomingBookings(bkgs);
      } catch (e) {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadFromSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadFromSession(session);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) { setUser(null); setMember(null); setMemberId(null); setCredits(0); setUpcomingBookings([]); }
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const refreshData = React.useCallback(async () => {
    if (!memberId) return;
    try {
      const [m, bkgs] = await Promise.all([getMember(memberId), getUpcomingBookings(memberId)]);
      if (m) { setCredits(m.credits ?? 0); setMember(m); }
      setUpcomingBookings(bkgs);
    } catch (e) {}
  }, [memberId]);

  const goProfile = (section) => {
    setProfileSection(section);
    setTab('profile');
  };

  const changeTab = (id) => {
    if (id !== 'profile') setProfileSection(null);
    setTab(id);
  };

  const handleBooked = async (slot) => {
    setCredits(c => c - 1);
    if (memberId && slot) {
      try {
        await createBooking({
          member_id: memberId,
          coach_id: slot.coachId ?? null,
          slot_date: slot.date ?? null,
          slot_time: slot.time ?? null,
          piste: slot.piste ?? null,
          weapon: slot.weapon ?? null,
        });
        const bkgs = await getUpcomingBookings(memberId);
        setUpcomingBookings(bkgs);
      } catch (e) {}
    }
  };

  const screens = {
    home:     <HomeScreen credits={credits} user={user} member={member} upcomingBookings={upcomingBookings} onBook={() => setBooking(true)} onCheckin={() => setCheckin(true)} onTab={changeTab} onGoProfile={goProfile} />,
    schedule: <ScheduleScreen memberId={memberId} bookings={upcomingBookings} onRefresh={refreshData} />,
    payments: <PaymentsScreen />,
    progress: <ProgressScreen memberId={memberId} />,
    profile:  <ProfileScreen user={user} member={member} focusSection={profileSection} />,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)', overflow: 'hidden' }}>
      <div key={tab} style={{ position: 'absolute', inset: 0, animation: 'r-fade var(--d-base) var(--e-standard)' }}>
        {screens[tab]}
      </div>
      {!booking && !checkin && <TabBar active={tab} onChange={changeTab} />}

      {booking && (
        <BookFlow credits={credits} onClose={() => setBooking(false)} onBooked={(slot) => {
          handleBooked(slot);
        }} />
      )}
      {checkin && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 70, animation: 'r-sheet-up 240ms var(--e-enter) both' }}>
          <CheckinScreen member={member} />
          <button onClick={() => setCheckin(false)} className="r-focusable" style={{ position: 'absolute', top: 58, right: 18, width: 36, height: 36, borderRadius: 'var(--r-pill)', border: 'none', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 80 }}>
            <Icon name="x" size={18} color="#fff" />
          </button>
        </div>
      )}
      <style>{`
        @keyframes r-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes r-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export function AthleteAppPage() {
  const mobile = window.innerWidth < 500;
  if (mobile) {
    return (
      <div style={{ height: '100dvh', overflow: 'hidden', background: 'var(--paper)' }}>
        <AthleteApp />
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', background: '#243659', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <IOSDevice>
        <AthleteApp />
      </IOSDevice>
    </div>
  );
}
