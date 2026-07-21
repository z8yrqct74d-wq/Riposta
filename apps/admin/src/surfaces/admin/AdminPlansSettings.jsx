import React from 'react';
import { Icon, Avatar, PaymentPill } from '../../components/Shared';

const PLANS = [
  { id: 'competitor', name: 'Competitor', sub: 'Monthly subscription', price: '€120/mo', credits: 6, desc: 'For active competitors. Includes 6 individual lesson credits per month, unlimited group sessions.' },
  { id: 'monthly',    name: 'Monthly',    sub: 'Monthly subscription', price: '€80/mo',  credits: 3, desc: '3 lesson credits per month. Unlimited group sessions.' },
  { id: 'pack10',     name: '10-credit pack', sub: 'Lesson pack', price: '€210',  credits: 10, desc: 'Buy 10 individual lesson credits. No expiry. 4.5% saving.' },
  { id: 'pack5',      name: '5-credit pack',  sub: 'Lesson pack', price: '€115',  credits: 5,  desc: 'Buy 5 individual lesson credits. 4.2% saving.' },
  { id: 'trial',      name: 'Trial',      sub: '4-week trial', price: '€35',   credits: 1,  desc: 'One individual lesson + 4 group sessions to try the club.' },
  { id: 'dropin',     name: 'Drop-in',    sub: 'Pay per session', price: '€18/session', credits: 0, desc: 'Single group session, no commitment. Lesson credits available separately.' },
];

function PlanCard({ plan }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{plan.name}</div>
          <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{plan.sub}</div>
        </div>
        <div className="r-display r-tabular" style={{ fontSize: 20, color: 'var(--brand)', textAlign: 'right' }}>{plan.price}</div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{plan.desc}</p>
      {plan.credits > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--steel)', background: 'var(--steel-tint)', padding: '2px 9px', borderRadius: 'var(--r-pill)' }}>{plan.credits} lesson credit{plan.credits>1?'s':''}</span>
        </div>
      )}
      <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', marginTop: 4, padding: '7px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>Edit plan</button>
    </div>
  );
}

const SUBS = [
  { name: 'Maya Rocha',    plan: 'Competitor', next: '1 Jul', pay: 'due' },
  { name: 'Tomas Király',  plan: 'Monthly',    next: '1 Jul', pay: 'paid' },
  { name: 'Hugo Almeida',  plan: 'Monthly',    next: '5 Jul', pay: 'paid' },
  { name: 'Sofia Marin',   plan: 'Competitor', next: '1 Jul', pay: 'due' },
  { name: 'Inès Morel',    plan: 'Competitor', next: '15 Jun', pay: 'overdue' },
];

const DUNNING = [
  { name: 'Inès Morel',  inv: 'INV-0460', amount: '€120', due: '15 May', days: 21 },
  { name: 'Sofia Marin', inv: 'INV-0461', amount: '€45',  due: '1 Jun',  days: 4 },
];

export function AdminPlans() {
  const [view, setView] = React.useState('catalogue');
  const tabs = [['catalogue','Plan catalogue'],['subscriptions','Subscriptions'],['dunning','Dunning queue'],['invoices','Invoices']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', padding: '0 24px' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', padding: '12px 16px', fontSize: 13.5, fontWeight: view===id ? 600 : 500, color: view===id ? 'var(--ink)' : 'var(--muted)', borderBottom: '2px solid ' + (view===id ? 'var(--brand)' : 'transparent'), transition: 'color var(--d-fast)', whiteSpace: 'nowrap' }}>
            {label}{id==='dunning'&&DUNNING.length>0&&<span style={{ marginLeft: 7, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 'var(--r-pill)', padding: '1px 6px' }}>{DUNNING.length}</span>}
          </button>
        ))}
      </div>
      <div key={view} style={{ flex: 1, overflowY: 'auto', padding: 24, animation: 'r-fade 160ms var(--e-standard)' }}>
        {view === 'catalogue' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {PLANS.map(p => <PlanCard key={p.id} plan={p} />)}
            <div style={{ background: 'transparent', border: '1px dashed var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 160 }}>
              <div style={{ textAlign: 'center', color: 'var(--faint)' }}>
                <Icon name="plus" size={22} color="var(--faint)" />
                <div style={{ fontSize: 13, marginTop: 8 }}>New plan</div>
              </div>
            </div>
          </div>
        )}
        {view === 'subscriptions' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {['Athlete','Plan','Next billing','Status'].map(h => <th key={h} style={{ padding: '11px 16px', fontWeight: 600, borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {SUBS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: i < SUBS.length-1 ? '1px solid var(--hairline)' : 'none', animation: `r-rise var(--d-base) var(--e-enter) ${i*30}ms both` }}>
                    <td style={{ padding: '11px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.name} size={28} /><span style={{ fontWeight: 500, color: 'var(--ink)' }}>{s.name}</span></div></td>
                    <td style={{ padding: '11px 16px', color: 'var(--muted)' }}>{s.plan}</td>
                    <td className="r-tabular" style={{ padding: '11px 16px', color: 'var(--muted)' }}>{s.next}</td>
                    <td style={{ padding: '11px 16px' }}><PaymentPill status={s.pay} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {view === 'dunning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', background: 'var(--danger-tint)', border: '1px solid var(--danger)', borderRadius: 'var(--r-card)', fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>
              {DUNNING.length} outstanding invoices need follow-up. Payment links will be resent automatically after the dunning offset.
            </div>
            {DUNNING.map((d, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderLeft: '3px solid var(--danger)', borderRadius: 'var(--r-card)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={d.name} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{d.name}</div>
                  <div className="r-mono" style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{d.inv} · Due {d.due}</div>
                </div>
                <div className="r-tabular" style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{d.amount}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 1 }}>{d.days} days overdue</div>
                </div>
                <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--r-btn)', padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>Resend link</button>
              </div>
            ))}
          </div>
        )}
        {view === 'invoices' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All invoices</span>
              <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--hairline)', background: 'transparent', borderRadius: 'var(--r-btn)', padding: '6px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>
                <Icon name="chart" size={14} color="var(--muted)" /> Export CSV
              </button>
            </div>
            {[
              ['INV-0461','Maya Rocha','June squad fees','€45.00','5 Jun','due'],
              ['INV-0460','Inès Morel','Monthly subscription','€120.00','15 May','overdue'],
              ['INV-0459','Tomas Király','Monthly subscription','€80.00','1 Jun','paid'],
              ['INV-0458','Hugo Almeida','Monthly subscription','€80.00','1 Jun','paid'],
              ['INV-0457','Sofia Marin','Competitor monthly','€120.00','1 Jun','due'],
            ].map((r, i, a) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < a.length-1 ? '1px solid var(--hairline)' : 'none' }}>
                <div className="r-mono" style={{ fontSize: 11.5, color: 'var(--faint)', width: 72 }}>{r[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r[1]}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{r[2]}</div>
                </div>
                <span className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)' }}>{r[3]}</span>
                <span className="r-tabular" style={{ fontSize: 12, color: 'var(--faint)', width: 52, textAlign: 'right' }}>{r[4]}</span>
                <PaymentPill status={r[5]} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--faint)', margin: '0 0 12px' }}>{title}</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function SettingsRow({ label, sub, value, toggle, danger, last }) {
  const [on, setOn] = React.useState(toggle !== undefined ? toggle : undefined);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {on !== undefined ? (
        <button onClick={() => setOn(v => !v)} className="r-focusable" style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: on ? 'var(--brand)' : 'var(--hairline)', position: 'relative', transition: 'background var(--d-base) var(--e-spring)', flexShrink: 0 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left 220ms var(--e-spring)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      ) : value ? (
        <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{value}</span>
      ) : (
        <Icon name="chevR" size={16} color="var(--faint)" />
      )}
    </div>
  );
}

export function AdminSettings() {
  return (
    <div style={{ maxWidth: 640, padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
      <SettingsSection title="Club profile">
        <SettingsRow label="Club name" value="Riposte Salle d'Armes" />
        <SettingsRow label="City" value="Bucharest, Romania" />
        <SettingsRow label="Contact email" value="admin@riposte.ro" last />
      </SettingsSection>
      <SettingsSection title="Pistes">
        <SettingsRow label="Riposte Main Room" sub="Electric scoring · Active" toggle={true} last />
      </SettingsSection>
      <SettingsSection title="Session rules">
        <SettingsRow label="Cancellation window" sub="Free cancellation up to this many hours before" value="12 h" />
        <SettingsRow label="Dunning offset" sub="Days after due before first reminder" value="3 days" last />
      </SettingsSection>
      <SettingsSection title="Integrations">
        <SettingsRow label="xMoney" sub="Payment gateway · Connected" toggle={true} />
        <SettingsRow label="Federation API" sub="Automatic licence check" toggle={false} last />
      </SettingsSection>
      <SettingsSection title="AI preferences">
        <SettingsRow label="Daily digest" sub="Show AI digest strip on dashboard and calendar" toggle={true} />
        <SettingsRow label="Lesson note tidying" sub="Auto-summarise coach notes into focus / improved / homework" toggle={true} />
        <SettingsRow label="Digest tone" sub="How the digest phrases suggestions" value="Direct" last />
      </SettingsSection>
      <SettingsSection title="Roles & users">
        <SettingsRow label="Admin users" value="1 active" />
        <SettingsRow label="Coach accounts" value="2 active" last />
      </SettingsSection>
      <SettingsSection title="Danger zone">
        <SettingsRow label="Export all data" sub="Download a full JSON export of club data" danger />
        <SettingsRow label="Delete club" sub="Permanently removes all data. Cannot be undone." danger last />
      </SettingsSection>
    </div>
  );
}
