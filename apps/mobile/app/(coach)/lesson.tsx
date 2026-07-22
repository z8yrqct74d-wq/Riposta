import React, { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { MotiText } from 'moti';
import { useTheme } from '../../src/theme/theme';
import { Text, Avatar, Button } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { CoachHeader } from '../../src/coach/CoachHeader';
import { db } from '../../src/lib/supabase';
import { useCoach } from '../../src/coach/CoachData';
import { WEAPON_LABEL } from '@riposte/core';

const TIDIED = [
  ['Focus', 'Distance control in the lunge.'],
  ['Improved', 'Holding distance before committing; back foot stays loaded.'],
  ['Homework', 'Shadow footwork, 10 min, ×3 this week.'],
];

export default function LessonView() {
  const t = useTheme();
  const { selected: item, coach } = useCoach();
  const weapon = item?.weapon || 'foil';
  const memberName = item?.memberName || item?.title || 'Athlete';
  const [credits, setCredits] = useState(item?.memberCredits ?? 0);
  const [done, setDone] = useState(false);
  const [showMinus, setShowMinus] = useState(false);
  const [note, setNote] = useState('');
  const [tidying, setTidying] = useState(false);
  const [tidied, setTidied] = useState(false);

  const sub = item ? `${item.t}${item.piste ? ` · Piste ${item.piste}` : ''} · ${item.durMin} min` : '';

  const markDone = () => {
    setDone(true);
    setShowMinus(true);
    setTimeout(() => setCredits((c) => Math.max(0, c - 1)), 360);
    if (item?.memberId) db.updateMemberCredits(item.memberId, Math.max(0, (item.memberCredits ?? 1) - 1)).catch(() => {});
    if (item?.bookingId) db.updateBookingAttendance(item.bookingId, 'present').catch(() => {});
  };

  const tidy = () => {
    if (!note.trim()) return;
    setTidying(true);
    if (item?.memberId && coach?.id) db.saveNote({ member_id: item.memberId, coach_id: coach.id, raw_note: note }).catch(() => {});
    setTimeout(() => { setTidying(false); setTidied(true); }, 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <CoachHeader title={memberName} sub={sub} weapon={weapon} live={item?.live} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar name={memberName} size={40} />
            <View>
              <Text weight="600" size={14}>Individual lesson</Text>
              <Text color={t.colors.muted} size={12} style={{ marginTop: 1 }}>{WEAPON_LABEL[weapon]}{item?.memberCat ? ` · ${item.memberCat}` : ''}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {showMinus && <MotiText from={{ opacity: 1, translateY: 0 }} animate={{ opacity: 0, translateY: -22 }} transition={{ duration: 480 }} style={{ position: 'absolute', top: -14, color: t.colors.brand, fontSize: 13, fontWeight: '600' }}>−1</MotiText>}
            <Text variant="mono" size={20} weight="600">{credits}</Text>
            <Text size={10.5} color={t.colors.faint}>credits left</Text>
          </View>
        </View>

        {!done ? (
          <Button label="Mark done · use 1 credit" onPress={markDone} style={{ marginBottom: 16 }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: t.radius.btn, backgroundColor: t.colors.successTint, marginBottom: 16 }}>
            <Icon name="check" size={16} color={t.colors.success} strokeWidth={2.2} />
            <Text color={t.colors.success} size={13.5} weight="600">Lesson completed · 1 credit deducted</Text>
          </View>
        )}

        <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8 }}>Lesson note</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Quick free-text — what you worked on, how it went…" placeholderTextColor={t.colors.faint} multiline style={{ minHeight: 90, padding: 13, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.hairline, backgroundColor: t.colors.surface, color: t.colors.ink, fontSize: 14, textAlignVertical: 'top' }} />
        <Button label={tidying ? 'Tidying…' : tidied ? 'Re-tidy' : 'Save & tidy with AI'} variant="secondary" onPress={tidy} disabled={!note.trim() || tidying} style={{ marginTop: 10 }} />

        {tidied && !tidying && (
          <View style={{ marginTop: 14, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="sparkle" size={14} color={t.colors.steel} />
              <Text size={11} weight="600" color={t.colors.steel} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>Tidied summary</Text>
            </View>
            {TIDIED.map(([k, v], i) => (
              <View key={k} style={{ flexDirection: 'row', gap: 10, paddingVertical: 7, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: t.colors.hairline }}>
                <Text size={11.5} weight="600" color={t.colors.steel} style={{ width: 72, textTransform: 'uppercase' }}>{k}</Text>
                <Text size={13.5} style={{ flex: 1, lineHeight: 20 }}>{v}</Text>
              </View>
            ))}
            <Text size={11} color={t.colors.faint} style={{ marginTop: 10, fontStyle: 'italic' }}>Athlete sees this in their Progress tab.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
