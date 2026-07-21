import React from 'react';
import Svg, { G, Path, Rect, Circle } from 'react-native-svg';

export type IconName =
  | 'calendar' | 'clock' | 'check' | 'x' | 'plus' | 'minus' | 'chevR' | 'chevL' | 'chevD'
  | 'arrowL' | 'search' | 'bell' | 'user' | 'users' | 'card' | 'home' | 'grid' | 'chart'
  | 'qr' | 'sparkle' | 'settings' | 'pin' | 'note' | 'money' | 'refresh' | 'cloudOff'
  | 'lock' | 'dots' | 'filter' | 'message' | 'upload' | 'fileDoc' | 'alertCircle'
  | 'camera' | 'image';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Stroke-based icon set, ported 1:1 from the web app's Shared.jsx.
export function Icon({ name, size = 18, color = '#1C2A44', strokeWidth = 1.5 }: IconProps) {
  const s = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const paths: Record<IconName, React.ReactNode> = {
    calendar: <G {...s}><Rect x={3} y={4.5} width={18} height={16} rx={2} /><Path d="M3 9h18M8 2.5v4M16 2.5v4" /></G>,
    clock: <G {...s}><Circle cx={12} cy={12} r={8.5} /><Path d="M12 7.5V12l3 2" /></G>,
    check: <G {...s}><Path d="M4.5 12.5l5 5 10-11" /></G>,
    x: <G {...s}><Path d="M6 6l12 12M18 6L6 18" /></G>,
    plus: <G {...s}><Path d="M12 5v14M5 12h14" /></G>,
    minus: <G {...s}><Path d="M5 12h14" /></G>,
    chevR: <G {...s}><Path d="M9 5l7 7-7 7" /></G>,
    chevL: <G {...s}><Path d="M15 5l-7 7 7 7" /></G>,
    chevD: <G {...s}><Path d="M5 9l7 7 7-7" /></G>,
    arrowL: <G {...s}><Path d="M19 12H5M11 6l-6 6 6 6" /></G>,
    search: <G {...s}><Circle cx={11} cy={11} r={7} /><Path d="M21 21l-4.3-4.3" /></G>,
    bell: <G {...s}><Path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z" /><Path d="M10.3 20a2 2 0 0 0 3.4 0" /></G>,
    user: <G {...s}><Circle cx={12} cy={8.5} r={3.8} /><Path d="M5 20a7 7 0 0 1 14 0" /></G>,
    users: <G {...s}><Circle cx={9} cy={8.5} r={3.3} /><Path d="M3 19a6 6 0 0 1 12 0" /><Path d="M16 5.5a3.3 3.3 0 0 1 0 6.4M21 19a6 6 0 0 0-4-5.6" /></G>,
    card: <G {...s}><Rect x={2.5} y={5} width={19} height={14} rx={2.5} /><Path d="M2.5 9.5h19" /></G>,
    home: <G {...s}><Path d="M4 11l8-6.5 8 6.5" /><Path d="M6 9.5V20h12V9.5" /></G>,
    grid: <G {...s}><Rect x={3.5} y={3.5} width={7} height={7} rx={1.5} /><Rect x={13.5} y={3.5} width={7} height={7} rx={1.5} /><Rect x={3.5} y={13.5} width={7} height={7} rx={1.5} /><Rect x={13.5} y={13.5} width={7} height={7} rx={1.5} /></G>,
    chart: <G {...s}><Path d="M4 20V4M4 20h16" /><Rect x={7.5} y={12} width={3} height={5} /><Rect x={13} y={8.5} width={3} height={8.5} /><Rect x={18.5} y={14.5} width={0.1} height={2.5} /></G>,
    qr: <G {...s}><Rect x={3.5} y={3.5} width={6} height={6} rx={1} /><Rect x={14.5} y={3.5} width={6} height={6} rx={1} /><Rect x={3.5} y={14.5} width={6} height={6} rx={1} /><Path d="M14.5 14.5h3v3M20.5 14.5v6h-6" /></G>,
    sparkle: <G {...s}><Path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" /></G>,
    settings: <G {...s}><Circle cx={12} cy={12} r={3} /><Path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3" /></G>,
    pin: <G {...s}><Path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" /><Circle cx={12} cy={10} r={2.5} /></G>,
    note: <G {...s}><Path d="M5 3.5h11l3 3V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" /><Path d="M8 10h8M8 14h6" /></G>,
    money: <G {...s}><Circle cx={12} cy={12} r={8.5} /><Path d="M12 7v10M14.5 9.2c0-1-1.1-1.7-2.5-1.7s-2.5.8-2.5 1.9 1 1.6 2.5 1.9 2.6.9 2.6 2-1.2 1.9-2.6 1.9-2.6-.7-2.6-1.7" /></G>,
    refresh: <G {...s}><Path d="M20 11a8 8 0 0 0-14-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 4.5L20 16M20 20v-4h-4" /></G>,
    cloudOff: <G {...s}><Path d="M3 3l18 18M7 8a5 5 0 0 0 .5 9.5H17M17.5 16.5A4 4 0 0 0 17 9h-1.3A6 6 0 0 0 9 5.5" /></G>,
    lock: <G {...s}><Rect x={4.5} y={10.5} width={15} height={10} rx={2} /><Path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></G>,
    dots: <G><Circle cx={5} cy={12} r={1.2} fill={color} /><Circle cx={12} cy={12} r={1.2} fill={color} /><Circle cx={19} cy={12} r={1.2} fill={color} /></G>,
    filter: <G {...s}><Path d="M3.5 5.5h17l-6.5 8v5l-4 2v-7z" /></G>,
    message: <G {...s}><Path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" /></G>,
    upload: <G {...s}><Path d="M12 15V7M8.5 10.5l3.5-3.5 3.5 3.5" /><Path d="M20 15.5v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" /></G>,
    fileDoc: <G {...s}><Path d="M5 3.5h10l4 4V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" /><Path d="M15 3.5V7.5H19M8 11h8M8 15h5" /></G>,
    alertCircle: <G {...s}><Circle cx={12} cy={12} r={8.5} /><Path d="M12 8v4.5M12 15.5v.5" /></G>,
    camera: <G {...s}><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx={12} cy={13} r={4} /></G>,
    image: <G {...s}><Rect x={3} y={3} width={18} height={18} rx={2} /><Path d="M3 15.5l5-5 4 4 3-3 5 5" /><Circle cx={8.5} cy={8.5} r={1.5} /></G>,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths[name]}
    </Svg>
  );
}
