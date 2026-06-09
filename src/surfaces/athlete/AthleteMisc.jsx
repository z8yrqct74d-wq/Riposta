import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WeaponGlyph, WEAPON_LABEL, Icon, Avatar, PaymentPill, VisaBadge } from '../../components/Shared';
import { PrimaryBtn, SuccessRing } from './AthleteBook';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { cancelBooking, getMember, updateMember, updateMemberCredits, getBookingsForMember, getNotesForMember, updateMemberDocument, uploadMemberDocument, getEmergencyContacts, addEmergencyContact, setPrimaryContact, deleteEmergencyContact } from '../../lib/db';

const PLAN_OPTIONS = [
  { value: 'Trial',       label: 'Trial' },
  { value: 'Lesson pack', label: 'Lesson pack' },
  { value: 'Monthly',     label: 'Monthly' },
  { value: 'Competitor',  label: 'Competitor' },
  { value: 'Drop-in',     label: 'Drop-in' },
];

const WEAPON_OPTIONS = [
  { value: 'foil',  label: 'Foil' },
  { value: 'epee',  label: 'Épée' },
  { value: 'sabre', label: 'Sabre' },
];

const CATEGORY_OPTIONS = [
  { value: 'U9',      label: 'Under 9',  sub: 'U9' },
  { value: 'U11',     label: 'Under 11', sub: 'U11' },
  { value: 'U14',     label: 'Under 14', sub: 'U14' },
  { value: 'U17',     label: 'Under 17', sub: 'U17' },
  { value: 'U20',     label: 'Under 20', sub: 'U20' },
  { value: 'Senior',  label: 'Senior' },
  { value: 'Veteran', label: 'Veteran' },
  { value: 'Amateur', label: 'Amateur' },
];

export function PageHead({ greeting, title }) {
  return (
    <div style={{ padding: '56px 20px 8px' }}>
      {greeting && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>{greeting}</div>}
      <h1 className="r-display" style={{ margin: 0, fontSize: 30, color: 'var(--ink)' }}>{title}</h1>
    </div>
  );
}

export function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 2px' }}>{children}</div>;
}

export function ColorBarRow({ bar, children, onClick }) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', background: 'var(--surface)', border: '1px solid var(--hairline)',
      borderRadius: 'var(--r-card)', padding: '13px 14px 13px 18px', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: bar }} />
      {children}
    </div>
  );
}

export function BottomSheet({ children, onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,21,15,0.4)', animation: 'r-scrim var(--d-base) ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--surface)', borderRadius: '18px 18px 0 0', paddingTop: 8, animation: 'r-sheet-up 240ms var(--e-enter) both', boxShadow: '0 -8px 30px rgba(23,21,15,0.18)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 3, background: 'var(--hairline)', margin: '0 auto 10px' }} />
        {children}
      </div>
      <style>{`
        @keyframes r-scrim { from { opacity: 0; } to { opacity: 1; } }
        @keyframes r-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function coachShort(id) {
  const MAP = { sandu: 'C. Sandu', dina: 'L. Dina' };
  return MAP[id] || id;
}

function bookingDayLabel(b) {
  if (!b?.slot_date) return 'Today';
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(b.slot_date + 'T12:00:00');
  if (b.slot_date === today) return 'Today';
  if (b.slot_date === tomorrow) return 'Fri ' + d.getDate();
  return `${DOWS[d.getDay()]} ${d.getDate()}`;
}

function canRefundBooking(b) {
  if (!b?.slot_date || !b?.slot_time) return true;
  const [h, m] = b.slot_time.split(':').map(Number);
  const target = new Date(b.slot_date + 'T00:00:00');
  target.setHours(h, m, 0, 0);
  return target - new Date() > 12 * 3600 * 1000;
}

export function ScheduleScreen({ memberId, bookings: initialBookings, onRefresh }) {
  const [items, setItems] = React.useState(initialBookings || []);
  const [confirm, setConfirm] = React.useState(null);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    setItems(initialBookings || []);
  }, [initialBookings]);

  const item = items.find(b => b.id === confirm);
  const itemCanRefund = item ? canRefundBooking(item) : false;

  const handleCancel = async () => {
    if (!item) return;
    setCancelling(true);
    try {
      await cancelBooking(item.id);
      if (itemCanRefund && memberId) {
        const m = await getMember(memberId);
        if (m) await updateMemberCredits(memberId, (m.credits || 0) + 1);
      }
      setItems(prev => prev.filter(x => x.id !== item.id));
      onRefresh && onRefresh();
    } catch (e) {}
    setCancelling(false);
    setConfirm(null);
  };

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <PageHead title="Schedule" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--muted)' }}>
            <div className="r-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Nothing scheduled.</div>
            <div style={{ fontSize: 13.5 }}>Book a lesson from the home screen.</div>
          </div>
        ) : items.map((b, i) => {
          const when = `${bookingDayLabel(b)} · ${b.slot_time}`;
          const displayName = b.coaches?.name ? coachShort(b.coach_id) : coachShort(b.coach_id);
          return (
            <div key={b.id} style={{ animation: `r-rise var(--d-base) var(--e-enter) ${i * 40}ms both` }}>
              <ColorBarRow bar="var(--brand)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <WeaponGlyph type={b.weapon || 'sabre'} size={22} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{displayName}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--faint)' }}>Lesson</span>
                    </div>
                    <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{when} · {b.piste || 'Riposte Main Room'}</div>
                  </div>
                  <button onClick={() => setConfirm(b.id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', background: 'transparent', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: '5px 11px' }}>Cancel</button>
                </div>
              </ColorBarRow>
            </div>
          );
        })}
      </div>
      {item && (
        <BottomSheet onClose={() => setConfirm(null)}>
          <div style={{ padding: '8px 20px 30px' }}>
            <h2 className="r-display" style={{ fontSize: 22, color: 'var(--ink)', margin: '0 0 8px' }}>Cancel this lesson?</h2>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 18px' }}>
              {coachShort(item.coach_id)} · {bookingDayLabel(item)} at {item.slot_time}.{' '}
              {itemCanRefund
                ? <>You're outside the 12-hour window, so your <strong style={{ color: 'var(--success)' }}>credit will be refunded</strong>.</>
                : <>You're inside the 12-hour window, so this <strong style={{ color: 'var(--danger)' }}>credit will be forfeited</strong>.</>}
            </p>
            <button onClick={handleCancel} disabled={cancelling} className="r-focusable" style={{
              width: '100%', padding: 14, borderRadius: 'var(--r-btn)', cursor: cancelling ? 'default' : 'pointer', font: 'inherit', fontSize: 15, fontWeight: 600,
              marginBottom: 8, background: 'transparent', color: 'var(--brand)', border: '1px solid var(--brand)',
            }}>{cancelling ? 'Cancelling…' : itemCanRefund ? 'Cancel & refund credit' : 'Cancel & forfeit credit'}</button>
            <button onClick={() => setConfirm(null)} className="r-focusable" style={{ width: '100%', padding: 14, borderRadius: 'var(--r-btn)', cursor: 'pointer', font: 'inherit', fontSize: 15, fontWeight: 600, background: 'var(--ink)', color: 'var(--paper)', border: 'none' }}>Keep lesson</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function XMoneySheet({ paid, onPay, onDone }) {
  return (
    <div style={{ padding: '4px 20px 30px', textAlign: 'center' }}>
      {!paid ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="lock" size={14} color="var(--faint)" />
            <span style={{ fontSize: 12, color: 'var(--faint)' }}>Secured by xMoney</span>
          </div>
          <div className="r-display" style={{ fontSize: 34, color: 'var(--ink)' }}>€45.00</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 20px' }}>June squad fees</div>
          <div style={{ background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, textAlign: 'left' }}>
            <Icon name="card" size={20} color="var(--steel)" />
            <span className="r-mono" style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>•••• 4291</span>
            <Icon name="check" size={16} color="var(--success)" strokeWidth={2} />
          </div>
          <PrimaryBtn onClick={onPay}>Pay €45.00</PrimaryBtn>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 14px' }}><SuccessRing size={84} /></div>
          <div className="r-display" style={{ fontSize: 24, color: 'var(--ink)' }}>Payment received</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 20px' }}>A receipt is on its way to your inbox.</div>
          <PrimaryBtn onClick={onDone}>Done</PrimaryBtn>
        </>
      )}
    </div>
  );
}

export function PaymentsScreen() {
  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Blurred background content ───────────────────── */}
      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.55 }}>
        <PageHead title="Payments" />
        <div style={{ padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Current plan</div>
                <div className="r-display" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 4 }}>Competitor · Monthly</div>
              </div>
              <PaymentPill status="paid" />
            </div>
            <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>Renews 1 Jul · €120/mo · 6 lesson credits</div>
          </div>
          <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-card)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Buy a lesson package</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>5 / 10 / 20 credits · save up to 15%</div>
            </div>
            <Icon name="chevR" size={20} color="rgba(255,255,255,0.5)" />
          </div>
          <div>
            <SectionLabel>Outstanding</SectionLabel>
            <ColorBarRow bar="var(--warning)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>June squad fees</div>
                  <div className="r-tabular" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Due 10 Jun · <span className="r-mono">INV-0461</span></div>
                </div>
                <span className="r-tabular" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>€45.00</span>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'var(--brand)', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>Pay</div>
              </div>
            </ColorBarRow>
          </div>
          <div>
            <SectionLabel>History</SectionLabel>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
              {[['1 Jun', 'Monthly subscription', '€120.00', 'paid'], ['18 May', '10-credit package', '€220.00', 'paid'], ['1 May', 'Monthly subscription', '€120.00', 'paid']].map((r, i, a) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < a.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                  <span className="r-tabular" style={{ fontSize: 12, color: 'var(--faint)', width: 46 }}>{r[0]}</span>
                  <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)' }}>{r[1]}</span>
                  <span className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)' }}>{r[2]}</span>
                  <PaymentPill status={r[3]} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Coming soon overlay ──────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 28,
        animation: 'r-rise var(--d-slow) var(--e-enter) 60ms both',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.9)',
          borderRadius: 24,
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 12px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
          width: '100%',
          maxWidth: 300,
        }}>
          {/* Icon */}
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="card" size={28} color="var(--brand)" strokeWidth={1.6} />
          </div>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', borderRadius: 'var(--r-pill)', padding: '4px 11px', marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Coming soon</span>
          </div>

          <h2 className="r-display" style={{ fontSize: 22, color: 'var(--ink)', margin: '0 0 10px' }}>Payments</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
            We're setting up secure payments. Fees, lesson credits, and invoices will all live here.
          </p>
        </div>
      </div>

    </div>
  );
}

function buildDayHistory(allBookings) {
  const now = new Date();
  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const result = [];
  for (let d = 27; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    day.setHours(0, 0, 0, 0);
    const dayStr = day.toISOString().split('T')[0];
    const att = (allBookings || []).some(b => b.slot_date === dayStr && b.status !== 'cancelled');
    result.push({ label: String(day.getDate()), dow: DOW[day.getDay()], att });
  }
  return result;
}

function buildWeekHistory(allBookings) {
  const now = new Date();
  const result = [];
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const att = (allBookings || []).some(b => {
      if (!b.slot_date || b.status === 'cancelled') return false;
      const d = new Date(b.slot_date + 'T12:00:00');
      return d >= weekStart && d <= weekEnd;
    });
    result.push({ label: `W${12 - w}`, att });
  }
  return result;
}

function buildMonthHistory(allBookings) {
  const now = new Date();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];
  for (let mo = 5; mo >= 0; mo--) {
    const d = new Date(now.getFullYear(), now.getMonth() - mo, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = (allBookings || []).filter(b => {
      if (!b.slot_date || b.status === 'cancelled') return false;
      const bd = new Date(b.slot_date + 'T12:00:00');
      return bd >= monthStart && bd <= monthEnd;
    }).length;
    result.push({ label: MONTHS[d.getMonth()], count });
  }
  return result;
}

export function ProgressScreen({ memberId }) {
  const [notes, setNotes] = React.useState([]);
  const [allBookings, setAllBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState('week');

  React.useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    Promise.all([
      getBookingsForMember(memberId),
      getNotesForMember(memberId),
    ]).then(([bookings, fetchedNotes]) => {
      setAllBookings(bookings || []);
      setNotes(fetchedNotes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [memberId]);

  const { history, attended, rate, streakLabel, periodLabel, maxCount } = React.useMemo(() => {
    if (view === 'day') {
      const history = buildDayHistory(allBookings);
      const attended = history.filter(d => d.att).length;
      const rate = history.length > 0 ? Math.round(attended / history.length * 100) : 0;
      let streak = 0;
      for (let i = history.length - 1; i >= 0; i--) { if (history[i].att) streak++; else break; }
      return { history, attended, rate, streakLabel: streak > 0 ? `${streak}d` : '—', periodLabel: 'Last 28 days', maxCount: 1 };
    }
    if (view === 'month') {
      const history = buildMonthHistory(allBookings);
      const attended = history.reduce((s, m) => s + m.count, 0);
      const activeMo = history.filter(m => m.count > 0).length;
      const rate = history.length > 0 ? Math.round(activeMo / history.length * 100) : 0;
      let streak = 0;
      for (let i = history.length - 1; i >= 0; i--) { if (history[i].count > 0) streak++; else break; }
      const maxCount = Math.max(...history.map(m => m.count), 1);
      return { history, attended, rate, streakLabel: streak > 0 ? `${streak}mo` : '—', periodLabel: 'Last 6 months', maxCount };
    }
    const history = buildWeekHistory(allBookings);
    const attended = history.filter(w => w.att).length;
    const rate = history.length > 0 ? Math.round(attended / history.length * 100) : 0;
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) { if (history[i].att) streak++; else break; }
    return { history, attended, rate, streakLabel: streak > 0 ? `${streak} wk${streak > 1 ? 's' : ''}` : '—', periodLabel: 'Last 12 weeks', maxCount: 1 };
  }, [view, allBookings]);

  const isDay = view === 'day';
  const isMonth = view === 'month';
  const BAR_MAX_H = 52;

  return (
    <div style={{ height: '100%' }}>
      <PageHead title="Progress" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Segmented control */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 30, padding: 3, gap: 2 }}>
          {['day', 'week', 'month'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              flex: 1, padding: '7px 0', font: 'inherit', fontSize: 13.5, fontWeight: view === v ? 600 : 400,
              background: view === v ? 'var(--paper)' : 'transparent',
              color: view === v ? 'var(--ink)' : 'var(--muted)',
              border: view === v ? '1px solid var(--hairline)' : '1px solid transparent',
              borderRadius: 24, cursor: 'pointer',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'background var(--d-fast), color var(--d-fast)',
            }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            ['Attendance', rate + '%', 'var(--success)'],
            ['Sessions', attended, 'var(--ink)'],
            ['Streak', streakLabel, 'var(--steel)'],
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 12px', textAlign: 'center' }}>
              <div className="r-display r-tabular" style={{ fontSize: 26, color: s[2] }}>{s[1]}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{s[0]}</div>
            </div>
          ))}
        </div>

        {/* Chart card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{periodLabel}</div>
          <div style={{ overflowX: isDay ? 'auto' : 'visible', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', gap: isDay ? 3 : 4, alignItems: 'flex-end', width: isDay ? 'max-content' : '100%' }}>
              {history.map((item, i) => {
                const att = isMonth ? item.count > 0 : item.att;
                const barH = isMonth ? Math.max(6, Math.round(item.count / maxCount * BAR_MAX_H)) : 28;
                return (
                  <div key={i} style={{ flex: isDay ? '0 0 20px' : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    {isMonth && (
                      <div style={{ fontSize: 9.5, color: 'var(--muted)', marginBottom: 1 }}>{item.count > 0 ? item.count : ''}</div>
                    )}
                    <div style={{ width: '100%', height: barH, borderRadius: 4, background: att ? 'var(--brand)' : 'var(--hairline)', opacity: att ? 1 : 0.45, transition: 'height 350ms ease, background var(--d-base)' }} />
                    <span style={{ fontSize: 9, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--brand)', display: 'inline-block' }} />
              {isMonth ? 'Sessions' : 'Attended'}
            </span>
            {!isMonth && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--hairline)', display: 'inline-block' }} />
                Absent
              </span>
            )}
          </div>
        </div>

        {/* Coach notes */}
        <div>
          <SectionLabel>Coach notes</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 16px', fontSize: 13.5, color: 'var(--muted)' }}>
                No notes yet. Notes appear here after each lesson.
              </div>
            ) : notes.map((n, i) => {
              const dateStr = new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const coachLabel = coachShort(n.coach_id);
              return (
                <div key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14, animation: `r-rise var(--d-base) var(--e-enter) ${i * 40}ms both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Icon name="sparkle" size={13} color="var(--steel)" />
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--steel)' }}>Focus</span>
                    <span style={{ fontSize: 11.5, color: 'var(--faint)', marginLeft: 'auto' }}>{coachLabel} · {dateStr}</span>
                  </div>
                  {n.tidied_focus ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{n.tidied_focus}</div>
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                        {[n.tidied_improved, n.tidied_homework].filter(Boolean).join(' ')}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{n.raw_note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckinScreen({ member }) {
  const [scanned, setScanned] = React.useState(false);
  const qrValue = `RIPOSTE:${member?.id || 'GUEST'}`;
  const displayName = member?.name || 'Guest';
  const shortCode = member?.id
    ? `${displayName.split(' ')[0].toUpperCase()}·${member.id.slice(0, 6).toUpperCase()}`
    : 'GUEST·DEMO';

  return (
    <div style={{ height: '100%', background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', color: 'var(--paper)' }}>
        <div className="r-display" style={{ fontSize: 20, letterSpacing: '0.02em' }}>Salle d'Armes</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Show this at the door</div>
      </div>
      {!scanned ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.4)', animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
          <QRCodeSVG value={qrValue} size={200} />
          <div className="r-mono" style={{ textAlign: 'center', fontSize: 13, color: '#17150F', marginTop: 14, letterSpacing: '0.06em' }}>{shortCode}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SuccessRing size={120} />
          <div className="r-display" style={{ fontSize: 28, color: 'var(--paper)', marginTop: 22, animation: 'r-rise var(--d-base) var(--e-enter) 400ms both' }}>{displayName}</div>
          <div style={{ fontSize: 14, color: 'var(--success)', marginTop: 4, animation: 'r-rise var(--d-base) var(--e-enter) 500ms both' }}>
            Checked in · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}
      <button onClick={() => setScanned(s => !s)} className="r-focusable" style={{ position: 'absolute', bottom: 40, font: 'inherit', cursor: 'pointer', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--r-pill)', padding: '8px 16px' }}>
        {scanned ? 'Reset demo' : 'Simulate scan'}
      </button>
    </div>
  );
}

function formatDocDate(d) {
  if (!d) return null;
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDocStatus(url, expiryDate) {
  if (!url && !expiryDate) return 'pending';
  if (!expiryDate) return 'pending'; // has file but no expiry — incomplete
  const exp = new Date(expiryDate);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  return exp < now ? 'expired' : exp < soon ? 'expiring' : 'valid';
}

export function DocumentSheet({ type, member, memberId, onClose, onSaved }) {
  const isMedical = type === 'medical';
  const prefix = isMedical ? 'medical_cert' : 'federation_licence';
  const title = isMedical ? 'Medical Certificate' : 'Federation Licence';

  const [issueDate, setIssueDate] = React.useState(member?.[`${prefix}_issue_date`]?.split('T')[0] || '');
  const [expiryDate, setExpiryDate] = React.useState(member?.[`${prefix}_expiry_date`]?.split('T')[0] || '');
  const [licenceNumber, setLicenceNumber] = React.useState(member?.federation_licence_number || '');
  const [existingUrl, setExistingUrl] = React.useState(member?.[`${prefix}_url`] || null);
  const [pendingFile, setPendingFile] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const certStatus = getDocStatus(existingUrl || pendingFile, expiryDate);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) { setPendingFile(file); setSaveError(null); }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      let url = existingUrl;
      if (pendingFile) url = await uploadMemberDocument(memberId, type, pendingFile);
      await updateMemberDocument(memberId, type, {
        url,
        issueDate: issueDate || null,
        expiryDate: expiryDate || null,
        ...(type === 'federation' ? { licenceNumber } : {}),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setSaveError('Could not save — check your connection and try again.');
    }
    setSaving(false);
  };

  const hasDoc = existingUrl || pendingFile;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'r-slide-right 280ms var(--e-enter) both' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={onClose} className="r-focusable" style={{ width: 36, height: 36, borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="chevL" size={18} color="var(--ink)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
            {isMedical ? 'Required for training & competition' : 'National federation registration'}
          </div>
        </div>
        <VisaBadge status={certStatus} />
      </div>

      {/* Scrollable content */}
      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* File upload */}
        <div>
          <SectionLabel>Document file</SectionLabel>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFilePick} style={{ display: 'none' }} />
          {hasDoc ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="fileDoc" size={22} color="var(--brand)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pendingFile ? pendingFile.name : 'Uploaded document'}
                </div>
                <div style={{ fontSize: 12, color: pendingFile ? 'var(--brand)' : 'var(--success)', marginTop: 2 }}>
                  {pendingFile ? 'Ready to upload' : 'On file'}
                </div>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid var(--hairline)', background: 'transparent', borderRadius: 'var(--r-pill)', padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>
                Replace
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', width: '100%', boxSizing: 'border-box', border: '2px dashed var(--hairline)', background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="upload" size={24} color="var(--brand)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Tap to upload</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>PDF or image (JPG, PNG)</div>
            </button>
          )}
        </div>

        {/* Licence number — federation only */}
        {!isMedical && (
          <div>
            <SectionLabel>Licence number</SectionLabel>
            <input
              type="text"
              value={licenceNumber}
              onChange={e => setLicenceNumber(e.target.value)}
              placeholder="e.g. FIE-ROU-12345"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: '12px 14px', font: 'inherit', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
          </div>
        )}

        {/* Dates */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Issue date</SectionLabel>
            <input
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: '12px 14px', font: 'inherit', fontSize: 14, color: issueDate ? 'var(--ink)' : 'var(--faint)', outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>Expiry date</SectionLabel>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: '12px 14px', font: 'inherit', fontSize: 14, color: expiryDate ? 'var(--ink)' : 'var(--faint)', outline: 'none' }}
            />
          </div>
        </div>

        {/* Summary card */}
        {(issueDate || expiryDate) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</span>
            </div>
            {issueDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: expiryDate ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Issued</span>
                <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{formatDocDate(issueDate)}</span>
              </div>
            )}
            {expiryDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px' }}>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Expires</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: certStatus === 'expired' ? 'var(--danger)' : certStatus === 'expiring' ? 'var(--warning)' : 'var(--success)' }}>
                  {formatDocDate(expiryDate)}
                </span>
              </div>
            )}
          </div>
        )}

        {saveError && (
          <div style={{ background: 'var(--danger-tint)', border: '1px solid var(--danger)', borderRadius: 'var(--r-card)', padding: '12px 14px', fontSize: 13.5, color: 'var(--danger)', lineHeight: 1.5 }}>
            {saveError}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 40px', background: 'linear-gradient(to top, var(--paper) 70%, transparent)' }}>
        <button onClick={handleSave} disabled={saving} className="r-focusable" style={{ width: '100%', padding: 16, font: 'inherit', fontSize: 15.5, fontWeight: 600, background: saving ? 'var(--faint)' : 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--r-btn)', cursor: saving ? 'default' : 'pointer', boxShadow: '0 4px 16px rgba(59,111,224,0.3)', transition: 'background var(--d-fast)' }}>
          {saving ? 'Saving…' : 'Save document'}
        </button>
      </div>

      <style>{`
        @keyframes r-slide-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ── Wheel picker ─────────────────────────────────────────────

function WheelPicker({ items, value, onChange }) {
  const IH = 44; // item height px
  const PAD = 2; // invisible padding rows above/below
  const scrollRef = React.useRef(null);
  const timerRef  = React.useRef(null);

  const scrollTo = React.useCallback((val, animate) => {
    const idx = items.findIndex(it => it.value === val);
    if (idx < 0 || !scrollRef.current) return;
    if (animate) {
      scrollRef.current.scrollTo({ top: idx * IH, behavior: 'smooth' });
    } else {
      scrollRef.current.scrollTop = idx * IH;
    }
  }, [items]);

  React.useLayoutEffect(() => { scrollTo(value, false); }, []); // on mount only
  React.useEffect(() => { scrollTo(value, false); }, [items.length]); // when list changes size

  const handleScroll = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const idx = Math.round(scrollRef.current.scrollTop / IH);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (items[clamped]) onChange(items[clamped].value);
    }, 80);
  };

  return (
    <div style={{ position: 'relative', height: IH * (PAD * 2 + 1), flex: 1, overflow: 'hidden' }}>
      {/* centre highlight */}
      <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 4, right: 4, height: IH, background: 'rgba(59,111,224,0.09)', borderRadius: 10, pointerEvents: 'none', zIndex: 1 }} />
      {/* top fade  */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: IH * PAD, background: 'linear-gradient(to bottom, var(--paper) 30%, transparent)', pointerEvents: 'none', zIndex: 2 }} />
      {/* bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: IH * PAD, background: 'linear-gradient(to top, var(--paper) 30%, transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <div ref={scrollRef} onScroll={handleScroll} style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <style>{`.r-wheel::-webkit-scrollbar{display:none}`}</style>
        {Array.from({ length: PAD }).map((_, i) => <div key={`pt${i}`} style={{ height: IH }} />)}
        {items.map(it => (
          <div key={it.value} style={{ height: IH, display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', fontSize: 17, fontWeight: it.value === value ? 600 : 400, color: it.value === value ? 'var(--ink)' : 'var(--muted)', userSelect: 'none', WebkitUserSelect: 'none', transition: 'color 80ms, font-weight 80ms' }}>
            {it.label}
          </div>
        ))}
        {Array.from({ length: PAD }).map((_, i) => <div key={`pb${i}`} style={{ height: IH }} />)}
      </div>
    </div>
  );
}

// ── Shared sheet chrome ───────────────────────────────────────

// ── Notifications ─────────────────────────────────────────────

const NOTIF_DEFAULTS = {
  lesson_reminders: true,
  booking_confirm:  true,
  cancellations:    true,
  payment_reminders: true,
};

function readNotifPrefs() {
  try { return JSON.parse(localStorage.getItem('riposte_notif') || 'null') || NOTIF_DEFAULTS; }
  catch { return { ...NOTIF_DEFAULTS }; }
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 48, height: 28, borderRadius: 14, background: on ? 'var(--brand)' : 'var(--hairline)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 220ms' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.22)', transition: 'left 220ms' }} />
    </div>
  );
}

const NOTIF_ITEMS = [
  { key: 'lesson_reminders',  label: 'Lesson reminders',       sub: '1 hour before each lesson' },
  { key: 'booking_confirm',   label: 'Booking confirmations',  sub: 'When a lesson is booked' },
  { key: 'cancellations',     label: 'Cancellation updates',   sub: 'When a lesson is cancelled' },
  { key: 'payment_reminders', label: 'Payment reminders',      sub: 'When a payment is due' },
];

function NotificationsSheet({ onClose }) {
  const [prefs, setPrefs] = React.useState(readNotifPrefs);

  const save = (next) => {
    setPrefs(next);
    localStorage.setItem('riposte_notif', JSON.stringify(next));
  };

  const allOn = Object.values(prefs).every(Boolean);
  const anyOn = Object.values(prefs).some(Boolean);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'r-slide-right 280ms var(--e-enter) both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={onClose} className="r-focusable" style={{ width: 36, height: 36, borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="chevL" size={18} color="var(--ink)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Notifications</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Choose what you want to be notified about</div>
        </div>
      </div>

      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Master toggle */}
        <div style={{ background: allOn ? 'var(--brand)' : 'var(--surface)', border: `1px solid ${allOn ? 'var(--brand)' : 'var(--hairline)'}`, borderRadius: 'var(--r-card)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 220ms, border-color 220ms' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: allOn ? 'rgba(255,255,255,0.18)' : 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="bell" size={22} color={allOn ? '#fff' : 'var(--brand)'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: allOn ? '#fff' : 'var(--ink)' }}>All notifications</div>
            <div style={{ fontSize: 12.5, color: allOn ? 'rgba(255,255,255,0.75)' : 'var(--muted)', marginTop: 2 }}>{allOn ? "You’ll be notified for all events" : anyOn ? 'Some notifications are on' : 'All notifications are off'}</div>
          </div>
          <Toggle on={allOn} onChange={() => save(Object.fromEntries(Object.keys(prefs).map(k => [k, !allOn])))} />
        </div>

        {/* Individual toggles */}
        <div>
          <SectionLabel>Notification types</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            {NOTIF_ITEMS.map((item, i, arr) => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>{item.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <Toggle on={!!prefs[item.key]} onChange={(v) => save({ ...prefs, [item.key]: v })} />
              </div>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)' }}>
          <Icon name="bell" size={16} color="var(--faint)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>
            Push notifications require browser permission. You may be asked to allow them the first time a notification is triggered.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared sheet chrome ───────────────────────────────────────

function PickerSheetWrap({ title, onClose, onDone, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', animation: 'r-scrim var(--d-base) ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--paper)', borderRadius: '20px 20px 0 0', paddingBottom: 40, animation: 'r-sheet-up 280ms var(--e-enter) both', boxShadow: '0 -8px 30px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hairline)', margin: '10px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 10px' }}>
          <button onClick={onClose} style={{ font: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--muted)', padding: '4px 0' }}>Cancel</button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{title}</span>
          <button onClick={onDone}  style={{ font: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--brand)', padding: '4px 0' }}>Done</button>
        </div>
        <div style={{ height: 1, background: 'var(--hairline)', marginBottom: 4 }} />
        {children}
      </div>
    </div>
  );
}

// ── Option picker (plan / weapon / category) ──────────────────

function OptionPickerSheet({ title, options, value, onSelect, onClose }) {
  const [local, setLocal] = React.useState(value ?? options[0]?.value);
  const items = options.map(o => ({ value: o.value, label: o.label }));
  return (
    <PickerSheetWrap title={title} onClose={onClose} onDone={() => { onSelect(local); onClose(); }}>
      <div style={{ padding: '0 20px' }}>
        <WheelPicker items={items} value={local} onChange={setLocal} />
      </div>
    </PickerSheetWrap>
  );
}

// ── Date of birth picker (3-column wheel) ────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function DatePickerSheet({ value, onSave, onClose }) {
  const parse = (v) => {
    if (!v) return { d: 1, m: 1, y: 2000 };
    const [yr, mo, dy] = v.split('-').map(Number);
    return { d: dy || 1, m: mo || 1, y: yr || 2000 };
  };
  const init = parse(value);
  const [d, setD] = React.useState(init.d);
  const [m, setM] = React.useState(init.m);
  const [y, setY] = React.useState(init.y);

  const maxDay = new Date(y, m, 0).getDate();
  React.useEffect(() => { if (d > maxDay) setD(maxDay); }, [m, y]);

  const dayItems   = Array.from({ length: maxDay }, (_, i) => ({ value: i+1, label: String(i+1).padStart(2,'0') }));
  const monthItems = MONTH_NAMES.map((name, i) => ({ value: i+1, label: name }));
  const yearItems  = Array.from({ length: 80 }, (_, i) => ({ value: 1945+i, label: String(1945+i) }));

  const handleDone = () => {
    const clamped = Math.min(d, maxDay);
    onSave(`${y}-${String(m).padStart(2,'0')}-${String(clamped).padStart(2,'0')}`);
    onClose();
  };

  return (
    <PickerSheetWrap title="Date of birth" onClose={onClose} onDone={handleDone}>
      <div style={{ display: 'flex', padding: '0 12px' }}>
        <WheelPicker items={dayItems}   value={d} onChange={setD} />
        <WheelPicker items={monthItems} value={m} onChange={setM} />
        <WheelPicker items={yearItems}  value={y} onChange={setY} />
      </div>
    </PickerSheetWrap>
  );
}

function AddContactSheet({ memberId, isFirst, onClose, onSaved }) {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const ROLES = ['Mother', 'Father', 'Guardian', 'Spouse/Partner', 'Sibling', 'Coach', 'Other'];
  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || !memberId) return;
    setSaving(true);
    setError(null);
    try {
      const c = await addEmergencyContact({ member_id: memberId, name: name.trim(), role: role || null, phone: phone.trim() || null, is_primary: isFirst });
      onSaved(c);
    } catch (e) {
      setError('Could not save — make sure you have run the latest DB migration.');
    }
    setSaving(false);
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="r-display" style={{ fontSize: 20, color: 'var(--ink)' }}>Add emergency contact</div>
        <div>
          <SectionLabel>Name *</SectionLabel>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: '12px 14px', font: 'inherit', fontSize: 14, color: 'var(--ink)', outline: 'none' }} />
        </div>
        <div>
          <SectionLabel>Relationship</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRole(r === role ? '' : r)} className="r-focusable" style={{
                font: 'inherit', cursor: 'pointer', padding: '7px 14px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 500,
                background: role === r ? 'var(--brand-tint)' : 'var(--surface)',
                color: role === r ? 'var(--brand)' : 'var(--muted)',
                border: role === r ? '1px solid var(--brand)' : '1px solid var(--hairline)',
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>Phone number</SectionLabel>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+40 700 000 000"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', padding: '12px 14px', font: 'inherit', fontSize: 14, color: 'var(--ink)', outline: 'none' }} />
        </div>
        {error && (
          <div style={{ background: 'var(--danger-tint)', border: '1px solid var(--danger)', borderRadius: 'var(--r-card)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)', lineHeight: 1.5 }}>{error}</div>
        )}
        <button onClick={handleSave} disabled={!canSave || saving} className="r-focusable" style={{
          marginTop: 4, padding: 16, font: 'inherit', fontSize: 15.5, fontWeight: 600,
          background: canSave ? 'var(--brand)' : 'var(--hairline)',
          color: canSave ? '#fff' : 'var(--faint)',
          border: 'none', borderRadius: 'var(--r-btn)', cursor: canSave ? 'pointer' : 'default',
          boxShadow: canSave ? '0 4px 16px rgba(59,111,224,0.3)' : 'none',
          transition: 'background var(--d-fast)',
        }}>
          {saving ? 'Saving…' : 'Add contact'}
        </button>
      </div>
    </BottomSheet>
  );
}

function EmergencyContactsScreen({ memberId, onClose }) {
  const [contacts, setContacts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!memberId) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try { setContacts(await getEmergencyContacts(memberId)); }
    catch (e) { setLoadError('Could not load contacts — run the latest DB migration and try again.'); }
    setLoading(false);
  }, [memberId]);

  React.useEffect(() => { load(); }, [load]);

  const handleSetPrimary = async (id) => {
    await setPrimaryContact(memberId, id).catch(() => {});
    setContacts(prev => prev.map(c => ({ ...c, is_primary: c.id === id })));
  };

  const handleDelete = async (id) => {
    await deleteEmergencyContact(id).catch(() => {});
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'r-slide-right 280ms var(--e-enter) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={onClose} className="r-focusable" style={{ width: 36, height: 36, borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="chevL" size={18} color="var(--ink)" />
        </button>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Emergency contacts</div>
        <button onClick={() => setAddOpen(true)} className="r-focusable" style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'inherit', cursor: 'pointer', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--r-pill)', padding: '7px 14px', fontSize: 13.5, fontWeight: 600 }}>
          <Icon name="plus" size={14} color="#fff" strokeWidth={2.5} /> Add
        </button>
      </div>

      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', opacity: 0.35, animation: `r-live-pulse 1s ease-in-out ${i*200}ms infinite` }} />)}
            </div>
          </div>
        ) : loadError ? (
          <div style={{ background: 'var(--danger-tint)', border: '1px solid var(--danger)', borderRadius: 'var(--r-card)', padding: '14px 16px', fontSize: 13.5, color: 'var(--danger)', lineHeight: 1.5 }}>{loadError}</div>
        ) : contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="users" size={26} color="var(--faint)" />
            </div>
            <div className="r-display" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>No contacts yet</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>Add someone we can reach in an emergency.</div>
          </div>
        ) : contacts.map((c, i) => (
          <div key={c.id} style={{ background: 'var(--surface)', border: `1px solid ${c.is_primary ? 'var(--brand)' : 'var(--hairline)'}`, borderRadius: 'var(--r-card)', overflow: 'hidden', animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
            <div style={{ padding: '14px 14px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.is_primary ? 'var(--brand-tint)' : 'var(--surface)', border: `1px solid ${c.is_primary ? 'var(--brand)' : 'var(--hairline)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="user" size={20} color={c.is_primary ? 'var(--brand)' : 'var(--faint)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{c.name}</span>
                  {c.is_primary && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '2px 8px', borderRadius: 'var(--r-pill)', letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>Primary</span>
                  )}
                </div>
                {c.role  && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.role}</div>}
                {c.phone && <div className="r-mono" style={{ fontSize: 13.5, color: 'var(--ink)', marginTop: 2 }}>{c.phone}</div>}
              </div>
              <button onClick={() => handleDelete(c.id)} className="r-focusable" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, flexShrink: 0 }}>
                <Icon name="x" size={16} color="var(--faint)" />
              </button>
            </div>
            {!c.is_primary && (
              <button onClick={() => handleSetPrimary(c.id)} className="r-focusable" style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: '1px solid var(--hairline)', font: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--brand)', textAlign: 'center' }}>
                Set as primary
              </button>
            )}
          </div>
        ))}
      </div>

      {addOpen && (
        <AddContactSheet
          memberId={memberId}
          isFirst={contacts.length === 0}
          onClose={() => setAddOpen(false)}
          onSaved={(c) => { setContacts(prev => [...prev, c]); setAddOpen(false); }}
        />
      )}
    </div>
  );
}

function ProfileRow({ icon, label, value, accent, onTap, last }) {
  const Tag = onTap ? 'button' : 'div';
  return (
    <Tag onClick={onTap} className={onTap ? 'r-focusable' : ''} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderBottom: last ? 'none' : '1px solid var(--hairline)',
      background: 'transparent', font: 'inherit', width: '100%', textAlign: 'left',
      cursor: onTap ? 'pointer' : 'default',
    }}>
      {icon && <Icon name={icon} size={17} color="var(--faint)" style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1, fontSize: 14, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 14, color: accent || 'var(--ink)', fontWeight: accent ? 600 : 400 }}>{value}</span>
      {onTap && <Icon name="chevR" size={16} color="var(--faint)" />}
    </Tag>
  );
}

function ProfileSection({ title, children, highlight, sectionRef }) {
  return (
    <div ref={sectionRef} style={{ marginBottom: 22 }}>
      <SectionLabel>{title}</SectionLabel>
      <div style={{
        background: 'var(--surface)', border: '1px solid ' + (highlight ? 'var(--warning)' : 'var(--hairline)'),
        borderRadius: 'var(--r-card)', overflow: 'hidden',
        boxShadow: highlight ? '0 0 0 3px var(--warning-tint)' : 'none',
        transition: 'border-color var(--d-base), box-shadow var(--d-base)',
      }}>
        {children}
      </div>
    </div>
  );
}

export function ProfileScreen({ user, member, memberId, focusSection, onMemberUpdate }) {
  const navigate = useNavigate();
  const compRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  const [docSheet, setDocSheet] = React.useState(null);
  const [picker, setPicker] = React.useState(null); // { field, title, options, value }
  const [dobOpen, setDobOpen] = React.useState(false);
  const [emergencyOpen, setEmergencyOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifPrefs, setNotifPrefs] = React.useState(readNotifPrefs);
  const [localOverrides, setLocalOverrides] = React.useState({});

  const mf = (field) => localOverrides[field] ?? member?.[field];

  const handleFieldSave = async (field, value) => {
    setLocalOverrides(prev => ({ ...prev, [field]: value }));
    try { await updateMember(memberId, { [field]: value }); onMemberUpdate?.(); }
    catch { setLocalOverrides(prev => { const n = { ...prev }; delete n[field]; return n; }); }
  };

  React.useEffect(() => {
    if (focusSection === 'compliance' && compRef.current && scrollRef.current) {
      setTimeout(() => {
        const top = compRef.current.offsetTop - 16;
        scrollRef.current.scrollTo({ top, behavior: 'smooth' });
      }, 280);
    }
  }, [focusSection]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const displayName = user?.user_metadata?.full_name || member?.name || 'Guest';
  const email = user?.email || member?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const weaponLabel = member?.weapon
    ? member.weapon.charAt(0).toUpperCase() + member.weapon.slice(1)
    : null;
  const memberSince = member?.created_at
    ? new Date(member.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '—';

  const medStatus = getDocStatus(member?.medical_cert_url, member?.medical_cert_expiry_date);
  const fedStatus = getDocStatus(member?.federation_licence_url, member?.federation_licence_expiry_date);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <Avatar name={displayName} size={60} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{displayName}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {weaponLabel && member?.category ? `${weaponLabel} · ${member.category}` : weaponLabel || member?.category || 'Member'}
          </div>
          {member?.id && <div className="r-mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3, letterSpacing: '0.04em' }}>MBR-{member.id.slice(0, 5).toUpperCase()}</div>}
        </div>
        <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: '1px solid var(--hairline)', background: 'transparent', borderRadius: 'var(--r-btn)', padding: '6px 12px', fontSize: 13, fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>Edit</button>
      </div>

      <div ref={scrollRef} className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
        <div ref={compRef}>
          <ProfileSection title="Documents" highlight={focusSection === 'compliance'}>
            {/* Medical certificate row */}
            <button onClick={() => setDocSheet('medical')} className="r-focusable" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: 14, borderBottom: '1px solid var(--hairline)', background: 'transparent', border: 'none', font: 'inherit', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Medical certificate</div>
                <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {member?.medical_cert_expiry_date
                    ? `Expires ${formatDocDate(member.medical_cert_expiry_date)}`
                    : medStatus === 'expired' ? 'Expired — tap to upload renewal'
                    : medStatus === 'expiring' ? 'Expires soon — tap to upload'
                    : medStatus === 'pending' ? 'Not uploaded yet — tap to add'
                    : 'Tap to add document'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <VisaBadge status={medStatus} />
                <Icon name="chevR" size={16} color="var(--faint)" />
              </div>
            </button>

            {/* Federation licence row */}
            <button onClick={() => setDocSheet('federation')} className="r-focusable" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: 14, background: 'transparent', border: 'none', font: 'inherit', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Federation licence</div>
                {member?.federation_licence_number && (
                  <div className="r-mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
                    {member.federation_licence_number}
                  </div>
                )}
                <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {member?.federation_licence_expiry_date
                    ? `Expires ${formatDocDate(member.federation_licence_expiry_date)}`
                    : 'Not uploaded yet — tap to add'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <VisaBadge status={fedStatus} />
                <Icon name="chevR" size={16} color="var(--faint)" />
              </div>
            </button>
          </ProfileSection>
        </div>

        <ProfileSection title="Club membership">
          <ProfileRow label="Plan"     value={mf('plan_name') || '—'} onTap={() => setPicker({ field: 'plan_name', title: 'Membership plan', options: PLAN_OPTIONS, value: mf('plan_name') })} />
          <ProfileRow label="Weapon"   value={mf('weapon') ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WeaponGlyph type={mf('weapon')} size={16} />{WEAPON_LABEL[mf('weapon')] || mf('weapon')}</span> : '—'} onTap={() => setPicker({ field: 'weapon', title: 'Weapon', options: WEAPON_OPTIONS, value: mf('weapon') })} />
          <ProfileRow label="Category" value={mf('category') || '—'} onTap={() => setPicker({ field: 'category', title: 'Category', options: CATEGORY_OPTIONS, value: mf('category') })} />
          <ProfileRow label="Member since" value={memberSince} last />
        </ProfileSection>

        <ProfileSection title="Personal">
          <ProfileRow icon="user" label="Date of birth" value={mf('date_of_birth') ? formatDocDate(mf('date_of_birth')) : '—'} onTap={() => setDobOpen(true)} />
          <ProfileRow icon="message" label="Email" value={email || '—'} />
          <ProfileRow icon="users" label="Emergency contacts"
            value={<span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>Manage →</span>}
            onTap={() => setEmergencyOpen(true)} last />
        </ProfileSection>

        <ProfileSection title="Account">
          <ProfileRow icon="bell" label="Notifications"
            value={(() => { const on = Object.values(notifPrefs).filter(Boolean).length; const total = NOTIF_ITEMS.length; return on === 0 ? 'Off' : on === total ? 'On' : `${on} of ${total}`; })()}
            onTap={() => setNotifOpen(true)} />
          {user
            ? <ProfileRow icon="lock" label="Sign out" value="" accent="var(--brand)" onTap={signOut} last />
            : <ProfileRow icon="lock" label="Sign in" value="" accent="var(--brand)" onTap={() => navigate('/auth')} last />}
        </ProfileSection>
      </div>

      {/* Option picker — plan / weapon / category */}
      {picker && (
        <OptionPickerSheet
          title={picker.title}
          options={picker.options}
          value={picker.value}
          onSelect={(val) => { handleFieldSave(picker.field, val); setPicker(prev => ({ ...prev, value: val })); }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Date of birth wheel picker */}
      {dobOpen && (
        <DatePickerSheet
          value={mf('date_of_birth')}
          onSave={(v) => handleFieldSave('date_of_birth', v)}
          onClose={() => setDobOpen(false)}
        />
      )}

      {/* Notifications screen */}
      {notifOpen && (
        <NotificationsSheet onClose={() => { setNotifOpen(false); setNotifPrefs(readNotifPrefs()); }} />
      )}

      {/* Emergency contacts screen */}
      {emergencyOpen && (
        <EmergencyContactsScreen memberId={memberId} onClose={() => setEmergencyOpen(false)} />
      )}

      {/* Document detail sheet — slides in over profile */}
      {docSheet && (
        <DocumentSheet
          type={docSheet}
          member={member}
          memberId={memberId}
          onClose={() => setDocSheet(null)}
          onSaved={() => { onMemberUpdate?.(); setDocSheet(null); }}
        />
      )}
    </div>
  );
}
