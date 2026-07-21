import React from 'react';
import {
  Text as RNText,
  View,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import type { TextProps as RNTextProps, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import type { Tone } from '@riposte/core';

const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// ── Text ─────────────────────────────────────────────────────
type TextVariant = 'display' | 'body' | 'mono' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
}

export function Text({ variant = 'body', size, color, weight, style, ...rest }: TextProps) {
  const t = useTheme();
  const base: TextStyle = { color: color ?? t.colors.ink };
  const byVariant: Record<TextVariant, TextStyle> = {
    display: { fontSize: size ?? 22, fontWeight: weight ?? '600', letterSpacing: -0.3 },
    body: { fontSize: size ?? 14, fontWeight: weight ?? '400' },
    mono: { fontSize: size ?? 13, fontWeight: weight ?? '500', fontFamily: monoFamily, fontVariant: ['tabular-nums'] },
    label: { fontSize: size ?? 12, fontWeight: weight ?? '600', letterSpacing: 0.4, textTransform: 'uppercase', color: color ?? t.colors.faint },
  };
  return <RNText {...rest} style={[base, byVariant[variant], style]} />;
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: t.space.s4 }, style]}>
      {children}
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.colors.brand : variant === 'secondary' ? t.colors.surface : 'transparent';
  const fg = variant === 'primary' ? '#fff' : t.colors.ink;
  const border = variant === 'secondary' ? t.colors.hairline : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          borderColor: border,
          borderRadius: t.radius.btn,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text color={fg} weight="600" size={14}>{label}</Text>}
    </Pressable>
  );
}

// ── Pill ─────────────────────────────────────────────────────
export function Pill({ label, tone = 'muted' }: { label: string; tone?: Tone }) {
  const t = useTheme();
  const map: Record<Tone, [string, string]> = {
    success: [t.colors.success, t.colors.successTint],
    warning: [t.colors.warning, t.colors.warningTint],
    danger: [t.colors.danger, t.colors.dangerTint],
    steel: [t.colors.steel, t.colors.steelTint],
    brand: [t.colors.brand, t.colors.brandTint],
    muted: [t.colors.muted, t.colors.hairline],
  };
  const [fg, bg] = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: bg, borderRadius: t.radius.pill, paddingVertical: 3, paddingHorizontal: 10 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: fg, marginRight: 5 }} />
      <Text color={fg} weight="600" size={12}>{label}</Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────
interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scroll = false, padded = true, style }: ScreenProps) {
  const t = useTheme();
  const pad = padded ? { padding: t.space.s4 } : null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, style]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// ── Sheet ────────────────────────────────────────────────────
// Basic bottom sheet primitive. Phase 3 upgrades the athlete flows to
// @gorhom/bottom-sheet; this covers simple confirm/option sheets meanwhile.
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Sheet({ visible, onClose, children, title }: SheetProps) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} />
      <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: t.radius.card, borderTopRightRadius: t.radius.card, padding: t.space.s6, paddingBottom: t.space.s12 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.hairline, marginBottom: t.space.s4 }} />
        {title && <Text variant="display" size={20} style={{ marginBottom: t.space.s4 }}>{title}</Text>}
        {children}
      </View>
    </Modal>
  );
}
