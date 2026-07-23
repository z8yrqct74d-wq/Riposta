import React, { useRef, useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Path, Circle, Ellipse } from 'react-native-svg';
import { light } from '@riposte/core';
import { Text } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import type { IconName } from '../src/components/Icon';
import { RiposteLogo } from '../src/components/RiposteLogo';
import { useAuth } from '../src/auth/AuthProvider';

type Role = 'athlete' | 'coach';

interface Feature { icon: IconName; color: string; bg: string; label: string; sub: string; }

const ATHLETE_FEATURES: Feature[] = [
  { icon: 'calendar', color: light.brand, bg: light.brandTint, label: 'Book lessons', sub: 'Pick a coach, choose a free slot, and confirm in seconds.' },
  { icon: 'chart', color: light.steel, bg: light.steelTint, label: 'Track your progress', sub: 'Attendance, coach notes, and your training history.' },
  { icon: 'qr', color: light.success, bg: light.successTint, label: 'Check in at the salle', sub: 'Show your QR code at the entrance — no paper needed.' },
];

const COACH_FEATURES: Feature[] = [
  { icon: 'calendar', color: light.brand, bg: light.brandTint, label: 'Run your day', sub: 'See every lesson and session on your schedule at a glance.' },
  { icon: 'users', color: light.steel, bg: light.steelTint, label: 'Mark attendance', sub: 'Track who showed up and tidy lesson notes in seconds.' },
  { icon: 'clock', color: light.success, bg: light.successTint, label: 'Set availability', sub: 'Choose your open slots — athletes book around them.' },
];

const N = 4;

function FencerHero() {
  const w = 'rgba(255,255,255,0.85)';
  return (
    <Svg width={180} height={180} viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Line x1={62} y1={42} x2={90} y2={16} stroke="rgba(255,255,255,0.25)" strokeWidth={1.4} />
      <Path d="M59 45 A5 5 0 0 0 68 37" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} />
      <Line x1={54} y1={50} x2={62} y2={42} stroke="rgba(255,255,255,0.9)" strokeWidth={3} />
      <Circle cx={52} cy={52} r={3} fill="rgba(255,255,255,0.9)" />
      <Circle cx={40} cy={21} r={7.5} stroke={w} strokeWidth={1.6} />
      <Line x1={40} y1={29} x2={40} y2={53} stroke={w} strokeWidth={1.6} />
      <Line x1={40} y1={35} x2={59} y2={46} stroke={w} strokeWidth={1.6} />
      <Line x1={40} y1={35} x2={27} y2={43} stroke="rgba(255,255,255,0.6)" strokeWidth={1.6} />
      <Line x1={40} y1={53} x2={53} y2={70} stroke={w} strokeWidth={1.6} />
      <Line x1={53} y1={70} x2={62} y2={72} stroke={w} strokeWidth={1.6} />
      <Line x1={40} y1={53} x2={27} y2={65} stroke="rgba(255,255,255,0.75)" strokeWidth={1.6} />
      <Line x1={27} y1={65} x2={18} y2={67} stroke="rgba(255,255,255,0.75)" strokeWidth={1.6} />
      <Ellipse cx={40} cy={78} rx={22} ry={3} fill="rgba(0,0,0,0.25)" />
    </Svg>
  );
}

function FeatureRow({ f }: { f: Feature }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: light.surface, borderWidth: 1, borderColor: light.hairline, borderRadius: 16, padding: 15 }}>
      <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={f.icon} size={23} color={f.color} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text color={light.ink} weight="600" size={14.5}>{f.label}</Text>
        <Text color={light.muted} size={12.5} style={{ marginTop: 2, lineHeight: 18 }}>{f.sub}</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const pager = useRef<PagerView>(null);
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>('athlete');
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const { session, signInWithGoogle } = useAuth();

  if (session) return <Redirect href="/" />;

  const isCoach = role === 'coach';
  const isDark = step === 0;
  const isLogin = step === 3;
  const features = isCoach ? COACH_FEATURES : ATHLETE_FEATURES;

  const go = (s: number) => { const n = Math.max(0, Math.min(N - 1, s)); setStep(n); pager.current?.setPage(n); };

  const signIn = async () => {
    setSigningIn(true);
    setSignInError(null);
    try {
      await signInWithGoogle(role);
    } catch {
      setSignInError("Sign-in didn't complete — please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  const panel = { width, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 170 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: light.paper }}>
      <PagerView
        ref={pager}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setStep(e.nativeEvent.position)}
      >
        {/* 1 · Welcome */}
        <View key="welcome" style={{ width }}>
          <LinearGradient colors={['#1C2A44', '#0D1B2F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 170 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
                <RiposteLogo size={26} color="#fff" />
                <View>
                  <Text color="#fff" weight="600" size={17}>Riposte</Text>
                  <Text color="rgba(255,255,255,0.45)" size={11}>CS Riposta</Text>
                </View>
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <FencerHero />
              </View>
              <View>
                <Text variant="display" size={36} color="#fff" style={{ lineHeight: 40 }}>Your training, your way.</Text>
                <Text size={15} color="rgba(255,255,255,0.55)" style={{ marginTop: 12, lineHeight: 24 }}>
                  Book lessons, track progress, and check in — all from your phone.
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* 2 · Role */}
        <View key="role" style={panel}>
          <Text weight="700" size={12} color={light.brand} style={{ letterSpacing: 1, marginTop: 8 }}>WHO ARE YOU?</Text>
          <Text variant="display" size={32} color={light.ink} style={{ marginTop: 8, marginBottom: 24 }}>Choose your role.</Text>
          <View style={{ gap: 12 }}>
            {([
              { id: 'athlete', icon: 'user', color: light.brand, bg: light.brandTint, label: "I'm an athlete", sub: 'Book lessons, track progress, and check in.' },
              { id: 'coach', icon: 'users', color: light.steel, bg: light.steelTint, label: "I'm a coach", sub: 'Manage your schedule, sessions, and roster.' },
            ] as const).map((r) => {
              const on = role === r.id;
              return (
                <Pressable key={r.id} onPress={() => setRole(r.id)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: light.surface, borderWidth: on ? 2 : 1, borderColor: on ? light.brand : light.hairline, borderRadius: 16, padding: on ? 13 : 14 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={r.icon} size={23} color={r.color} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text color={light.ink} weight="600" size={14.5}>{r.label}</Text>
                    <Text color={light.muted} size={12.5} style={{ marginTop: 2, lineHeight: 18 }}>{r.sub}</Text>
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 0 : 2, borderColor: light.hairline, backgroundColor: on ? light.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3 · Features */}
        <View key="features" style={panel}>
          <Text weight="700" size={12} color={light.brand} style={{ letterSpacing: 1, marginTop: 8 }}>WHAT'S INSIDE</Text>
          <Text variant="display" size={32} color={light.ink} style={{ marginTop: 8, marginBottom: 24 }}>Everything you need.</Text>
          <View style={{ gap: 12 }}>
            {features.map((f) => <FeatureRow key={f.label} f={f} />)}
          </View>
        </View>

        {/* 4 · Login */}
        <View key="login" style={panel}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <RiposteLogo size={26} />
            <Text color={light.ink} weight="600" size={17}>Riposte</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: light.brandTint, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 24 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: light.brand }} />
              <Text color={light.brand} weight="600" size={12}>CS Riposta · sportriposta.ro</Text>
            </View>
            <Text variant="display" size={36} color={light.ink} style={{ lineHeight: 40 }}>Let's get started.</Text>
            <Text size={15} color={light.muted} style={{ marginTop: 12, lineHeight: 24, maxWidth: 280 }}>
              {isCoach
                ? 'Sign in to manage your schedule, mark attendance, and set your availability.'
                : 'Sign in to save your bookings, track your progress, and check in at the salle.'}
            </Text>
          </View>
        </View>
      </PagerView>

      {/* Bottom nav */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {Array.from({ length: N }).map((_, i) => (
            <View key={i} style={{ height: 5, borderRadius: 3, width: i === step ? 22 : 5, backgroundColor: isDark ? '#fff' : light.brand, opacity: i === step ? 1 : 0.22 }} />
          ))}
        </View>
        {signInError && isLogin && (
          <Text color="#E2616C" size={12.5} style={{ textAlign: 'center', marginBottom: 10 }}>{signInError}</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {step === 0 ? (
            <Pressable onPress={() => go(3)} style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }}>
              <Text color="rgba(255,255,255,0.65)" size={15} weight="500">Skip</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => go(step - 1)} style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: light.surface, borderWidth: 1, borderColor: light.hairline, alignItems: 'center' }}>
              <Text color={light.ink} size={15} weight="600">Back</Text>
            </Pressable>
          )}
          {isLogin ? (
            <Pressable onPress={signIn} disabled={signingIn} style={{ flex: 2, padding: 14, borderRadius: 8, backgroundColor: light.brand, alignItems: 'center', justifyContent: 'center', opacity: signingIn ? 0.75 : 1 }}>
              <Text color="#fff" size={15} weight="600">{signingIn ? 'Redirecting…' : 'Continue with Google'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => go(step + 1)} style={{ flex: 2, padding: 14, borderRadius: 8, backgroundColor: isDark ? '#fff' : light.brand, alignItems: 'center' }}>
              <Text color={isDark ? '#1C2A44' : '#fff'} size={15} weight="600">Continue</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
