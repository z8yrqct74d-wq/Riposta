import React from 'react';

export function WeaponGlyph({ type = 'foil', size = 20, color = 'var(--steel)', strokeWidth, style = {} }) {
  const sw = strokeWidth ?? 1.5;
  const common = {
    fill: 'none', stroke: color, strokeWidth: sw,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  let body;
  if (type === 'foil') {
    body = (
      <g {...common}>
        <line x1="7.5" y1="16.5" x2="20" y2="4" />
        <circle cx="7.5" cy="16.5" r="1.7" />
        <line x1="6.3" y1="17.7" x2="4" y2="20" />
        <circle cx="3.4" cy="20.6" r="0.9" fill={color} stroke="none" />
      </g>
    );
  } else if (type === 'epee') {
    body = (
      <g {...common}>
        <line x1="8" y1="16" x2="20" y2="4" strokeWidth={sw + 0.5} />
        <line x1="10.3" y1="13.7" x2="13.6" y2="9.2" strokeWidth={sw - 0.7} opacity="0.55" />
        <path d="M5.4 18.6 A3.4 3.4 0 0 1 9.4 14.6" />
        <line x1="6.6" y1="17.4" x2="4" y2="20" />
        <circle cx="3.4" cy="20.6" r="0.95" fill={color} stroke="none" />
      </g>
    );
  } else {
    body = (
      <g {...common}>
        <path d="M7.8 16.2 C 12 12, 16 7.5, 20 4.2" />
        <path d="M6.4 17.6 C 2.7 17.4, 2.4 20, 4 20.6" />
        <line x1="6.6" y1="17.4" x2="4.4" y2="19.6" />
        <circle cx="3.9" cy="20.2" r="0.9" fill={color} stroke="none" />
      </g>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-label={type}>
      {body}
    </svg>
  );
}

export const WEAPON_LABEL = { foil: 'Foil', epee: 'Épée', sabre: 'Sabre' };

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.5, style = {} }) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    calendar: <g {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></g>,
    clock: <g {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g>,
    check: <g {...p}><path d="M4.5 12.5l5 5 10-11"/></g>,
    x: <g {...p}><path d="M6 6l12 12M18 6L6 18"/></g>,
    plus: <g {...p}><path d="M12 5v14M5 12h14"/></g>,
    minus: <g {...p}><path d="M5 12h14"/></g>,
    chevR: <g {...p}><path d="M9 5l7 7-7 7"/></g>,
    chevL: <g {...p}><path d="M15 5l-7 7 7 7"/></g>,
    chevD: <g {...p}><path d="M5 9l7 7 7-7"/></g>,
    arrowL: <g {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></g>,
    search: <g {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></g>,
    bell: <g {...p}><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></g>,
    user: <g {...p}><circle cx="12" cy="8.5" r="3.8"/><path d="M5 20a7 7 0 0 1 14 0"/></g>,
    users: <g {...p}><circle cx="9" cy="8.5" r="3.3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 5.5a3.3 3.3 0 0 1 0 6.4M21 19a6 6 0 0 0-4-5.6"/></g>,
    card: <g {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/></g>,
    home: <g {...p}><path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/></g>,
    grid: <g {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></g>,
    chart: <g {...p}><path d="M4 20V4M4 20h16"/><rect x="7.5" y="12" width="3" height="5"/><rect x="13" y="8.5" width="3" height="8.5"/><rect x="18.5" y="14.5" width="0.1" height="2.5"/></g>,
    qr: <g {...p}><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 14.5h3v3M20.5 14.5v6h-6"/></g>,
    sparkle: <g {...p}><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/></g>,
    settings: <g {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3"/></g>,
    pin: <g {...p}><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></g>,
    note: <g {...p}><path d="M5 3.5h11l3 3V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 14h6"/></g>,
    money: <g {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M14.5 9.2c0-1-1.1-1.7-2.5-1.7s-2.5.8-2.5 1.9 1 1.6 2.5 1.9 2.6.9 2.6 2-1.2 1.9-2.6 1.9-2.6-.7-2.6-1.7"/></g>,
    refresh: <g {...p}><path d="M20 11a8 8 0 0 0-14-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 4.5L20 16M20 20v-4h-4"/></g>,
    cloudOff: <g {...p}><path d="M3 3l18 18M7 8a5 5 0 0 0 .5 9.5H17M17.5 16.5A4 4 0 0 0 17 9h-1.3A6 6 0 0 0 9 5.5"/></g>,
    lock: <g {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></g>,
    dots: <g {...p}><circle cx="5" cy="12" r="1.2" fill={color}/><circle cx="12" cy="12" r="1.2" fill={color}/><circle cx="19" cy="12" r="1.2" fill={color}/></g>,
    filter: <g {...p}><path d="M3.5 5.5h17l-6.5 8v5l-4 2v-7z"/></g>,
    message: <g {...p}><path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z"/></g>,
    upload: <g {...p}><path d="M12 15V7M8.5 10.5l3.5-3.5 3.5 3.5"/><path d="M20 15.5v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/></g>,
    fileDoc: <g {...p}><path d="M5 3.5h10l4 4V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M15 3.5V7.5H19M8 11h8M8 15h5"/></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={style}>{paths[name]}</svg>;
}

export function Avatar({ name = '', size = 32, src, style = {} }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: src ? `center/cover url(${src})` : 'var(--steel-tint)',
      color: 'var(--steel)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: size * 0.4,
      border: '1px solid var(--hairline)', letterSpacing: '0.02em', ...style,
    }}>{!src && initials}</div>
  );
}

export function PaymentPill({ status, size = 'md' }) {
  const map = {
    paid:     ['Paid',     'var(--success)', 'var(--success-tint)'],
    due:      ['Due',      'var(--warning)', 'var(--warning-tint)'],
    overdue:  ['Overdue',  'var(--danger)',  'var(--danger-tint)'],
    refunded: ['Refunded', 'var(--muted)',   'transparent'],
  };
  const [label, fg, bg] = map[status] || map.due;
  const pad = size === 'sm' ? '2px 8px' : '3px 10px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span className="r-tabular" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad,
      borderRadius: 'var(--r-pill)', background: bg, color: fg,
      border: status === 'refunded' ? '1px solid var(--hairline)' : 'none',
      fontFamily: 'var(--font-ui)', fontSize: fs, fontWeight: 600,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: fg }} />
      {label}
    </span>
  );
}

export function VisaBadge({ status, label }) {
  const map = {
    valid:    ['Valid',         'var(--success)', 'var(--success-tint)'],
    expiring: ['Expiring soon', 'var(--warning)', 'var(--warning-tint)'],
    expired:  ['Expired',       'var(--danger)',  'var(--danger-tint)'],
  };
  const [txt, fg, bg] = map[status] || map.valid;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
      borderRadius: 'var(--r-pill)', background: bg, color: fg,
      fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <Icon name={status === 'valid' ? 'check' : status === 'expired' ? 'x' : 'clock'} size={12} color={fg} strokeWidth={2} />
      {label || txt}
    </span>
  );
}

export function WeaponChip({ type, showLabel = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <WeaponGlyph type={type} size={16} />
      {showLabel && <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>{WEAPON_LABEL[type]}</span>}
    </span>
  );
}
