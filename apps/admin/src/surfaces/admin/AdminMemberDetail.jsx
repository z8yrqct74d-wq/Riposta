import React from 'react';
import { Icon, Avatar, PaymentPill, VisaBadge, WeaponGlyph } from '../../components/Shared';
import { getMember, getEmergencyContacts, getBookingsForMember, getNotesForMember, getPaymentsForMember, getPlans, recordPayment, updateMember, updateMemberDocument } from '../../lib/db';

const fmtDate = (iso, opts) => iso ? new Date(iso).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const dayMonth = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
const money = (n) => `€${Number(n || 0).toFixed(2)}`;
// Whole calendar days until a date-only string, using LOCAL midnight for both
// sides — `new Date(iso)` alone parses as UTC midnight, which can be off by a
// day vs. local "now" near the day boundary in timezones ahead of UTC.
const daysUntil = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

function DetailTab({ label, active, onClick, alert }) {
  return (
    <button onClick={onClick} className="r-focusable" style={{
      font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent',
      padding: '11px 16px', fontSize: 13.5, fontWeight: active ? 600 : 500,
      color: active ? 'var(--ink)' : 'var(--muted)',
      borderBottom: `2px solid ${active ? 'var(--brand)' : 'transparent'}`,
      transition: 'color var(--d-fast)', whiteSpace: 'nowrap', position: 'relative',
    }}>
      {label}
      {alert && <span style={{ position: 'absolute', top: 8, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />}
    </button>
  );
}

function DRow({ label, value, mono, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span className={mono ? 'r-mono' : ''} style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 16, ...style }}>{children}</div>;
}

function CardHead({ children }) {
  return <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--faint)' }}>{children}</div>;
}

function OverviewTab({ m, contacts }) {
  const primary = contacts.find(c => c.is_primary) || contacts[0] || null;
  const [plans, setPlans] = React.useState([]);
  React.useEffect(() => { getPlans().then(setPlans).catch(() => {}); }, []);
  const matchedPlan = plans.find(p => p.name === m.plan_name);
  // Fall back to 6 (the most common plan size) only when the member's plan
  // isn't found in the catalogue, e.g. no plan set yet.
  const planCredits = matchedPlan ? Math.max(matchedPlan.credits, 1) : 6;
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Card>
        <CardHead>Lesson credits</CardHead>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Balance</span>
            <span className="r-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{m.credits}<span style={{ fontSize: 13, color: 'var(--faint)', marginLeft: 3 }}>/{planCredits}</span></span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: planCredits }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 7, borderRadius: 'var(--r-pill)', background: i < m.credits ? 'var(--brand)' : 'var(--hairline)' }} />
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <CardHead>Membership</CardHead>
        <DRow label="Member no." value={m.id ? `MBR-${String(m.id).slice(0, 8).toUpperCase()}` : '—'} mono />
        <DRow label="Plan" value={m.plan_name} />
        <DRow label="Category" value={m.category} />
        <DRow label="Joined" value={fmtDate(m.created_at, { month: 'short', year: 'numeric' })} last />
      </Card>
      <Card>
        <CardHead>Guardian / emergency contact</CardHead>
        {primary ? (
          <>
            <DRow label="Name" value={primary.name} />
            <DRow label="Role" value={primary.role} />
            <DRow label="Phone" value={primary.phone} last />
          </>
        ) : (
          <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>No emergency contact on file.</div>
        )}
      </Card>
      <Card>
        <CardHead>Personal</CardHead>
        <DRow label="Date of birth" value={fmtDate(m.date_of_birth)} />
        <DRow label="Email" value={m.email} last />
      </Card>
    </div>
  );
}

const ATT_COLOR = { present: 'var(--success)', late: 'var(--warning)', absent: 'var(--danger)', excused: 'var(--steel)', pending: 'var(--faint)' };

function AttendanceTab({ bookings }) {
  const rows = bookings.filter(b => b.status !== 'cancelled').map(b => ({
    d: fmtDate(b.slot_date, { weekday: 'short', day: 'numeric', month: 'short' }),
    what: b.coaches?.name ? `Lesson · ${b.coaches.name}` : 'Lesson',
    status: b.attendance_status || 'pending',
  }));
  const done = rows.filter(r => r.status !== 'pending');
  const rate = done.length ? Math.round(rows.filter(r => r.status === 'present').length / done.length * 100) : 0;
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[['Attendance', `${rate}%`, 'var(--success)'], ['Sessions', rows.length, 'var(--ink)'], ['Absences', rows.filter(r=>r.status==='absent').length, 'var(--danger)']].map(([l,val,c]) => (
          <div key={l} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '12px 14px', textAlign: 'center' }}>
            <div className="r-display r-tabular" style={{ fontSize: 22, color: c }}>{val}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <Card>
        {rows.length === 0 && <div style={{ padding: 24, fontSize: 13, color: 'var(--muted)' }}>No bookings yet.</div>}
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: ATT_COLOR[r.status] || 'var(--faint)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r.what}</div>
              <div className="r-tabular" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{r.d}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: ATT_COLOR[r.status] || 'var(--faint)', textTransform: 'capitalize' }}>{r.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function PaymentsTab({ payments }) {
  const outstanding = payments.filter(p => p.status === 'due' || p.status === 'overdue').reduce((s, p) => s + Number(p.amount || 0), 0);
  const paidYtd = payments.filter(p => p.status === 'paid' && p.kind !== 'refund').reduce((s, p) => s + Number(p.amount || 0), 0);
  const paidCount = payments.filter(p => p.status === 'paid').length;
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: outstanding > 0 ? 'var(--warning-tint)' : 'var(--surface)', border: `1px solid ${outstanding > 0 ? 'var(--warning)' : 'var(--hairline)'}`, borderRadius: 'var(--r-card)', padding: '13px 14px' }}>
          <div style={{ fontSize: 11.5, color: outstanding > 0 ? 'var(--warning)' : 'var(--faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Outstanding</div>
          <div className="r-display r-tabular" style={{ fontSize: 26, color: 'var(--ink)' }}>{money(outstanding)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '13px 14px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Paid total</div>
          <div className="r-display r-tabular" style={{ fontSize: 26, color: 'var(--ink)' }}>{money(paidYtd)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{paidCount} payment{paidCount!==1?'s':''}</div>
        </div>
      </div>
      <Card>
        <CardHead>Payment history</CardHead>
        {payments.length === 0 && <div style={{ padding: 24, fontSize: 13, color: 'var(--muted)' }}>No payments recorded.</div>}
        {payments.map((r, i, a) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < a.length-1 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r.note || (r.kind === 'topup' ? 'Credit top-up' : r.kind === 'refund' ? 'Refund' : 'Payment')}</div>
              <div className="r-mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1, textTransform: 'capitalize' }}>{r.kind} · {dayMonth(r.created_at)}</div>
            </div>
            <span className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)' }}>{money(r.amount)}</span>
            <PaymentPill status={r.status} size="sm" />
          </div>
        ))}
      </Card>
    </div>
  );
}

function NotesTab({ notes }) {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {notes.length === 0 && <div style={{ padding: 24, fontSize: 13, color: 'var(--muted)' }}>No lesson notes yet.</div>}
      {notes.map((n, i) => (
        <div key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden', animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="note" size={14} color="var(--faint)" />
            <span className="r-tabular" style={{ fontSize: 12, color: 'var(--faint)', flex: 1 }}>{dayMonth(n.created_at)}{n.coach_id ? ` · ${n.coach_id}` : ''}</span>
          </div>
          {n.raw_note && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid color-mix(in oklab, var(--hairline) 60%, transparent)', background: 'var(--paper)' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, fontStyle: 'italic' }}>"{n.raw_note}"</p>
            </div>
          )}
          {(n.tidied_focus || n.tidied_improved || n.tidied_homework) && (
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <Icon name="sparkle" size={12} color="var(--steel)" />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--steel)' }}>AI summary</span>
              </div>
              {[['Focus', n.tidied_focus], ['Improved', n.tidied_improved], ['Homework', n.tidied_homework]].filter(([,val]) => val).map(([k, val], j, arr) => (
                <div key={k} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: j < arr.length-1 ? '1px solid var(--hairline)' : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--steel)', width: 64, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ComplianceTab({ m, onRequestRenewal }) {
  const medExp = m.medical_cert_expiry_date;
  const medDays = daysUntil(medExp);
  const fedNo = m.federation_licence_number;
  const fedExp = m.federation_licence_expiry_date;
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <CardHead>Medical certificate</CardHead>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div className="r-tabular" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{medExp ? `Expires ${fmtDate(medExp)}` : 'Not on file'}</div>
              {medDays != null && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>{medDays >= 0 ? `${medDays} days remaining` : `${-medDays} days overdue`}</div>}
            </div>
            <VisaBadge status={m.visa_status} />
          </div>
          {m.medical_cert_url && (
            <a href={m.medical_cert_url} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 8, textDecoration: 'none' }}>
              <div style={{ flex: 1, height: 60, background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Icon name="fileDoc" size={20} color="var(--faint)" />
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>View document</span>
              </div>
            </a>
          )}
          <button onClick={onRequestRenewal} className="r-focusable" style={{ marginTop: 12, width: '100%', padding: '9px', borderRadius: 'var(--r-btn)', border: '1px solid var(--warning)', background: 'var(--warning-tint)', color: 'var(--warning)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Request renewal from athlete</button>
        </div>
      </Card>
      <Card>
        <CardHead>Federation licence</CardHead>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="r-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{fedNo || 'Not on file'}</div>
              {fedExp && <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>Expires {fmtDate(fedExp)}</div>}
            </div>
            {fedExp && <VisaBadge status={daysUntil(fedExp) < 0 ? 'expired' : 'valid'} />}
          </div>
        </div>
      </Card>
    </div>
  );
}

function AddPaymentPanel({ member, onClose, onRecorded }) {
  const [kind, setKind] = React.useState('payment');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const field = { width: '100%', padding: '9px 11px', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' };

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError(kind === 'topup' ? 'Enter a positive number of credits.' : 'Enter a positive amount.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await recordPayment({
        member_id: member.id,
        amount: kind === 'topup' ? 0 : amt,
        kind,
        note: note || null,
        status: kind === 'refund' ? 'refunded' : 'paid',
        credits_delta: kind === 'topup' ? amt : 0,
      });
      if (kind === 'payment') await updateMember(member.id, { pay_status: 'paid' });
      await onRecorded();
      onClose();
    } catch (e) {
      setError(e?.message || 'Could not record payment.');
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,21,15,0.18)', zIndex: 40 }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 320, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)', zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'r-panel 240ms var(--e-enter)', boxShadow: 'var(--shadow-raise)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
          <h2 className="r-display" style={{ margin: 0, fontSize: 20, color: 'var(--ink)' }}>Add payment</h2>
          <button onClick={onClose} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex' }}><Icon name="x" size={18} color="var(--muted)" /></button>
        </div>
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)' }}>
            <Avatar name={member.name} size={34} src={member.avatar_url} />
            <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{member.name}</div><PaymentPill status={member.pay_status} size="sm" /></div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Type</div>
            <select value={kind} onChange={e => setKind(e.target.value)} style={field}>
              <option value="payment">Manual payment</option>
              <option value="topup">Credit top-up</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{kind === 'topup' ? 'Credits' : 'Amount (€)'}</div>
            <input type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder={kind === 'topup' ? 'e.g. 5' : 'e.g. 120'} style={field} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Note</div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Cash payment for June" style={field} />
          </div>
        </div>
        <div style={{ padding: 20, borderTop: '1px solid var(--hairline)' }}>
          {error && <div style={{ marginBottom: 10, fontSize: 12.5, color: 'var(--danger)' }}>{error}</div>}
          <button onClick={submit} disabled={saving} className="r-focusable" style={{ width: '100%', font: 'inherit', cursor: 'pointer', padding: 12, borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{saving ? 'Recording…' : 'Record payment'}</button>
        </div>
      </div>
      <style>{`@keyframes r-panel { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

export function MemberDetail({ member, onBack }) {
  const [tab, setTab] = React.useState('overview');
  const [showAddPayment, setShowAddPayment] = React.useState(false);
  const [m, setM] = React.useState(member);
  const [contacts, setContacts] = React.useState([]);
  const [bookings, setBookings] = React.useState([]);
  const [notes, setNotes] = React.useState([]);
  const [payments, setPayments] = React.useState([]);

  const reload = React.useCallback(async () => {
    if (!member?.id) return;
    getMember(member.id).then(setM).catch(() => {});
    getPaymentsForMember(member.id).then(setPayments).catch(() => {});
  }, [member?.id]);

  React.useEffect(() => {
    if (!member?.id) return;
    getMember(member.id).then(setM).catch(() => setM(member));
    getEmergencyContacts(member.id).then(setContacts).catch(() => {});
    getBookingsForMember(member.id).then(setBookings).catch(() => {});
    getNotesForMember(member.id).then(setNotes).catch(() => {});
    getPaymentsForMember(member.id).then(setPayments).catch(() => {});
  }, [member?.id]);

  const requestRenewal = () => {
    updateMemberDocument(m.id, 'medical', { expiryDate: null }).then(reload).catch(() => {});
  };

  const complianceAlert = m.visa_status === 'expiring' || m.visa_status === 'expired' || m.visa_status === 'pending';

  const content = {
    overview:   <OverviewTab m={m} contacts={contacts} />,
    attendance: <AttendanceTab bookings={bookings} />,
    payments:   <PaymentsTab payments={payments} />,
    notes:      <NotesTab notes={notes} />,
    compliance: <ComplianceTab m={m} onRequestRenewal={requestRenewal} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'r-fade var(--d-base) var(--e-standard)' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13.5, padding: '6px 0' }}>
          <Icon name="chevL" size={18} color="var(--muted)" /> Members
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--hairline)' }} />
        <Avatar name={m.name} size={36} src={m.avatar_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{m.name}</span>
            {m.weapon && <WeaponGlyph type={m.weapon} size={18} />}
            <PaymentPill status={m.pay_status} size="sm" />
            <VisaBadge status={m.visa_status} />
          </div>
          <div className="r-mono" style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>{m.category || '—'} · {m.plan_name || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAddPayment(true)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'var(--brand)', borderRadius: 'var(--r-btn)', padding: '7px 12px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
            <Icon name="money" size={15} color="#fff" /> Add payment
          </button>
        </div>
      </div>
      <div style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', overflowX: 'auto', paddingLeft: 8 }}>
        {[['overview','Overview'],['attendance','Attendance'],['payments','Payments'],['notes','Notes'],['compliance','Compliance', complianceAlert]].map(([id, label, alert]) => (
          <DetailTab key={id} label={label} active={tab===id} alert={alert} onClick={() => setTab(id)} />
        ))}
      </div>
      <div key={tab} style={{ flex: 1, overflowY: 'auto', padding: '0 24px', animation: 'r-fade 160ms var(--e-standard)' }}>
        {content[tab]}
      </div>
      {showAddPayment && <AddPaymentPanel member={m} onClose={() => setShowAddPayment(false)} onRecorded={reload} />}
    </div>
  );
}
