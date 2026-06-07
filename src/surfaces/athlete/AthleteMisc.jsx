import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WeaponGlyph, WEAPON_LABEL, Icon, Avatar, PaymentPill, VisaBadge } from '../../components/Shared';
import { PrimaryBtn, SuccessRing } from './AthleteBook';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { cancelBooking, getMember, updateMemberCredits, getBookingsForMember, getNotesForMember } from '../../lib/db';

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
  const [sheet, setSheet] = React.useState(false);
  const [paid, setPaid] = React.useState(false);
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <PageHead title="Payments" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        <button onClick={() => { setPaid(false); setSheet(true); }} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', textAlign: 'left', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 'var(--r-card)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Buy a lesson package</div>
            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2 }}>5 / 10 / 20 credits · save up to 15%</div>
          </div>
          <Icon name="chevR" size={20} color="var(--paper)" />
        </button>
        <div>
          <SectionLabel>Outstanding</SectionLabel>
          <ColorBarRow bar="var(--warning)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>June squad fees</div>
                <div className="r-tabular" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Due 10 Jun · <span className="r-mono">INV-0461</span></div>
              </div>
              <span className="r-tabular" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>€45.00</span>
              <button onClick={() => { setPaid(false); setSheet(true); }} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'var(--brand)', border: 'none', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>Pay</button>
            </div>
          </ColorBarRow>
        </div>
        <div>
          <SectionLabel>History</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            {[['1 Jun', 'Monthly subscription', '€120.00', 'paid'], ['18 May', '10-credit package', '€220.00', 'paid'], ['1 May', 'Monthly subscription', '€120.00', 'paid'], ['22 Apr', 'Drop-in session', '€18.00', 'refunded']].map((r, i, a) => (
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
      {sheet && (
        <BottomSheet onClose={() => setSheet(false)}>
          <XMoneySheet paid={paid} onPay={() => setPaid(true)} onDone={() => setSheet(false)} />
        </BottomSheet>
      )}
    </div>
  );
}

function buildAttHistory(allBookings) {
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
    result.push({ w: `W${12 - w}`, att });
  }
  return result;
}

export function ProgressScreen({ memberId }) {
  const [notes, setNotes] = React.useState([]);
  const [attHistory, setAttHistory] = React.useState(() => Array.from({ length: 12 }, (_, i) => ({ w: `W${i + 1}`, att: false })));
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    Promise.all([
      getBookingsForMember(memberId),
      getNotesForMember(memberId),
    ]).then(([bookings, fetchedNotes]) => {
      setAttHistory(buildAttHistory(bookings));
      setNotes(fetchedNotes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [memberId]);

  const attended = attHistory.filter(w => w.att).length;
  const rate = attHistory.length > 0 ? Math.round(attended / attHistory.length * 100) : 0;
  let streak = 0;
  for (let i = attHistory.length - 1; i >= 0; i--) {
    if (attHistory[i].att) streak++;
    else break;
  }

  return (
    <div style={{ height: '100%' }}>
      <PageHead title="Progress" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[['Attendance', rate + '%', 'var(--success)'], ['Sessions', attended, 'var(--ink)'], ['Streak', streak > 0 ? `${streak} wk${streak > 1 ? 's' : ''}` : '—', 'var(--steel)']].map((s, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 12px', textAlign: 'center' }}>
              <div className="r-display r-tabular" style={{ fontSize: 26, color: s[2] }}>{s[1]}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{s[0]}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Last 12 weeks</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
            {attHistory.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 28, borderRadius: 4, background: w.att ? 'var(--brand)' : 'var(--hairline)', opacity: w.att ? 1 : 0.5, transition: 'background var(--d-base)' }} />
                <span style={{ fontSize: 9, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{w.w}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--brand)', display: 'inline-block' }} /> Attended</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--hairline)', display: 'inline-block' }} /> Absent</span>
          </div>
        </div>
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

export function ProfileScreen({ user, member, focusSection }) {
  const navigate = useNavigate();
  const compRef = React.useRef(null);
  const scrollRef = React.useRef(null);

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <ProfileSection title="Compliance & documents" highlight={focusSection === 'compliance'}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Medical certificate</div>
                  <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    {member?.visa_status === 'expiring' ? 'Expires soon — upload renewal' :
                     member?.visa_status === 'expired' ? 'Expired — action required' :
                     'Valid'}
                  </div>
                </div>
                <VisaBadge status={member?.visa_status || 'valid'} />
              </div>
              {(member?.visa_status === 'expiring' || member?.visa_status === 'expired') && (
                <button className="r-focusable" style={{ marginTop: 12, font: 'inherit', cursor: 'pointer', width: '100%', padding: '9px', borderRadius: 'var(--r-btn)', border: '1px solid var(--warning)', background: 'var(--warning-tint)', color: 'var(--warning)', fontSize: 13, fontWeight: 600 }}>
                  Upload renewal
                </button>
              )}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Federation licence</div>
                  {member?.id && <div className="r-mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>FIE-ROU-{member.id.slice(0, 5).toUpperCase()}</div>}
                  <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)' }}>Expires 31 Dec 2026</div>
                </div>
                <VisaBadge status="valid" />
              </div>
            </div>
          </ProfileSection>
        </div>

        <ProfileSection title="Club membership">
          <ProfileRow label="Plan" value={member?.plan_name || '—'} />
          <ProfileRow label="Weapon" value={weaponLabel
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WeaponGlyph type={member.weapon} size={16} /> {weaponLabel}</span>
            : '—'} />
          <ProfileRow label="Category" value={member?.category || '—'} />
          <ProfileRow label="Member since" value={memberSince} last />
        </ProfileSection>

        <ProfileSection title="Personal">
          <ProfileRow icon="user" label="Date of birth" value="—" />
          <ProfileRow icon="message" label="Email" value={email || '—'} />
          <ProfileRow icon="bell" label="Emergency contact" value="—" onTap={() => {}} last />
        </ProfileSection>

        <ProfileSection title="Account">
          <ProfileRow icon="bell" label="Notifications" value="On" onTap={() => {}} />
          {user
            ? <ProfileRow icon="lock" label="Sign out" value="" accent="var(--brand)" onTap={signOut} last />
            : <ProfileRow icon="lock" label="Sign in" value="" accent="var(--brand)" onTap={() => navigate('/auth')} last />}
        </ProfileSection>
      </div>
    </div>
  );
}
