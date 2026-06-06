// ============================================================
// RIPOSTE — Admin · A5 Coaches roster + availability editor
// ============================================================

const COACHES_DATA = [
  { id: 'sandu', name: 'Constantin Sandu', weapons: ['sabre'], maitre: false, load: 8, max: 12, bio: 'Senior coach. Sabre specialist with 14 years of competitive experience.' },
  { id: 'dina',  name: 'Lucian Dina',      weapons: ['sabre'], maitre: false, load: 5, max: 10, bio: 'Footwork and tactics coach. Focuses on U14–U17 development.' },
];

const AVAIL_DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const AVAIL_SLOTS = ['16:00','17:00','18:00','19:00','20:00','21:00'];

const INIT_AVAIL = {
  sandu: { Mon:['17:00','18:00','19:00'], Tue:['17:00','18:00','19:00'], Wed:[], Thu:['17:00','18:00','19:00','20:00'], Fri:['17:00','18:00'], Sat:[] },
  dina:  { Mon:['18:00','19:00'], Tue:['18:00','19:00'], Wed:['18:00'], Thu:['18:00','19:00'], Fri:['17:00','18:00','19:00'], Sat:[] },
};

function LoadMeter({ load, max }) {
  const pct = Math.min(load / max, 1);
  const color = pct > 0.85 ? 'var(--danger)' : pct > 0.65 ? 'var(--warning)' : 'var(--success)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Lesson load this week</span>
        <span className="r-tabular" style={{ fontSize: 12, fontWeight: 600, color }}>{load}/{max}</span>
      </div>
      <div style={{ height: 5, background: 'var(--hairline)', borderRadius: 'var(--r-pill)' }}>
        <div style={{ height: '100%', width: `${pct*100}%`, background: color, borderRadius: 'var(--r-pill)', transition: 'width var(--d-slow)' }} />
      </div>
    </div>
  );
}

function CoachRosterCard({ coach, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      background: 'var(--surface)', border: `1px solid ${selected ? 'var(--brand)' : 'var(--hairline)'}`,
      borderRadius: 'var(--r-card)', padding: 18, cursor: 'pointer',
      transition: 'border-color var(--d-fast)',
      boxShadow: selected ? '0 0 0 3px var(--brand-tint)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <Avatar name={coach.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{coach.name}</span>
            {coach.maitre && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--steel)', background: 'var(--steel-tint)', padding: '2px 7px', borderRadius: 'var(--r-pill)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maître</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            {coach.weapons.map(w => <WeaponChip key={w} type={w} />)}
          </div>
        </div>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{coach.bio}</p>
      <LoadMeter load={coach.load} max={coach.max} />
    </div>
  );
}

function AvailGrid({ coachId }) {
  const initSlots = INIT_AVAIL[coachId] || {};
  const [grid, setGrid] = React.useState(() => {
    const g = {};
    AVAIL_DAYS.forEach(d => AVAIL_SLOTS.forEach(s => { g[d + '|' + s] = (initSlots[d] || []).includes(s); }));
    return g;
  });
  const [blackout, setBlackout] = React.useState({ Wed: coachId === 'sandu' });

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
        Tap a slot to toggle availability. This is the weekly recurring template.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(6, 1fr)', gap: 4, minWidth: 380 }}>
          <div />
          {AVAIL_DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: blackout[d] ? 'var(--danger)' : 'var(--muted)', paddingBottom: 4 }}>{d}</div>
          ))}
          {AVAIL_SLOTS.map(s => (
            <React.Fragment key={s}>
              <div className="r-tabular" style={{ fontSize: 11, color: 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{s}</div>
              {AVAIL_DAYS.map(d => {
                const on = grid[d + '|' + s] && !blackout[d];
                return (
                  <button key={d+s} disabled={blackout[d]} onClick={() => setGrid(g => ({ ...g, [d+'|'+s]: !g[d+'|'+s] }))} className="r-focusable" style={{
                    aspectRatio: '1', borderRadius: 6, font: 'inherit',
                    cursor: blackout[d] ? 'default' : 'pointer',
                    border: '1px solid ' + (on ? 'var(--brand)' : 'var(--hairline)'),
                    background: blackout[d]
                      ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,var(--hairline) 4px,var(--hairline) 5px)'
                      : on ? 'var(--brand)' : 'var(--surface)',
                    transition: 'background var(--d-fast), border-color var(--d-fast)',
                  }} />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Blackout days:</span>
        {AVAIL_DAYS.map(d => (
          <button key={d} onClick={() => setBlackout(b => ({ ...b, [d]: !b[d] }))} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--r-pill)', border: '1px solid ' + (blackout[d] ? 'var(--danger)' : 'var(--hairline)'), background: blackout[d] ? 'var(--danger-tint)' : 'var(--surface)', color: blackout[d] ? 'var(--danger)' : 'var(--muted)' }}>{d}</button>
        ))}
      </div>
      <div style={{ marginTop: 20, padding: '13px 14px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="calendar" size={16} color="var(--steel)" />
        <div style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>Away Fri 13 Jun — regional competition</div>
        <Icon name="x" size={16} color="var(--faint)" style={{ cursor: 'pointer' }} />
      </div>
      <button className="r-focusable" style={{ marginTop: 10, font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--hairline)', background: 'transparent', borderRadius: 'var(--r-btn)', padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
        <Icon name="plus" size={15} color="var(--muted)" /> Add one-off exception
      </button>
    </div>
  );
}

function AdminCoaches() {
  const [selected, setSelected] = React.useState('sandu');
  const coach = COACHES_DATA.find(c => c.id === selected);
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--hairline)', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {COACHES_DATA.map(c => (
          <CoachRosterCard key={c.id} coach={c} selected={selected===c.id} onSelect={() => setSelected(c.id)} />
        ))}
        <button className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px dashed var(--hairline)', background: 'transparent', borderRadius: 'var(--r-card)', padding: 14, fontSize: 13.5, fontWeight: 600, color: 'var(--muted)' }}>
          <Icon name="plus" size={16} color="var(--muted)" /> Add coach
        </button>
      </div>
      <div key={selected} style={{ flex: 1, overflowY: 'auto', padding: 24, animation: 'r-fade var(--d-base) var(--e-standard)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Avatar name={coach.name} size={40} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{coach.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Weekly availability template</div>
          </div>
        </div>
        <AvailGrid coachId={selected} />
      </div>
    </div>
  );
}

Object.assign(window, { AdminCoaches, COACHES_DATA });
