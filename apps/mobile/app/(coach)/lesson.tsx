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

export default function LessonView() {
  const t = useTheme();
  const { selected: item, coach } = useCoach();
  const weapon = item?.weapon || 'foil';
  const memberName = item?.memberName || item?.title || 'Athlete';
  const [credits, setCredits] = useState(item?.memberCredits ?? 0);
  const [done, setDone] = useState(false);
  const [showMinus, setShowMinus] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [focus, setFocus] = useState('');
  const [improved, setImproved] = useState('');
  const [homework, setHomework] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [creditCost, setCreditCost] = useState(1);

  React.useEffect(() => {
    db.getSettings().then((s) => { if (s?.credit_cost_per_lesson != null) setCreditCost(s.credit_cost_per_lesson); }).catch(() => {});
  }, []);

  const sub = item ? `${item.t}${item.piste ? ` · Piste ${item.piste}` : ''} · ${item.durMin} min` : '';

  const markDone = async () => {
    if (done || marking || !item?.memberId) return; // guard against double-tap
    setMarking(true);
    setMarkError(null);
    try {
      // Read the member's current balance fresh rather than trusting the
      // memberCredits snapshot captured whenever MyDay last loaded — that
      // snapshot can be stale (a top-up or another lesson since then).
      const fresh = await db.getMember(item.memberId);
      const nextCredits = Math.max(0, (fresh?.credits ?? item.memberCredits ?? creditCost) - creditCost);
      await db.updateMemberCredits(item.memberId, nextCredits);
      if (item.bookingId) await db.updateBookingAttendance(item.bookingId, 'present');
      setDone(true);
      setShowMinus(true);
      setTimeout(() => setCredits(nextCredits), 360);
    } catch {
      setMarkError("Couldn't save — check your connection and try again.");
    } finally {
      setMarking(false);
    }
  };

  const saveNote = async () => {
    if (!item?.memberId || !coach?.id) return;
    if (!focus.trim() && !improved.trim() && !homework.trim()) return;
    setSaving(true);
    setNoteError(null);
    try {
      await db.saveNote({
        member_id: item.memberId,
        coach_id: coach.id,
        tidied_focus: focus.trim() || null,
        tidied_improved: improved.trim() || null,
        tidied_homework: homework.trim() || null,
      });
      setSaved(true);
    } catch {
      setNoteError("Couldn't save the note — check your connection and try again.");
    } finally {
      setSaving(false);
    }
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
          <>
            {markError && <Text color={t.colors.danger} size={12.5} style={{ marginBottom: 8 }}>{markError}</Text>}
            <Button label={marking ? 'Saving…' : `Mark done · use ${creditCost} credit${creditCost === 1 ? '' : 's'}`} onPress={markDone} disabled={marking} style={{ marginBottom: 16 }} />
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: t.radius.btn, backgroundColor: t.colors.successTint, marginBottom: 16 }}>
            <Icon name="check" size={16} color={t.colors.success} strokeWidth={2.2} />
            <Text color={t.colors.success} size={13.5} weight="600">Lesson completed · {creditCost} credit{creditCost === 1 ? '' : 's'} deducted</Text>
          </View>
        )}

        <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8 }}>Lesson note</Text>
        {([
          { label: 'Focus', value: focus, set: setFocus, placeholder: 'What you worked on this lesson…' },
          { label: 'Improved', value: improved, set: setImproved, placeholder: 'What went well / progress made…' },
          { label: 'Homework', value: homework, set: setHomework, placeholder: 'What to practise before next time…' },
        ] as const).map((f) => (
          <View key={f.label} style={{ marginBottom: 10 }}>
            <Text size={11.5} weight="600" color={t.colors.steel} style={{ textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>{f.label}</Text>
            <TextInput
              value={f.value}
              onChangeText={(v) => { f.set(v); if (saved) setSaved(false); }}
              placeholder={f.placeholder}
              placeholderTextColor={t.colors.faint}
              multiline
              style={{ minHeight: 56, padding: 12, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.hairline, backgroundColor: t.colors.surface, color: t.colors.ink, fontSize: 14, textAlignVertical: 'top' }}
            />
          </View>
        ))}
        {noteError && <Text color={t.colors.danger} size={12.5} style={{ marginBottom: 8 }}>{noteError}</Text>}
        <Button
          label={saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save note'}
          variant="secondary"
          onPress={saveNote}
          disabled={saving || saved || (!focus.trim() && !improved.trim() && !homework.trim())}
          style={{ marginTop: 4 }}
        />
        <Text size={11} color={t.colors.faint} style={{ marginTop: 10, fontStyle: 'italic' }}>The athlete sees this in their Progress tab.</Text>
      </ScrollView>
    </View>
  );
}
