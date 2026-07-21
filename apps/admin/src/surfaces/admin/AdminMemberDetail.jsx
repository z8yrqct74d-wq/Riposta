import React from 'react';
import { Icon, Avatar, PaymentPill, VisaBadge, WeaponGlyph } from '../../components/Shared';

export const MEMBER_DETAIL = {
  name: 'Maya Rocha', cat: 'U17', weapon: 'sabre', plan: 'Competitor', credits: 5,
  pay: 'due', visa: 'expiring', last: 'Today', member: 'MBR-20831', joined: 'Sep 2023',
  dob: '12 Mar 2009', email: 'maya@email.com', phone: '+40 721 000 123',
  guardian: { name: 'Ana Rocha', email: 'ana@email.com', phone: '+40 721 000 124' },
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
      <span className={mono ? 'r-mono' : ''} style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 16, ...style }}>{children}</div>;
}

function CardHead({ children }) {
  return <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--faint)' }}>{children}</div>;
}

function OverviewTab({ m }) {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Card>
        <CardHead>Lesson credits</CardHead>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Balance</span>
            <span className="r-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{m.credits}<span style={{ fontSize: 13, color: 'var(--faint)', marginLeft: 3 }}>/6</span></span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 7, borderRadius: 'var(--r-pill)', background: i < m.credits ? 'var(--brand)' : 'var(--hairline)' }} />
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <CardHead>Membership</CardHead>
        <DRow label="Member no." value={m.member} mono />
        <DRow label="Plan" value={m.plan} />
        <DRow label="Category" value={m.cat} />
        <DRow label="Joined" value={m.joined} last />
      </Card>
      <Card>
        <CardHead>Guardian / emergency contact</CardHead>
        <DRow label="Name" value={m.guardian.name} />
        <DRow label="Email" value={m.guardian.email} />
        <DRow label="Phone" value={m.guardian.phone} last />
      </Card>
      <Card>
        <CardHead>Personal</CardHead>
        <DRow label="Date of birth" value={m.dob} />
        <DRow label="Email" value={m.email} />
        <DRow label="Phone" value={m.phone} last />
      </Card>
    </div>
  );
}

function AttendanceTab() {
  const rows = [
    { d: 'Thu 5 Jun', what: 'Lesson · C. Sandu',  status: 'present' },
    { d: 'Tue 3 Jun', what: 'Group · Sabre squad', status: 'present' },
    { d: 'Sat 31 May', what: 'Group · Sabre squad', status: 'late' },
    { d: 'Thu 29 May', what: 'Lesson · C. Sandu',  status: 'present' },
    { d: 'Tue 27 May', what: 'Group · Sabre squad', status: 'absent' },
    { d: 'Thu 22 May', what: 'Lesson · C. Sandu',  status: 'present' },
    { d: 'Tue 20 May', what: 'Group · Sabre squad', status: 'excused' },
    { d: 'Thu 15 May', what: 'Lesson · L. Dina',   status: 'present' },
  ];
  const dotColor = { present: 'var(--success)', late: 'var(--warning)', absent: 'var(--danger)', excused: 'var(--steel)' };
  const rate = Math.round(rows.filter(r => r.status === 'present').length / rows.length * 100);
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[['Attendance', `${rate}%`, 'var(--success)'], ['Sessions', rows.length, 'var(--ink)'], ['Absences', rows.filter(r=>r.status==='absent').length, 'var(--danger)']].map(([l,v,c]) => (
          <div key={l} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '12px 14px', textAlign: 'center' }}>
            <div className="r-display r-tabular" style={{ fontSize: 22, color: c }}>{v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <Card>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: dotColor[r.status] }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r.what}</div>
              <div className="r-tabular" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{r.d}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dotColor[r.status], textTransform: 'capitalize' }}>{r.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function PaymentsTab() {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: 'var(--warning-tint)', border: '1px solid var(--warning)', borderRadius: 'var(--r-card)', padding: '13px 14px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Outstanding</div>
          <div className="r-display r-tabular" style={{ fontSize: 26, color: 'var(--ink)' }}>€45.00</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Due 10 Jun</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '13px 14px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Paid YTD</div>
          <div className="r-display r-tabular" style={{ fontSize: 26, color: 'var(--ink)' }}>€480</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>4 invoices</div>
        </div>
      </div>
      <Card>
        <CardHead>Invoice history</CardHead>
        {[
          ['INV-0461','June squad fees','€45.00','Jun 2026','due'],
          ['INV-0432','Monthly subscription','€120.00','May 2026','paid'],
          ['INV-0418','10-credit package','€220.00','May 2026','paid'],
          ['INV-0401','Monthly subscription','€120.00','Apr 2026','paid'],
        ].map((r, i, a) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < a.length-1 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r[1]}</div>
              <div className="r-mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{r[0]} · {r[3]}</div>
            </div>
            <span className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)' }}>{r[2]}</span>
            <PaymentPill status={r[4]} size="sm" />
          </div>
        ))}
      </Card>
      <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', width: '100%', padding: 12, borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="money" size={16} color="var(--muted)" /> Record manual payment
      </button>
    </div>
  );
}

function NotesTab() {
  const notes = [
    { d: '3 Jun', raw: 'Strong tempo. Worked on distance before lunge, back foot stays loaded.', focus: 'Distance control in the lunge', improved: 'Back foot loading before commitment', hw: 'Shadow footwork 10 min ×3 this week', coach: 'C. Sandu' },
    { d: '28 May', raw: 'Quick hands but riposte arrives early. Wait for blade. Improved disengage on second intention.', focus: 'Parry-riposte timing', improved: 'Disengage on second intention', hw: 'Slow-motion drills on parry timing', coach: 'C. Sandu' },
    { d: '22 May', raw: 'Footwork session. Advance-lunge cadence much cleaner. Needs more extension at end of lunge.', focus: 'Advance-lunge cadence', improved: 'Overall footwork rhythm', hw: 'Extension drills daily', coach: 'L. Dina' },
  ];
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {notes.map((n, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden', animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="note" size={14} color="var(--faint)" />
            <span className="r-tabular" style={{ fontSize: 12, color: 'var(--faint)', flex: 1 }}>{n.d} · {n.coach}</span>
          </div>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid color-mix(in oklab, var(--hairline) 60%, transparent)', background: 'var(--paper)' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, fontStyle: 'italic' }}>"{n.raw}"</p>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Icon name="sparkle" size={12} color="var(--steel)" />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--steel)' }}>AI summary</span>
            </div>
            {[['Focus', n.focus], ['Improved', n.improved], ['Homework', n.hw]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: k !== 'Homework' ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--steel)', width: 64, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ComplianceTab() {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <CardHead>Medical certificate</CardHead>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div className="r-tabular" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Expires 14 Jun 2026</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>9 days remaining</div>
            </div>
            <VisaBadge status="expiring" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, height: 72, background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon name="note" size={20} color="var(--faint)" />
              <span style={{ fontSize: 11, color: 'var(--faint)' }}>med-cert-2025.pdf</span>
            </div>
          </div>
          <button className="r-focusable" style={{ marginTop: 12, width: '100%', padding: '9px', borderRadius: 'var(--r-btn)', border: '1px solid var(--warning)', background: 'var(--warning-tint)', color: 'var(--warning)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Request renewal from athlete</button>
        </div>
      </Card>
      <Card>
        <CardHead>Federation licence</CardHead>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div className="r-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>FIE-ROU-20831</div>
              <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>Expires 31 Dec 2026</div>
            </div>
            <VisaBadge status="valid" />
          </div>
        </div>
      </Card>
      <Card>
        <CardHead>Club waiver</CardHead>
        <DRow label="Signed" value="12 Sep 2023" last />
      </Card>
    </div>
  );
}

export function MemberDetail({ member, onBack }) {
  const [tab, setTab] = React.useState('overview');
  const [showAddPayment, setShowAddPayment] = React.useState(false);
  const m = Object.assign({}, MEMBER_DETAIL, member);

  const content = {
    overview:   <OverviewTab m={m} />,
    attendance: <AttendanceTab />,
    payments:   <PaymentsTab />,
    notes:      <NotesTab />,
    compliance: <ComplianceTab />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'r-fade var(--d-base) var(--e-standard)' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13.5, padding: '6px 0' }}>
          <Icon name="chevL" size={18} color="var(--muted)" /> Members
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--hairline)' }} />
        <Avatar name={m.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{m.name}</span>
            <WeaponGlyph type={m.weapon} size={18} />
            <PaymentPill status={m.pay} size="sm" />
            <VisaBadge status={m.visa} />
          </div>
          <div className="r-mono" style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>{m.member} · {m.cat} · {m.plan}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 'var(--r-btn)', padding: '7px 12px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            <Icon name="calendar" size={15} color="var(--muted)" /> Book lesson
          </button>
          <button onClick={() => setShowAddPayment(true)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'var(--brand)', borderRadius: 'var(--r-btn)', padding: '7px 12px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
            <Icon name="money" size={15} color="#fff" /> Add payment
          </button>
        </div>
      </div>
      <div style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', overflowX: 'auto', paddingLeft: 8 }}>
        {[['overview','Overview'],['attendance','Attendance'],['payments','Payments'],['notes','Notes'],['compliance','Compliance',true]].map(([id, label, alert]) => (
          <DetailTab key={id} label={label} active={tab===id} alert={alert} onClick={() => setTab(id)} />
        ))}
      </div>
      <div key={tab} style={{ flex: 1, overflowY: 'auto', padding: '0 24px', animation: 'r-fade 160ms var(--e-standard)' }}>
        {content[tab]}
      </div>
      {showAddPayment && (
        <>
          <div onClick={() => setShowAddPayment(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(23,21,15,0.18)', zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 320, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)', zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'r-panel 240ms var(--e-enter)', boxShadow: 'var(--shadow-raise)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
              <h2 className="r-display" style={{ margin: 0, fontSize: 20, color: 'var(--ink)' }}>Add payment</h2>
              <button onClick={() => setShowAddPayment(false)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex' }}><Icon name="x" size={18} color="var(--muted)" /></button>
            </div>
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)' }}>
                <Avatar name={m.name} size={34} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</div><PaymentPill status={m.pay} size="sm" /></div>
              </div>
              {[
                ['Type', <select key="type" style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)' }}><option>Manual payment</option><option>Credit top-up</option><option>Refund</option></select>],
                ['Amount', <input key="amount" type="number" defaultValue="120" style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' }} />],
                ['Note', <input key="note" placeholder="e.g. Cash payment for June" style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--hairline)', borderRadius: 'var(--r-btn)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' }} />],
              ].map(([label, field]) => (
                <div key={label}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>{field}</div>
              ))}
            </div>
            <div style={{ padding: 20, borderTop: '1px solid var(--hairline)' }}>
              <button onClick={() => setShowAddPayment(false)} className="r-focusable" style={{ width: '100%', font: 'inherit', cursor: 'pointer', padding: 12, borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 600 }}>Record payment</button>
            </div>
          </div>
          <style>{`@keyframes r-panel { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
    </div>
  );
}
