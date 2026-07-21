import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Text } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { SuccessRing } from '../../src/components/SuccessRing';
import { useAthlete } from '../../src/athlete/AthleteData';

// Dark full-screen check-in. QR encodes the member id; a "simulate scan"
// button flips to the checked-in confirmation.
export default function CheckinScreen() {
  const router = useRouter();
  const { member } = useAthlete();
  const [scanned, setScanned] = useState(false);

  const qrValue = `RIPOSTE:${member?.id || 'GUEST'}`;
  const displayName = member?.name || 'Guest';
  const shortCode = member?.id ? `${displayName.split(' ')[0].toUpperCase()}·${member.id.slice(0, 6).toUpperCase()}` : 'GUEST·DEMO';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C2A44' }}>
      <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 16, right: 18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Icon name="x" size={18} color="#fff" />
      </Pressable>

      <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
        <Text variant="display" size={20} color="#EEE8D8">Salle d'Armes</Text>
        <Text size={12} color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>Show this at the door</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {!scanned ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 22, alignItems: 'center' }}>
            <QRCode value={qrValue} size={200} />
            <Text variant="mono" size={13} color="#17150F" style={{ marginTop: 14, letterSpacing: 1 }}>{shortCode}</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <SuccessRing size={120} />
            <Text variant="display" size={28} color="#EEE8D8" style={{ marginTop: 22 }}>{displayName}</Text>
            <Text size={14} color="#34A06A" style={{ marginTop: 4 }}>
              Checked in · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>

      <Pressable onPress={() => setScanned((s) => !s)} style={{ position: 'absolute', bottom: 40, alignSelf: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 }}>
        <Text size={12.5} color="rgba(255,255,255,0.5)">{scanned ? 'Reset demo' : 'Simulate scan'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
