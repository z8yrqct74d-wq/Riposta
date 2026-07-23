import React from 'react';
import { WeaponGlyph } from '../../components/Shared';
import { PISTES, CAL_START, CAL_END, PX_MIN, SNAP, fmtTime, KIND } from '../../data/adminData';

export const snap = (v) => Math.round(v / SNAP) * SNAP;
const overlap = (aS, aD, bS, bD) => aS < bS + bD && bS < aS + aD;

export function findConflicts(cand, blocks) {
  let pisteClash = false, coachClash = false;
  for (const b of blocks) {
    if (b.id === cand.id) continue;
    if (!overlap(cand.start, cand.dur, b.start, b.dur)) continue;
    if (b.piste === cand.piste) pisteClash = true;
    if (cand.coach && b.coach === cand.coach) coachClash = true;
  }
  return { pisteClash, coachClash, any: pisteClash || coachClash };
}

function CalBlock({ block, laneWidth, dragState, onPointerDownMove, onPointerDownResize, onClick, shaking, conflictLive, coachMap, calStart }) {
  const k = KIND[block.kind];
  const isDragging = dragState && dragState.id === block.id;
  const top = (block.start - calStart) * PX_MIN;
  const height = block.dur * PX_MIN;
  const clash = isDragging && conflictLive;
  return (
    <div
      onPointerDown={(e) => onPointerDownMove(e, block)}
      onClick={(e) => { if (!dragState) { e.stopPropagation(); onClick(block); } }}
      style={{
        position: 'absolute', top, height, left: 3, right: 3, zIndex: isDragging ? 30 : 5,
        background: clash ? 'var(--danger-tint)' : k.bg,
        border: `1px solid ${clash ? 'var(--danger)' : k.fg}`,
        borderLeft: `3px solid ${clash ? 'var(--danger)' : k.bar}`,
        borderRadius: 'var(--r-cal)', padding: '5px 7px', cursor: 'grab', overflow: 'hidden',
        boxShadow: isDragging ? 'var(--shadow-raise)' : 'none',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'top 160ms var(--e-standard), height 160ms var(--e-standard), transform var(--d-fast)',
        animation: shaking ? 'r-shake 320ms both' : 'none',
        userSelect: 'none', touchAction: 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        {block.weapon && <WeaponGlyph type={block.weapon} size={14} color={clash ? 'var(--danger)' : k.fg} />}
        <span style={{ fontSize: 12, fontWeight: 600, color: clash ? 'var(--danger)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.title}</span>
        {block.live && <span className="r-live-dot" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
      </div>
      {height > 34 && (
        <div className="r-tabular" style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
          {fmtTime(block.start)}–{fmtTime(block.start + block.dur)}{block.coach ? ` · ${coachMap[block.coach]?.name ?? 'Coach'}` : ''}
        </div>
      )}
      <div onPointerDown={(e) => { e.stopPropagation(); onPointerDownResize(e, block); }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, cursor: 'ns-resize' }}>
        <div style={{ width: 22, height: 3, borderRadius: 2, background: clash ? 'var(--danger)' : k.fg, opacity: 0.4, margin: '2px auto 0' }} />
      </div>
    </div>
  );
}

export function ResourceCalendar({ blocks, setBlocks, onSelect, onCreate, toast, coachMap, pistes, calStart, calEnd }) {
  const gridRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null);
  const [shakeId, setShakeId] = React.useState(null);
  const dragRef = React.useRef(null);
  dragRef.current = drag;

  // Backend pistes carry `name`; the legacy fallback constant uses `label`.
  const lanes = (pistes && pistes.length ? pistes : PISTES).map(p => ({ id: p.id, label: p.name ?? p.label, electric: p.electric }));
  const cs = calStart ?? CAL_START;
  const ce = calEnd ?? CAL_END;
  const laneCount = lanes.length;

  const beginMove = (e, block) => {
    e.preventDefault();
    setDrag({ id: block.id, mode: 'move', startX: e.clientX, startY: e.clientY,
      origStart: block.start, origDur: block.dur, origPiste: block.piste,
      curStart: block.start, curDur: block.dur, curPiste: block.piste });
  };
  const beginResize = (e, block) => {
    e.preventDefault();
    setDrag({ id: block.id, mode: 'resize', startX: e.clientX, startY: e.clientY,
      origStart: block.start, origDur: block.dur, origPiste: block.piste,
      curStart: block.start, curDur: block.dur, curPiste: block.piste });
  };

  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return;
      const dy = e.clientY - d.startY;
      const dMin = dy / PX_MIN;
      if (d.mode === 'move') {
        let ns = snap(d.origStart + dMin);
        ns = Math.max(cs, Math.min(ce - d.origDur, ns));
        const rect = gridRef.current.getBoundingClientRect();
        const colW = rect.width / laneCount;
        let col = Math.floor((e.clientX - rect.left) / colW);
        col = Math.max(0, Math.min(laneCount - 1, col));
        setDrag({ ...d, curStart: ns, curPiste: lanes[col].id });
      } else {
        let nd = snap(d.origDur + dMin);
        nd = Math.max(30, Math.min(ce - d.origStart, nd));
        setDrag({ ...d, curDur: nd });
      }
    };
    const onUp = () => {
      const d = dragRef.current; if (!d) return;
      const cand = { id: d.id, piste: d.curPiste, start: d.curStart, dur: d.curDur, coach: blocks.find(b=>b.id===d.id).coach };
      const c = findConflicts(cand, blocks);
      if (c.any) {
        setShakeId(d.id);
        setTimeout(() => setShakeId(null), 340);
        toast(c.pisteClash ? 'Piste already booked at that time' : `${coachMap[cand.coach]?.name ?? 'Coach'} is double-booked`, 'danger');
      } else {
        setBlocks(bs => bs.map(b => b.id === d.id ? { ...b, start: d.curStart, dur: d.curDur, piste: d.curPiste } : b));
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [drag, blocks]);

  const renderBlocks = blocks.map(b => drag && drag.id === b.id
    ? { ...b, start: drag.curStart, dur: drag.curDur, piste: drag.curPiste }
    : b);
  const liveConflict = drag ? findConflicts({ id: drag.id, piste: drag.curPiste, start: drag.curStart, dur: drag.curDur, coach: blocks.find(b=>b.id===drag.id).coach }, blocks).any : false;

  const totalH = (ce - cs) * PX_MIN;
  const hourLines = [];
  for (let t = cs; t <= ce; t += 30) hourLines.push(t);

  const onLaneClick = (e, pisteId) => {
    if (drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const start = Math.max(cs, Math.min(ce - 45, snap(cs + y / PX_MIN)));
    onCreate({ piste: pisteId, start, dur: 45 });
  };

  return (
    <div style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>
        <div style={{ width: 56, flexShrink: 0, borderRight: '1px solid var(--hairline)' }} />
        {lanes.map(p => (
          <div key={p.id} style={{ flex: 1, padding: '10px 10px', borderRight: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{p.label}</span>
            {p.electric && <span title="Electric" style={{ fontSize: 9, fontWeight: 600, color: 'var(--steel)', background: 'var(--steel-tint)', padding: '1px 5px', borderRadius: 'var(--r-pill)' }}>E</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', position: 'relative' }}>
        <div style={{ width: 56, flexShrink: 0, position: 'relative', borderRight: '1px solid var(--hairline)', height: totalH }}>
          {hourLines.map(t => t % 60 === 0 && (
            <div key={t} className="r-tabular" style={{ position: 'absolute', top: (t - cs) * PX_MIN - 7, right: 8, fontSize: 11, color: 'var(--faint)' }}>{fmtTime(t)}</div>
          ))}
        </div>
        <div ref={gridRef} style={{ flex: 1, display: 'flex', position: 'relative', height: totalH }}>
          {hourLines.map(t => (
            <div key={t} style={{ position: 'absolute', left: 0, right: 0, top: (t - cs) * PX_MIN, height: 1, background: t % 60 === 0 ? 'var(--hairline)' : 'color-mix(in oklab, var(--hairline) 45%, transparent)', pointerEvents: 'none' }} />
          ))}
          {lanes.map((p, i) => (
            <div key={p.id} onClick={(e) => onLaneClick(e, p.id)} style={{ flex: 1, position: 'relative', borderRight: i < laneCount - 1 ? '1px solid var(--hairline)' : 'none', cursor: 'copy' }}>
              {renderBlocks.filter(b => b.piste === p.id).map(b => (
                <CalBlock key={b.id} block={b} dragState={drag} shaking={shakeId === b.id}
                  conflictLive={liveConflict} coachMap={coachMap} calStart={cs}
                  onPointerDownMove={beginMove} onPointerDownResize={beginResize} onClick={onSelect} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
