// ============================================================
// RIPOSTE — Parent app · Schedule, Payments, Progress, Check-in
// ============================================================

function PageHead({ greeting, title }) {
  return (
    <div style={{ padding: '56px 20px 8px' }}>
      {greeting && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>{greeting}</div>}
      <h1 className="r-display" style={{ margin: 0, fontSize: 30, color: 'var(--ink)' }}>{title}</h1>
    </div>
  );
}

function ColorBarRow({ bar, children, onClick }) {
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

// ---------- SCHEDULE (C3) ----------
function ScheduleScreen() {
  const [items, setItems] = React.useState([
    { id: 1, kind: 'Lesson', who: 'C. Sandu', weapon: 'sabre', when: 'Today · 18:00', piste: 'Riposte Main Room', bar: 'var(--brand)', window: true },
    { id: 2, kind: 'Group',  who: 'Sabre squad', weapon: 'sabre', when: 'Fri 6 · 17:30', piste: 'Riposte Main Room', bar: 'var(--steel)', window: true },
    { id: 3, kind: 'Lesson', who: 'L. Dina', weapon: 'sabre', when: 'Sat 7 · 11:30', piste: 'Riposte Main Room', bar: 'var(--brand)', window: false },
  ]);
  const [confirm, setConfirm] = React.useState(null);

  const item = items.find(i => i.id === confirm);
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <PageHead title="Schedule" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={it.id} style={{ animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
            <ColorBarRow bar={it.bar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WeaponGlyph type={it.weapon} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{it.who}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--faint)' }}>{it.kind}</span>
                  </div>
                  <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{it.when} · {it.piste}</div>
                </div>
                <button onClick={() => setConfirm(it.id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', background: 'transparent', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: '5px 11px' }}>Cancel</button>
              </div>
            </ColorBarRow>
          </div>
        ))}
      </div>
      {/* cancel confirmation sheet */}
      {item && (
        <BottomSheet onClose={() => setConfirm(null)}>
          <div style={{ padding: '8px 20px 30px' }}>
            <h2 className="r-display" style={{ fontSize: 22, color: 'var(--ink)', margin: '0 0 8px' }}>Cancel this lesson?</h2>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 18px' }}>
              {item.who} · {item.when}.{' '}
              {item.window
                ? <>You’re outside the 12-hour window, so your <strong style={{ color: 'var(--success)' }}>credit will be refunded</strong>.</>
                : <>You’re inside the 12-hour window, so this <strong style={{ color: 'var(--danger)' }}>credit will be forfeited</strong>.</>}
            </p>
            <button onClick={() => { setItems(items.filter(x => x.id !== item.id)); setConfirm(null); }} className="r-focusable" style={{
              width: '100%', padding: 14, borderRadius: 'var(--r-btn)', cursor: 'pointer', font: 'inherit', fontSize: 15, fontWeight: 600,
              marginBottom: 8, background: 'transparent', color: 'var(--brand)', border: '1px solid var(--brand)',
            }}>{item.window ? 'Cancel & refund credit' : 'Cancel & forfeit credit'}</button>
            <button onClick={() => setConfirm(null)} className="r-focusable" style={{ width: '100%', padding: 14, borderRadius: 'var(--r-btn)', cursor: 'pointer', font: 'inherit', fontSize: 15, fontWeight: 600, background: 'var(--ink)', color: 'var(--paper)', border: 'none' }}>Keep lesson</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ---------- PAYMENTS (C4) ----------
function PaymentsScreen() {
  const [sheet, setSheet] = React.useState(false);
  const [paid, setPaid] = React.useState(false);
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <PageHead title="Payments" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* plan status */}
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
        {/* buy package CTA */}
        <button onClick={() => { setPaid(false); setSheet(true); }} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', textAlign: 'left', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 'var(--r-card)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Buy a lesson package</div>
            <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2 }}>5 / 10 / 20 credits · save up to 15%</div>
          </div>
          <Icon name="chevR" size={20} color="var(--paper)" />
        </button>
        {/* outstanding */}
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
        {/* history */}
        <div>
          <SectionLabel>History</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            {[['1 Jun','Monthly subscription','€120.00','paid'],['18 May','10-credit package','€220.00','paid'],['1 May','Monthly subscription','€120.00','paid'],['22 Apr','Drop-in session','€18.00','refunded']].map((r, i, a) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < a.length-1 ? '1px solid var(--hairline)' : 'none' }}>
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

// ---------- PROGRESS (C5) ----------
const ATT_HISTORY = [
  { w: 'W1', att: true }, { w: 'W2', att: true }, { w: 'W3', att: false },
  { w: 'W4', att: true }, { w: 'W5', att: true }, { w: 'W6', att: true },
  { w: 'W7', att: true }, { w: 'W8', att: false },{ w: 'W9', att: true },
  { w: 'W10', att: true },{ w: 'W11', att: true },{ w: 'W12', att: true },
];

function ProgressScreen() {
  const [weapon, setWeapon] = React.useState('sabre');
  const attended = ATT_HISTORY.filter(w => w.att).length;
  const rate = Math.round(attended / ATT_HISTORY.length * 100);
  return (
    <div style={{ height: '100%' }}>
      <PageHead title="Progress" />
      <div className="r-scroll" style={{ overflowY: 'auto', height: 'calc(100% - 96px)', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* stats row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[['Attendance', rate + '%', 'var(--success)'], ['Sessions', attended, 'var(--ink)'], ['Streak', '4 wks', 'var(--steel)']].map((s, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 12px', textAlign: 'center' }}>
              <div className="r-display r-tabular" style={{ fontSize: 26, color: s[2] }}>{s[1]}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{s[0]}</div>
            </div>
          ))}
        </div>
        {/* attendance streak bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Last 12 weeks</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
            {ATT_HISTORY.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', height: 28, borderRadius: 4,
                  background: w.att ? 'var(--brand)' : 'var(--hairline)',
                  opacity: w.att ? 1 : 0.5,
                  transition: 'background var(--d-base)',
                }} />
                <span style={{ fontSize: 9, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{w.w}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--brand)', display: 'inline-block' }} /> Attended</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--hairline)', display: 'inline-block' }} /> Absent</span>
          </div>
        </div>
        {/* per-weapon segment */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: 4 }}>
          {['sabre'].map(w => (
            <button key={w} onClick={() => setWeapon(w)} className="r-focusable" style={{ flex: 1, font: 'inherit', cursor: 'pointer', border: 'none', borderRadius: 'var(--r-pill)', padding: '8px', background: 'var(--ink)', color: 'var(--paper)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <WeaponGlyph type={w} size={16} color="var(--paper)" /> {WEAPON_LABEL[w]}
            </button>
          ))}
        </div>
        {/* coach notes */}
        <div>
          <SectionLabel>Coach notes</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { d: '3 Jun', coach: 'C. Sandu', focus: 'Distance control in the lunge', note: 'Strong tempo. Worked on holding distance before committing — keep the back foot loaded. Homework: shadow footwork, 10 min ×3 this week.' },
              { d: '28 May', coach: 'C. Sandu', focus: 'Parry-riposte timing', note: 'Quick hands, but riposte arrives early. Wait for the blade. Improved disengage on the second intention.' },
              { d: '22 May', coach: 'L. Dina', focus: 'Advance-lunge cadence', note: 'Footwork session. Cadence much cleaner. Needs more extension at end of lunge. Extension drills daily.' },
            ].map((n, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14, animation: `r-rise var(--d-base) var(--e-enter) ${i*40}ms both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name="sparkle" size={13} color="var(--steel)" />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--steel)' }}>Focus</span>
                  <span style={{ fontSize: 11.5, color: 'var(--faint)', marginLeft: 'auto' }}>{n.coach} · {n.d}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{n.focus}</div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- CHECK-IN (C6) ----------
function CheckinScreen() {
  const [scanned, setScanned] = React.useState(false);
  return (
    <div style={{ height: '100%', background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', color: 'var(--paper)' }}>
        <div className="r-display" style={{ fontSize: 20, letterSpacing: '0.02em' }}>Salle d’Armes</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Show this at the door</div>
      </div>
      {!scanned ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.4)', animation: 'r-rise var(--d-slow) var(--e-enter) both' }}>
          <QRBlock />
          <div className="r-mono" style={{ textAlign: 'center', fontSize: 13, color: '#17150F', marginTop: 14, letterSpacing: '0.06em' }}>MAYA·R·7F2K9</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SuccessRing size={120} />
          <div className="r-display" style={{ fontSize: 28, color: 'var(--paper)', marginTop: 22, animation: 'r-rise var(--d-base) var(--e-enter) 400ms both' }}>Maya Rocha</div>
          <div style={{ fontSize: 14, color: 'var(--success)', marginTop: 4, animation: 'r-rise var(--d-base) var(--e-enter) 500ms both' }}>Checked in · 17:54</div>
        </div>
      )}
      <button onClick={() => setScanned(s => !s)} className="r-focusable" style={{ position: 'absolute', bottom: 40, font: 'inherit', cursor: 'pointer', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--r-pill)', padding: '8px 16px' }}>
        {scanned ? 'Reset demo' : 'Simulate scan'}
      </button>
    </div>
  );
}

function QRBlock() {
  // deterministic pseudo-QR
  const cells = [];
  const seed = (x, y) => ((x*73 + y*131 + x*y*17) % 7) > 2;
  const N = 21;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const finder = (fx, fy) => x>=fx&&x<fx+7&&y>=fy&&y<fy+7;
    const inFinder = finder(0,0) || finder(N-7,0) || finder(0,N-7);
    let on;
    if (inFinder) {
      const lx = x % (N-7 || 1); // crude
      const within = (a,b) => { const rx=x-a, ry=y-b; return (rx===0||rx===6||ry===0||ry===6) || (rx>=2&&rx<=4&&ry>=2&&ry<=4); };
      on = within(finder(0,0)?0:(finder(N-7,0)?N-7:0), finder(0,N-7)?N-7:0);
      // simpler: recompute per corner
      on = false;
      [[0,0],[N-7,0],[0,N-7]].forEach(([a,b]) => { if(x>=a&&x<a+7&&y>=b&&y<b+7){ const rx=x-a, ry=y-b; if((rx===0||rx===6||ry===0||ry===6)||(rx>=2&&rx<=4&&ry>=2&&ry<=4)) on=true; } });
    } else { on = seed(x,y); }
    cells.push(on);
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, width: 200, height: 200, gap: 0 }}>
      {cells.map((c, i) => <div key={i} style={{ background: c ? '#17150F' : 'transparent' }} />)}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 2px' }}>{children}</div>;
}

// ---- Bottom sheet (slide-up + scrim) ----
function BottomSheet({ children, onClose }) {
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

// ---------- PROFILE ----------
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

function ProfileScreen({ focusSection }) {
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <Avatar name="Maya Rocha" size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Maya Rocha</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Sabre · U17</div>
          <div className="r-mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3, letterSpacing: '0.04em' }}>MBR-20831</div>
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
                  <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)' }}>Expires 14 Jun 2026 · 9 days left</div>
                </div>
                <VisaBadge status="expiring" />
              </div>
              <button className="r-focusable" style={{ marginTop: 12, font: 'inherit', cursor: 'pointer', width: '100%', padding: '9px', borderRadius: 'var(--r-btn)', border: '1px solid var(--warning)', background: 'var(--warning-tint)', color: 'var(--warning)', fontSize: 13, fontWeight: 600 }}>
                Upload renewal
              </button>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Federation licence</div>
                  <div className="r-mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>FIE-ROU-20831</div>
                  <div className="r-tabular" style={{ fontSize: 12.5, color: 'var(--muted)' }}>Expires 31 Dec 2026</div>
                </div>
                <VisaBadge status="valid" />
              </div>
            </div>
          </ProfileSection>
        </div>

        <ProfileSection title="Club membership">
          <ProfileRow label="Plan"          value="Competitor · Monthly" />
          <ProfileRow label="Weapon"        value={<span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><WeaponGlyph type="sabre" size={16} /> Sabre</span>} />
          <ProfileRow label="Category"      value="U17" />
          <ProfileRow label="Member since"  value="Sep 2023" last />
        </ProfileSection>

        <ProfileSection title="Personal">
          <ProfileRow icon="user"    label="Date of birth"     value="12 Mar 2009" />
          <ProfileRow icon="message" label="Email"             value="maya@email.com" />
          <ProfileRow icon="bell"    label="Emergency contact" value="Ana Rocha" onTap={() => {}} last />
        </ProfileSection>

        <ProfileSection title="Account">
          <ProfileRow icon="bell"    label="Notifications"  value="On"  onTap={() => {}} />
          <ProfileRow icon="lock"    label="Sign out"       value=""    accent="var(--brand)" onTap={() => {}} last />
        </ProfileSection>

      </div>
    </div>
  );
}

Object.assign(window, { ScheduleScreen, PaymentsScreen, ProgressScreen, CheckinScreen, BottomSheet, PageHead, SectionLabel, ColorBarRow, ProfileScreen });
