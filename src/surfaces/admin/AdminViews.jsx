import React from 'react';
import { WeaponGlyph, WEAPON_LABEL, Icon, Avatar, PaymentPill, VisaBadge, WeaponChip } from '../../components/Shared';
import { KIND } from '../../data/adminData';
import { getMembers } from '../../lib/db';

export function StatCard({ children, style }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, ...style }}>{children}</div>;
}

export function CardLabel({ children, accent, style }) {
  return <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: accent || 'var(--faint)', marginBottom: 12, ...style }}>{children}</div>;
}

export function AdminDashboard({ onGotoCalendar, onGotoMembers }) {
  const timeline = [
    { t: '16:30', title: 'Sabre · U14',  piste: 'Main Room', weapon: 'sabre', kind: 'group',  done: true },
    { t: '18:00', title: 'Sabre squad',  piste: 'Main Room', weapon: 'sabre', kind: 'group',  live: true },
    { t: '18:00', title: 'Maya Rocha',   piste: 'Main Room', weapon: 'sabre', kind: 'lesson' },
    { t: '19:30', title: 'Tomas Király', piste: 'Main Room', weapon: 'sabre', kind: 'lesson' },
    { t: '20:30', title: 'Léa Bernard',  piste: 'Main Room', weapon: 'sabre', kind: 'lesson' },
  ];
  const [hovRow, setHovRow] = React.useState(null);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Active members', value: '7',    sub: '6 active · 1 trial', color: 'var(--ink)' },
          { label: 'Credits balance', value: '21',   sub: 'across all members',  color: 'var(--ink)' },
          { label: 'Payments due',   value: '€165', sub: '3 invoices · 1 overdue', color: 'var(--danger)' },
          { label: 'Visas expiring', value: '2',    sub: 'within 14 days',        color: 'var(--warning)' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${i >= 2 ? (i===2?'color-mix(in oklab, var(--danger) 30%, var(--hairline))':'color-mix(in oklab, var(--warning) 30%, var(--hairline))') : 'var(--hairline)'}`, borderRadius: 'var(--r-card)', padding: '14px 16px', animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
            <div className="r-display r-tabular" style={{ fontSize: 30, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{k.label}</div>
            <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }}>
        <StatCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <CardLabel style={{ margin: 0 }}>Today · sessions &amp; lessons</CardLabel>
            <button onClick={onGotoCalendar} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--brand)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>Calendar <Icon name="chevR" size={13} color="var(--brand)" /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {timeline.map((it, i) => (
              <div key={i} onMouseEnter={() => setHovRow(i)} onMouseLeave={() => setHovRow(null)} onClick={onGotoCalendar} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', margin: '0 -8px', borderRadius: 8, borderBottom: i < timeline.length - 1 ? '1px solid var(--hairline)' : 'none', opacity: it.done ? 0.45 : 1, cursor: 'pointer', background: hovRow === i ? 'var(--paper)' : 'transparent', transition: 'background var(--d-fast)', animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
                <span className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)', width: 42, flexShrink: 0 }}>{it.t}</span>
                <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0, background: KIND[it.kind].bar }} />
                <WeaponGlyph type={it.weapon} size={17} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</span>
                {it.live && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--live)', flexShrink: 0 }}><span className="r-live-dot" /> LIVE</span>}
                {it.done && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>Done</span>}
              </div>
            ))}
          </div>
        </StatCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StatCard>
            <CardLabel>Main Room · today</CardLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['16:00–18:00', 60, 'var(--steel)'], ['18:00–20:00', 100, 'var(--brand)'], ['20:00–22:00', 45, 'var(--steel)']].map(([label, pct, color]) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="r-tabular" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{label}</span>
                    <span className="r-tabular" style={{ fontSize: 11.5, fontWeight: 600, color: pct === 100 ? 'var(--danger)' : 'var(--muted)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--hairline)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3, transition: 'width var(--d-slow) var(--e-enter)' }} />
                  </div>
                </div>
              ))}
            </div>
          </StatCard>
          <StatCard style={{ cursor: 'pointer' }}>
            <CardLabel accent="var(--warning)">Payments due</CardLabel>
            <div className="r-display r-tabular" style={{ fontSize: 26, color: 'var(--ink)' }}>€165</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--warning)', background: 'var(--warning-tint)', padding: '2px 8px', borderRadius: 'var(--r-pill)', fontWeight: 600 }}>2 due</span>
              <span style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-tint)', padding: '2px 8px', borderRadius: 'var(--r-pill)', fontWeight: 600 }}>1 overdue</span>
            </div>
          </StatCard>
          <StatCard style={{ cursor: 'pointer' }}>
            <CardLabel accent="var(--warning)">Visas expiring</CardLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Maya Rocha', '9 days'], ['Noah Klein', '12 days']].map(([n, d]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={n} size={26} />
                  <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>{n}</span>
                  <VisaBadge status="expiring" label={d} />
                </div>
              ))}
            </div>
          </StatCard>
        </div>
      </div>
    </div>
  );
}

export const MEMBERS = [
  { name: 'Maya Rocha',   cat: 'U17', weapon: 'foil',  plan: 'Competitor', credits: 5, pay: 'due',     visa: 'expiring', last: 'Today' },
  { name: 'Tomas Király', cat: 'Senior', weapon: 'epee', plan: 'Monthly',  credits: 2, pay: 'paid',    visa: 'valid',    last: 'Yesterday' },
  { name: 'Léa Bernard',  cat: 'U14', weapon: 'sabre', plan: 'Lesson pack', credits: 8, pay: 'paid',   visa: 'valid',    last: '2 Jun' },
  { name: 'Inès Morel',   cat: 'U17', weapon: 'epee',  plan: 'Competitor', credits: 0, pay: 'overdue', visa: 'expired',  last: '28 May' },
  { name: 'Hugo Almeida', cat: 'Senior', weapon: 'foil', plan: 'Drop-in',  credits: 1, pay: 'paid',    visa: 'valid',    last: '3 Jun' },
  { name: 'Sofia Marin',  cat: 'U14', weapon: 'sabre', plan: 'Monthly',    credits: 4, pay: 'due',     visa: 'valid',    last: '1 Jun' },
  { name: 'Noah Klein',   cat: 'U11', weapon: 'foil',  plan: 'Trial',      credits: 1, pay: 'paid',    visa: 'expiring', last: '4 Jun' },
];

export const PAY_BAR = { paid: 'var(--success)', due: 'var(--warning)', overdue: 'var(--danger)', refunded: 'var(--hairline)' };

export function AdminMembers({ onSelectMember }) {
  const [q, setQ] = React.useState('');
  const [wf, setWf] = React.useState(null);
  const [allMembers, setAllMembers] = React.useState(MEMBERS);

  React.useEffect(() => {
    getMembers()
      .then(data => {
        if (data?.length) {
          setAllMembers(data.map(m => ({
            id: m.id,
            name: m.name,
            cat: m.category,
            weapon: m.weapon,
            plan: m.plan_name,
            credits: m.credits,
            pay: m.pay_status,
            visa: m.visa_status,
            last: m.last_seen,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const rows = allMembers.filter(m => (!wf || m.weapon === wf) && m.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--hairline)', padding: 20, background: 'var(--surface)' }}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Icon name="search" size={16} color="var(--faint)" style={{ position: 'absolute', left: 10, top: 9 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members" className="r-focusable" style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', font: 'inherit', fontSize: 13, color: 'var(--ink)', boxSizing: 'border-box' }} />
        </div>
        <CardLabel>Weapon</CardLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
          {['foil','epee','sabre'].map(w => (
            <button key={w} onClick={() => setWf(wf === w ? null : w)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 'var(--r-btn)', border: '1px solid ' + (wf===w?'var(--brand)':'transparent'), background: wf===w?'var(--brand-tint)':'transparent', color: 'var(--ink)', fontSize: 13 }}>
              <WeaponGlyph type={w} size={18} /> {WEAPON_LABEL[w]}
            </button>
          ))}
        </div>
        <CardLabel>Status</CardLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Active','Trial','Inactive'].map(s => <span key={s} style={{ fontSize: 12, color: 'var(--muted)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: '3px 9px' }}>{s}</span>)}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {['Athlete','Cat.','Plan','Credits','Payment','Visa','Last seen'].map(h => <th key={h} style={{ padding: '12px 14px', fontWeight: 600, borderBottom: '1px solid var(--hairline)', position: 'sticky', top: 0, background: 'var(--surface)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="7"><div style={{padding:40,textAlign:'center'}}><div className="r-display" style={{fontSize:22,color:'var(--ink)',marginBottom:6}}>No results.</div><div style={{fontSize:13,color:'var(--muted)'}}>Try adjusting your search or filters.</div></div></td></tr>
            )}
            {rows.map((m, i) => (
              <tr key={i} onClick={() => onSelectMember && onSelectMember(m)}
                style={{ borderBottom: '1px solid var(--hairline)', animation: `r-rise var(--d-base) var(--e-enter) ${i*30}ms both`, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--paper)'}
                onMouseLeave={e => e.currentTarget.style.background=''}>
                <td style={{ padding: 0, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: PAY_BAR[m.pay] }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 10px 18px' }}>
                    <Avatar name={m.name} size={30} />
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{m.name}</span>
                    <WeaponGlyph type={m.weapon} size={16} />
                  </div>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{m.cat}</td>
                <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{m.plan}</td>
                <td className="r-tabular" style={{ padding: '10px 14px', color: m.credits === 0 ? 'var(--danger)' : 'var(--ink)', fontWeight: 500 }}>{m.credits}</td>
                <td style={{ padding: '10px 14px' }}><PaymentPill status={m.pay} size="sm" /></td>
                <td style={{ padding: '10px 14px' }}><VisaBadge status={m.visa} /></td>
                <td className="r-tabular" style={{ padding: '10px 14px', color: 'var(--faint)' }}>{m.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
