import React from 'react';
import Svg, { G, Line, Circle, Path } from 'react-native-svg';
import type { Weapon } from '@riposte/core';

interface Props {
  type?: Weapon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Ported 1:1 from the web app's Shared.jsx WeaponGlyph.
export function WeaponGlyph({ type = 'foil', size = 20, color = '#4A6080', strokeWidth }: Props) {
  const sw = strokeWidth ?? 1.5;
  const common = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let body: React.ReactNode;
  if (type === 'foil') {
    body = (
      <G {...common}>
        <Line x1={7.5} y1={16.5} x2={20} y2={4} />
        <Circle cx={7.5} cy={16.5} r={1.7} />
        <Line x1={6.3} y1={17.7} x2={4} y2={20} />
        <Circle cx={3.4} cy={20.6} r={0.9} fill={color} stroke="none" />
      </G>
    );
  } else if (type === 'epee') {
    body = (
      <G {...common}>
        <Line x1={8} y1={16} x2={20} y2={4} strokeWidth={sw + 0.5} />
        <Line x1={10.3} y1={13.7} x2={13.6} y2={9.2} strokeWidth={sw - 0.7} opacity={0.55} />
        <Path d="M5.4 18.6 A3.4 3.4 0 0 1 9.4 14.6" />
        <Line x1={6.6} y1={17.4} x2={4} y2={20} />
        <Circle cx={3.4} cy={20.6} r={0.95} fill={color} stroke="none" />
      </G>
    );
  } else {
    body = (
      <G {...common}>
        <Path d="M7.8 16.2 C 12 12, 16 7.5, 20 4.2" />
        <Path d="M6.4 17.6 C 2.7 17.4, 2.4 20, 4 20.6" />
        <Line x1={6.6} y1={17.4} x2={4.4} y2={19.6} />
        <Circle cx={3.9} cy={20.2} r={0.9} fill={color} stroke="none" />
      </G>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
