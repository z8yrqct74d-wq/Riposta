// ============================================================
// RIPOSTE — Parent app · Book a lesson (HERO FLOW)
// Steps: pick coach → pick slot → confirm → success
// Transitions: horizontal slide, slot scale, credit roll-down, success ring
// ============================================================

const COACHES = [
  { id: 'sandu', name: 'Constantin Sandu', short: 'C. Sandu', weapons: ['sabre'], maitre: false, blurb: 'Sabre · technique', next: 'Today 18:00' },
  { id: 'dina', name: 'Lucian Dina', short: 'L. Dina', weapons: ['sabre'], maitre: false, blurb: 'Sabre · footwork & tactics', next: 'Today 19:30' },
];

const DAYS = [
  { id: 'd0', dow: 'Thu', dom: '5', label: 'Today' },
  { id: 'd1', dow: 'Fri', dom: '6' },
  { id: 'd2', dow: 'Sat', dom: '7' },
  { id: 'd3', dow: 'Mon', dom: '9' },
  { id: 'd4', dow: 'Tue', dom: '10' },
];

// available slots keyed by coach+day (real availability only)
const SLOTS = {
  'sandu|d0': [{ t: '18:00', piste: 'Riposte Main Room' }, { t: '18:45', piste: 'Riposte Main Room' }],
  'sandu|d1': [{ t: '17:00', piste: 'Riposte Main Room' }, { t: '17:45', piste: 'Riposte Main Room' }],
  'sandu|d2': [{ t: '10:00', piste: 'Riposte Main Room' }, { t: '10:45', piste: 'Riposte Main Room' }],
  'sandu|d3': [{ t: '18:00', piste: 'Riposte Main Room' }],
  'dina|d0': [{ t: '19:30', piste: 'Riposte Main Room' }],
  'dina|d1': [{ t: '17:00', piste: 'Riposte Main Room' }, { t: '17:45', piste: 'Riposte Main Room' }],
  'dina|d2': [{ t: '11:30', piste: 'Riposte Main Room' }, { t: '12:15', piste: 'Riposte Main Room' }],
  'dina|d4': [{ t: '18:30', piste: 'Riposte Main Room' }],
};

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          height: 4, borderRadius: 2, transition: 'all var(--d-base) var(--e-standard)',
          width: i === step ? 20 : 6,
          background: i <= step ? 'var(--brand)' : 'var(--hairline)',
        }} />
      ))}
    </div>
  );
}

function MaitrePill() {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: 'var(--steel)', background: 'var(--steel-tint)', padding: '2px 7px',
      borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-ui)',
    }}>Maître</span>
  );
}

// ---- Coach card ----
function CoachCard({ coach, selected, onPick, index }) {
  return (
    <button onClick={onPick} className="r-focusable" style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'var(--brand-tint)' : 'var(--surface)',
      border: `1px solid ${selected ? 'var(--brand)' : 'var(--hairline)'}`,
      borderRadius: 'var(--r-card)', padding: 14, display: 'flex', gap: 12, alignItems: 'center',
      boxShadow: 'var(--shadow-rest)', font: 'inherit',
      animation: `r-rise var(--d-base) var(--e-enter) ${index * 40}ms both`,
      transition: 'background var(--d-fast) var(--e-standard), border-color var(--d-fast) var(--e-standard)',
    }}>
      <Avatar name={coach.short} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{coach.short}</span>
          {coach.maitre && <MaitrePill />}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>{coach.blurb}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {coach.weapons.map(w => <WeaponGlyph key={w} type={w} size={20} />)}
        </div>
        <span className="r-tabular" style={{ fontSize: 11, color: 'var(--faint)' }}>{coach.next}</span>
      </div>
    </button>
  );
}

// ---- Slot chip ----
function SlotChip({ slot, selected, onPick }) {
  const [press, setPress] = React.useState(false);
  return (
    <button
      onClick={onPick}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)} onMouseLeave={() => setPress(false)}
      className="r-focusable r-tabular"
      style={{
        cursor: 'pointer', font: 'inherit', textAlign: 'left',
        background: selected ? 'var(--brand)' : 'var(--surface)',
        border: `1px solid ${selected ? 'var(--brand)' : 'var(--hairline)'}`,
        borderRadius: 'var(--r-btn)', padding: '11px 13px',
        transform: press ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform var(--d-fast) var(--e-spring), background var(--d-fast), border-color var(--d-fast)',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: selected ? '#fff' : 'var(--ink)' }}>{slot.t}</span>
      <span style={{ fontSize: 11.5, color: selected ? 'rgba(255,255,255,0.8)' : 'var(--faint)' }}>{slot.piste}</span>
    </button>
  );
}

// ---- Success ring ----
function SuccessRing({ size = 96 }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--success-tint)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--success)" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c}
          style={{ strokeDashoffset: c, animation: 'r-ring-draw 360ms var(--e-standard) 120ms forwards' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'r-pop 320ms var(--e-spring) 360ms both',
      }}>
        <Icon name="check" size={40} color="var(--success)" strokeWidth={2.4} />
      </div>
      <style>{`
        @keyframes r-ring-draw { to { stroke-dashoffset: 0; } }
        @keyframes r-pop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

// ---- The flow ----
function BookFlow({ credits, onClose, onBooked }) {
  const [step, setStep] = React.useState(0);
  const [coachId, setCoachId] = React.useState(null);
  const [dayId, setDayId] = React.useState('d0');
  const [slotIdx, setSlotIdx] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  const [showMinus, setShowMinus] = React.useState(false);
  const [rolled, setRolled] = React.useState(false);

  const coach = COACHES.find(c => c.id === coachId);
  const daySlots = SLOTS[`${coachId}|${dayId}`] || [];
  const day = DAYS.find(d => d.id === dayId);
  const slot = slotIdx != null ? daySlots[slotIdx] : null;

  const go = (s) => setStep(s);

  const confirm = () => {
    setConfirming(true);
    // credit deduction animation
    setTimeout(() => setShowMinus(true), 120);
    setTimeout(() => setRolled(true), 360);
    setTimeout(() => { onBooked && onBooked(); go(3); }, 900);
  };

  const headers = ['Pick a coach', 'Choose a time', 'Confirm', ''];

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)', display: 'flex', flexDirection: 'column', zIndex: 30 }}>
      {/* top bar */}
      {step < 3 && (
        <div style={{ padding: '58px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => step === 0 ? onClose() : go(step - 1)} className="r-focusable" style={{
              width: 36, height: 36, borderRadius: 'var(--r-pill)', border: '1px solid var(--hairline)',
              background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon name={step === 0 ? 'x' : 'chevL'} size={18} color="var(--ink)" />
            </button>
            <StepDots step={step} />
            <div style={{ width: 36 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Step {step + 1} of 3</div>
            <h1 className="r-display" style={{ margin: '2px 0 0', fontSize: 26, color: 'var(--ink)' }}>{headers[step]}</h1>
          </div>
        </div>
      )}

      {/* sliding track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', height: '100%', width: '400%',
          transform: `translateX(-${step * 25}%)`,
          transition: 'transform var(--d-slow) var(--e-standard)',
        }}>
          {/* STEP 0 — coach */}
          <div className="r-scroll" style={{ width: '25%', overflowY: 'auto', padding: '4px 16px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COACHES.map((c, i) => (
                <CoachCard key={c.id} coach={c} index={i} selected={coachId === c.id}
                  onPick={() => { setCoachId(c.id); setSlotIdx(null); setTimeout(() => go(1), 160); }} />
              ))}
            </div>
          </div>

          {/* STEP 1 — slot */}
          <div className="r-scroll" style={{ width: '25%', overflowY: 'auto', padding: '4px 16px 24px' }}>
            {coach && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Avatar name={coach.short} size={34} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{coach.short}</div>
                {coach.maitre && <MaitrePill />}
              </div>
            )}
            {/* day strip */}
            <div className="r-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 }}>
              {DAYS.map(d => {
                const has = (SLOTS[`${coachId}|${d.id}`] || []).length > 0;
                const sel = dayId === d.id;
                return (
                  <button key={d.id} disabled={!has} onClick={() => { setDayId(d.id); setSlotIdx(null); }} className="r-focusable r-tabular" style={{
                    flexShrink: 0, width: 52, padding: '8px 0', cursor: has ? 'pointer' : 'default',
                    background: sel ? 'var(--ink)' : 'var(--surface)', font: 'inherit',
                    border: `1px solid ${sel ? 'var(--ink)' : 'var(--hairline)'}`, borderRadius: 'var(--r-btn)',
                    opacity: has ? 1 : 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}>
                    <span style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.7)' : 'var(--faint)' }}>{d.label || d.dow}</span>
                    <span style={{ fontSize: 17, fontWeight: 600, color: sel ? '#fff' : 'var(--ink)' }}>{d.dom}</span>
                  </button>
                );
              })}
            </div>
            {/* slots */}
            {daySlots.length > 0 ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 10 }}>{day?.label || `${day?.dow} ${day?.dom}`} · {daySlots.length} open</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {daySlots.map((s, i) => (
                    <SlotChip key={i} slot={s} selected={slotIdx === i} onPick={() => setSlotIdx(i)} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
                <div className="r-display" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>No open slots</div>
                <div style={{ fontSize: 13 }}>Try another day.</div>
              </div>
            )}
          </div>

          {/* STEP 2 — confirm */}
          <div className="r-scroll" style={{ width: '25%', overflowY: 'auto', padding: '4px 16px 24px' }}>
            {coach && slot && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
                <SummaryRow label="Coach" value={coach.short} extra={coach.maitre && <MaitrePill />} />
                <SummaryRow label="Weapon" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WeaponGlyph type="sabre" size={18} /> Sabre</span>} />
                <SummaryRow label="When" value={`${day?.label || day?.dow+' '+day?.dom} · ${slot.t}`} />
                <SummaryRow label="Piste" value={slot.piste} />
                <SummaryRow label="Length" value="45 min" />
                <SummaryRow label="Cost" value={<span style={{ color: 'var(--brand)', fontWeight: 600 }}>1 credit</span>} last />
              </div>
            )}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Your balance</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                {showMinus && (
                  <span className="r-mono" style={{ position: 'absolute', right: 0, top: -2, color: 'var(--brand)', fontSize: 13, fontWeight: 600, animation: 'r-float-up 480ms var(--e-standard) forwards' }}>−1</span>
                )}
                <span className="r-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', transition: 'transform var(--d-base)' }}>{rolled ? credits - 1 : credits}</span>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>credits</span>
              </div>
            </div>
          </div>

          {/* STEP 3 placeholder (success rendered separately) */}
          <div style={{ width: '25%' }} />
        </div>
      </div>

      {/* footer CTA */}
      {step === 1 && (
        <FlowFooter>
          <PrimaryBtn disabled={slotIdx == null} onClick={() => go(2)}>{slotIdx == null ? 'Select a time' : 'Continue'}</PrimaryBtn>
        </FlowFooter>
      )}
      {step === 2 && (
        <FlowFooter>
          <PrimaryBtn disabled={confirming} onClick={confirm}>{confirming ? 'Booking…' : 'Confirm — use 1 credit'}</PrimaryBtn>
        </FlowFooter>
      )}

      {/* SUCCESS overlay */}
      {step === 3 && coach && slot && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', zIndex: 5 }}>
          <SuccessRing />
          <div style={{ textAlign: 'center', maxWidth: 270, marginTop: 22 }}>
            <h1 className="r-display" style={{ fontSize: 30, color: 'var(--ink)', margin: 0, animation: 'r-rise var(--d-base) var(--e-enter) 360ms both' }}>You’re booked.</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.5, animation: 'r-rise var(--d-base) var(--e-enter) 440ms both' }}>
              {coach.short} · {day?.label || day?.dow+' '+day?.dom} at {slot.t}, {slot.piste}. We’ll remind you an hour before.
            </p>
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280, animation: 'r-rise var(--d-base) var(--e-enter) 520ms both' }}>
            <PrimaryBtn onClick={onClose}>Done</PrimaryBtn>
            <button onClick={onClose} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', padding: '12px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'transparent', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>Add to calendar</button>
          </div>
          <style>{`@keyframes r-float-up { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }`}</style>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, extra, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{value}{extra}</span>
    </div>
  );
}

function FlowFooter({ children }) {
  return (
    <div style={{ flexShrink: 0, padding: '12px 16px 30px', borderTop: '1px solid var(--hairline)', background: 'var(--surface)' }}>{children}</div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="r-focusable" style={{
      width: '100%', padding: '14px', borderRadius: 'var(--r-btn)', border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: disabled ? 'var(--hairline)' : 'var(--brand)', color: disabled ? 'var(--faint)' : '#fff',
      fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, minHeight: 48,
      transition: 'background var(--d-fast)',
    }}>{children}</button>
  );
}

Object.assign(window, { BookFlow, COACHES, DAYS, SLOTS, MaitrePill, PrimaryBtn, SuccessRing, StepDots });
