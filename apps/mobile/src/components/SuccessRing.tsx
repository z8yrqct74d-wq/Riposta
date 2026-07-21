import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withDelay, withTiming } from 'react-native-reanimated';
import { Icon } from './Icon';
import { useTheme } from '../theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Animated success ring: the accent circle draws itself via Reanimated
// useAnimatedProps on a react-native-svg Circle (stroke-dash), matching the
// web SuccessRing.
export function SuccessRing({ size = 96 }: { size?: number }) {
  const t = useTheme();
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = useSharedValue(c);
  useEffect(() => { offset.value = withDelay(120, withTiming(0, { duration: 360 })); }, []);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }], position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.colors.successTint} strokeWidth={4} />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.colors.success} strokeWidth={4} strokeLinecap="round" strokeDasharray={c} animatedProps={animatedProps} />
      </Svg>
      <Icon name="check" size={size * 0.42} color={t.colors.success} strokeWidth={2.4} />
    </View>
  );
}
