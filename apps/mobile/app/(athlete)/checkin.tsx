import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Text } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { SuccessRing } from '../../src/components/SuccessRing';
import { db } from '../../src/lib/supabase';
import { useAthlete } from '../../src/athlete/AthleteData';

// Dark full-screen check-in. The QR encodes the member id (for a coach/admin
// scanner at the door); "Check in now" writes a real check_ins record.
export default function CheckinScreen() {
  const router = useRouter();
  const { member } = useAthlete();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    db.getSettings().then((s) => { if (s?.club_name) setClubName(s.club_name); }).catch(() => {});
  }, []);

  const qrValue = `RIPOSTE:${member?.id || 'GUEST'}`;
  const displayName = member?.name || 'Guest';
  const shortCode = member?.id ? `${displayName.split(' ')[0].toUpperCase()}·${member.id.slice(0, 6).toUpperCase()}` : '—';

  const checkIn = async () => {
    if (!member?.id || checkingIn || checkedIn) return;
    setCheckingIn(true);
    setError(null);
    try {
      await db.recordCheckIn(member.id);
      setCheckedAt(new Date());
      setCheckedIn(true);
    } catch {
      setError("Couldn't check you in — please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C2A44' }}>
      <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 16, right: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Icon name="x" size={18} color="#fff" />
      </Pressable>

      <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
        {clubName ? <Text variant="display" size={20} color="#EEE8D8">{clubName}</Text> : null}
        <Text size={12} color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>Show this at the door</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {!checkedIn ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 22, alignItems: 'center' }}>
            <QRCode value={qrValue} size={200} />
            <Text variant="mono" size={13} color="#17150F" style={{ marginTop: 14, letterSpacing: 1 }}>{shortCode}</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <SuccessRing size={120} />
            <Text variant="display" size={28} color="#EEE8D8" style={{ marginTop: 22 }}>{displayName}</Text>
            <Text size={14} color="#34A06A" style={{ marginTop: 4 }}>
              Checked in · {(checkedAt ?? new Date()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>

      {!checkedIn && (
        <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
          {error && <Text size={12.5} color="#E2616C" style={{ marginBottom: 10 }}>{error}</Text>}
          <Pressable onPress={checkIn} disabled={checkingIn || !member?.id} style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28, opacity: checkingIn || !member?.id ? 0.6 : 1 }}>
            <Text size={14} weight="600" color="#fff">{checkingIn ? 'Checking in…' : 'Check in now'}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
