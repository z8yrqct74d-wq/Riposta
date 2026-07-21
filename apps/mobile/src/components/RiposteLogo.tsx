import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// The Riposte mark — crossed blades in a ring. Matches the web AdminApp logo.
export function RiposteLogo({ size = 34, color = '#1C2A44' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill="none" stroke={color} strokeWidth={1.5} />
      <Path d="M7 17 L17 7" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 17 L15 7" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.45} />
      <Circle cx={7} cy={17} r={1.4} fill={color} />
    </Svg>
  );
}
