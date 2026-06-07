import React from 'react';
import { Icon, Avatar, WeaponGlyph } from '../../components/Shared';
import { BottomSheet } from '../athlete/AthleteMisc';

export const ATT_STATES = [
  { id: 'present', label: 'Present', color: 'var(--success)' },
  { id: 'late',    label: 'Late',    color: 'var(--warning)' },
  { id: 'absent',  label: 'Absent',  color: 'var(--muted)' },
  { id: 'excused', label: 'Excused', color: 'var(--steel)' },
];

export function AttToggle({ value, onChange }) {
  const idx = ATT_STATES.findIndex(s => s.id === value);
  return (
    <div style={{ position: 'relative', display: 'flex', background: 'var(--elevated)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: 3 }}>
      {idx >= 0 && (
        <div style={{
          position: 'absolute', top: 3, bottom: 3, left: `calc(${idx * 25}% + 3px)`, width: `calc(25% - 6px)`,
          background: ATT_STATES[idx].color, borderRadius: 'var(--r-pill)',
          transition: 'left 220ms var(--e-spring)',
        }} />
      )}
      {ATT_STATES.map(s => {
        const on = s.id === value;
        return (
          <button key={s.id} onClick={() => onChange(s.id)} className="r-focusable" style={{
            position: 'relative', zIndex: 1, flex: 1, font: 'inherit', cursor: 'pointer',
            border: 'none', background: 'transparent', padding: '7px 2px', borderRadius: 'var(--r-pill)',
            fontSize: 11.5, fontWeight: 600,
            color: on ? (s.id === 'absent' ? 'var(--ink)' : '#fff') : 'var(--muted)',
            transition: 'color var(--d-base)',
          }}>{s.label}</button>
        );
      })}
    </div>
  );
}

export const ROSTER = [
  { id: 1, name: 'Maya Rocha', cat: 'U17', weapon: 'foil' },
  { id: 2, name: 'Tomas Király', cat: 'Senior', weapon: 'epee' },
  { id: 3, name: 'Léa Bernard', cat: 'U14', weapon: 'sabre' },
  { id: 4, name: 'Hugo Almeida', cat: 'Senior', weapon: 'foil' },
  { id: 5, name: 'Sofia Marin', cat: 'U14', weapon: 'sabre' },
  { id: 6, name: 'Noah Klein', cat: 'U11', weapon: 'foil' },
];

export function CoachHeader({ onBack, title, sub, weapon, live }) {
  return (
    <div style={{ flexShrink: 0, padding: '56px 16px 12px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} className="r-focusable" style={{ width: 36, height: 36, borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="chevL" size={18} color="var(--ink)" />
        </button>
        {weapon && <WeaponGlyph type={weapon} size={24} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="r-display" style={{ margin: 0, fontSize: 21, color: 'var(--ink)' }}>{title}</h1>
            {live && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: 'var(--live)' }}><span className="r-live-dot" /> LIVE</span>}
          </div>
          <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

function DropInSheet({ onClose, onAdd }) {
  const [name, setName] = React.useState('');
  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 20px 30px' }}>
        <h2 className="r-display" style={{ fontSize: 22, color: 'var(--ink)', margin: '0 0 14px' }}>Add a drop-in</h2>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Athlete name" className="r-focusable" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', font: 'inherit', fontSize: 15, color: 'var(--ink)', boxSizing: 'border-box', marginBottom: 14 }} />
        <button disabled={!name.trim()} onClick={() => onAdd(name.trim())} className="r-focusable" style={{ width: '100%', padding: 14, borderRadius: 'var(--r-btn)', border: 'none', background: name.trim() ? 'var(--brand)' : 'var(--hairline)', color: name.trim() ? '#fff' : 'var(--faint)', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default' }}>Add to roster</button>
      </div>
    </BottomSheet>
  );
}

export function SessionAttendance({ onBack, onDone }) {
  const [att, setAtt] = React.useState({ 1: 'present', 2: 'present' });
  const [roster, setRoster] = React.useState(ROSTER);
  const [sheet, setSheet] = React.useState(false);
  const marked = Object.keys(att).length;

  const addDropIn = (name) => {
    const id = Date.now();
    setRoster(r => [...r, { id, name, cat: 'Drop-in', weapon: 'foil', dropin: true }]);
    setAtt(a => ({ ...a, [id]: 'present' }));
    setSheet(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <CoachHeader onBack={onBack} title="Sabre squad" sub="18:00 · Piste 3 · 90 min" weapon="sabre" live />
      <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{marked} of {roster.length} marked</span>
        <button onClick={() => setSheet(true)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--ink)', borderRadius: 'var(--r-pill)', padding: '5px 11px', fontSize: 12.5, fontWeight: 600 }}>
          <Icon name="plus" size={14} color="var(--ink)" /> Drop-in
        </button>
      </div>
      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {roster.map((p, i) => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 12, animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar name={p.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                  <WeaponGlyph type={p.weapon} size={15} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 1 }}>{p.cat}</div>
              </div>
              {p.dropin && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--steel)', background: 'var(--steel-tint)', padding: '2px 7px', borderRadius: 'var(--r-pill)' }}>NEW</span>}
            </div>
            <AttToggle value={att[p.id]} onChange={(v) => setAtt(a => ({ ...a, [p.id]: v }))} />
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: '12px 16px 30px', borderTop: '1px solid var(--hairline)', background: 'var(--surface)' }}>
        <button onClick={onDone} className="r-focusable" style={{ width: '100%', padding: 15, borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 50 }}>Done · {marked} marked</button>
      </div>
      {sheet && <DropInSheet onClose={() => setSheet(false)} onAdd={addDropIn} />}
    </div>
  );
}

export function LessonView({ onBack }) {
  const [credits, setCredits] = React.useState(5);
  const [done, setDone] = React.useState(false);
  const [showMinus, setShowMinus] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [tidied, setTidied] = React.useState(false);
  const [tidying, setTidying] = React.useState(false);

  const markDone = () => {
    setDone(true);
    setTimeout(() => setShowMinus(true), 120);
    setTimeout(() => setCredits(4), 360);
  };
  const tidy = () => {
    setTidying(true);
    setTimeout(() => { setTidying(false); setTidied(true); }, 900);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <CoachHeader onBack={onBack} title="Maya Rocha" sub="18:00 · Piste 3 · 45 min" weapon="foil" />
      <div className="r-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Maya Rocha" size={40} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Individual lesson</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Foil · U17</div>
            </div>
          </div>
          <div style={{ position: 'relative', textAlign: 'right' }}>
            {showMinus && <span className="r-mono" style={{ position: 'absolute', right: 0, top: -14, color: 'var(--brand)', fontSize: 13, fontWeight: 600, animation: 'r-float-up 480ms var(--e-standard) forwards' }}>−1</span>}
            <div className="r-mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>{credits}</div>
            <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>credits left</div>
          </div>
        </div>

        {!done ? (
          <button onClick={markDone} className="r-focusable" style={{ width: '100%', padding: 15, borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16, minHeight: 50 }}>Mark done · use 1 credit</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 'var(--r-btn)', background: 'var(--success-tint)', color: 'var(--success)', fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>
            <Icon name="check" size={16} color="var(--success)" strokeWidth={2.2} /> Lesson completed · 1 credit deducted
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Lesson note</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Quick free-text — what you worked on, how it went…" className="r-focusable" style={{ width: '100%', minHeight: 90, padding: 13, borderRadius: 'var(--r-card)', border: '1px solid var(--hairline)', background: 'var(--surface)', font: 'inherit', fontSize: 14, color: 'var(--ink)', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }} />
        <button disabled={!note.trim() || tidying} onClick={tidy} className="r-focusable" style={{ marginTop: 10, width: '100%', padding: 13, borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--surface)', color: note.trim() ? 'var(--ink)' : 'var(--faint)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: note.trim() && !tidying ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="sparkle" size={16} color={note.trim() ? 'var(--steel)' : 'var(--faint)'} /> {tidying ? 'Tidying…' : tidied ? 'Re-tidy' : 'Save & tidy with AI'}
        </button>

        {tidying && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[60, 90, 75].map((w, i) => <div key={i} className="r-skeleton" style={{ height: 12, width: `${w}%` }} />)}
          </div>
        )}
        {tidied && !tidying && (
          <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14, animation: 'r-fade var(--d-slow) var(--e-enter)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="sparkle" size={14} color="var(--steel)" />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--steel)' }}>Tidied summary</span>
            </div>
            {[
              ['Focus', 'Distance control in the lunge.'],
              ['Improved', 'Holding distance before committing; back foot stays loaded.'],
              ['Homework', 'Shadow footwork, 10 min, ×3 this week.'],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--steel)', width: 72, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{k}</span>
                <span style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.45 }}>{v}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10, fontStyle: 'italic' }}>Athlete sees this in their Progress tab.</div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes r-float-up { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-22px); } }
        @keyframes r-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
