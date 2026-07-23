import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WEAPON_LABEL, VISA_STATUS, isoDate } from '@riposte/core';
import type { Weapon, VisaStatus, Member, EmergencyContact } from '@riposte/core';
import { useTheme } from '../../src/theme/theme';
import { Text, Avatar, Sheet, Button } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import type { IconName } from '../../src/components/Icon';
import { WeaponGlyph } from '../../src/components/WeaponGlyph';
import { supabase, db } from '../../src/lib/supabase';
import { useAuth } from '../../src/auth/AuthProvider';
import { useAthlete } from '../../src/athlete/AthleteData';

const WEAPON_OPTIONS: Weapon[] = ['foil', 'epee', 'sabre'];
const CATEGORY_OPTIONS = ['U9', 'U11', 'U14', 'U17', 'U20', 'Senior', 'Veteran', 'Amateur'];
const NOTIF_ITEMS: { key: string; label: string }[] = [
  { key: 'lessonReminders', label: 'Lesson reminders' },
  { key: 'bookingConfirmations', label: 'Booking confirmations' },
  { key: 'cancellations', label: 'Cancellations' },
  { key: 'coachNotes', label: 'Coach notes' },
  { key: 'announcements', label: 'Club announcements' },
];
const formatDocDate = (d?: string | null) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

function getDocStatus(url?: string | null, expiryDate?: string | null): VisaStatus {
  if (!url && !expiryDate) return 'pending';
  if (!expiryDate) return 'pending';
  const exp = new Date(expiryDate);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  return exp < now ? 'expired' : exp < soon ? 'expiring' : 'valid';
}

function VisaBadge({ status }: { status: VisaStatus }) {
  const t = useTheme();
  const info = VISA_STATUS[status];
  const toneColor: Record<string, string> = { success: t.colors.success, warning: t.colors.warning, danger: t.colors.danger };
  const fg = toneColor[info.tone] || t.colors.muted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: fg, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 }}>
      <Icon name={info.icon as IconName} size={12} color={fg} strokeWidth={2} />
      <Text color={fg} size={12} weight="600">{info.label}</Text>
    </View>
  );
}

function ProfileRow({ icon, label, value, accent, onTap, last }: { icon?: IconName; label: string; value?: React.ReactNode; accent?: string; onTap?: () => void; last?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onTap} disabled={!onTap} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.hairline }}>
      {icon && <Icon name={icon} size={17} color={t.colors.faint} />}
      <Text style={{ flex: 1 }} color={t.colors.muted} size={14}>{label}</Text>
      {typeof value === 'string' ? <Text color={accent || t.colors.ink} size={14} weight={accent ? '600' : '400'}>{value}</Text> : value}
      {onTap && <Icon name="chevR" size={16} color={t.colors.faint} />}
    </Pressable>
  );
}

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <Text variant="label" color={t.colors.faint} style={{ marginBottom: 8, marginLeft: 2 }}>{title}</Text>
      <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: highlight ? t.colors.warning : t.colors.hairline, borderRadius: t.radius.card, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function OptionSheet({ title, options, value, onSelect, onClose }: { title: string; options: { value: string; label: string; glyph?: Weapon }[]; value?: string | null; onSelect: (v: string) => void; onClose: () => void }) {
  const t = useTheme();
  return (
    <Sheet visible onClose={onClose} title={title}>
      <View style={{ gap: 6 }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <Pressable key={o.value} onPress={() => { onSelect(o.value); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: t.radius.btn, backgroundColor: on ? t.colors.brandTint : 'transparent' }}>
              {o.glyph && <WeaponGlyph type={o.glyph} size={18} color={t.colors.steel} />}
              <Text style={{ flex: 1 }} color={on ? t.colors.brand : t.colors.ink} weight={on ? '600' : '400'} size={15}>{o.label}</Text>
              {on && <Icon name="check" size={18} color={t.colors.brand} strokeWidth={2.4} />}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

function DateSheet({ initial, onSave, onClose, mode = 'past' }: { initial?: string | null; onSave: (v: string) => void; onClose: () => void; mode?: 'past' | 'future' }) {
  const t = useTheme();
  const [date, setDate] = useState<Date>(initial ? new Date(initial + 'T12:00:00') : new Date(2005, 0, 1));
  return (
    <Sheet visible onClose={onClose} title="Select date">
      <DateTimePicker
        value={date}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        maximumDate={mode === 'past' ? new Date() : undefined}
        minimumDate={mode === 'future' ? new Date() : undefined}
        onChange={(_e, d) => d && setDate(d)}
      />
      <Button label="Save" onPress={() => { onSave(isoDate(date)); onClose(); }} style={{ marginTop: 12 }} />
    </Sheet>
  );
}

function DocumentSheet({ type, member, memberId, onClose, onSaved }: { type: 'medical' | 'federation'; member: Member | null; memberId: string; onClose: () => void; onSaved: () => void }) {
  const t = useTheme();
  const prefix = type === 'medical' ? 'medical_cert' : 'federation_licence';
  const [expiry, setExpiry] = useState<string>((member?.[`${prefix}_expiry_date` as keyof Member] as string) || '');
  const [licence, setLicence] = useState<string>(member?.federation_licence_number || '');
  const [showDate, setShowDate] = useState(false);
  const [pending, setPending] = useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!res.canceled && res.assets[0]) { const a = res.assets[0]; setPending({ uri: a.uri, name: a.name, type: a.mimeType }); }
  };

  const save = async () => {
    setSaving(true);
    try {
      let url = (member?.[`${prefix}_url` as keyof Member] as string) || undefined;
      if (pending) url = await db.uploadMemberDocument(memberId, type, pending);
      await db.updateMemberDocument(memberId, type, { url, expiryDate: expiry || null, licenceNumber: type === 'federation' ? licence : undefined });
      onSaved();
    } catch { setSaving(false); }
  };

  const field = { borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.btn, backgroundColor: t.colors.paper, padding: 11, color: t.colors.ink, fontSize: 14 } as const;

  return (
    <Sheet visible onClose={onClose} title={type === 'medical' ? 'Medical certificate' : 'Federation licence'}>
      <View style={{ gap: 14 }}>
        <Pressable onPress={pick} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.hairline, borderRadius: t.radius.btn }}>
          <Icon name="upload" size={18} color={t.colors.steel} />
          <Text color={t.colors.ink} size={14}>{pending ? pending.name || 'File selected' : 'Upload document (PDF or image)'}</Text>
        </Pressable>
        {type === 'federation' && (
          <View>
            <Text variant="label" color={t.colors.muted} style={{ marginBottom: 6 }}>Licence number</Text>
            <TextInput value={licence} onChangeText={setLicence} placeholder="FIE-ROU-…" placeholderTextColor={t.colors.faint} style={field} />
          </View>
        )}
        <View>
          <Text variant="label" color={t.colors.muted} style={{ marginBottom: 6 }}>Expiry date</Text>
          <Pressable onPress={() => setShowDate(true)} style={field}><Text color={expiry ? t.colors.ink : t.colors.faint} size={14}>{expiry ? formatDocDate(expiry) : 'Select date'}</Text></Pressable>
        </View>
        <Button label={saving ? 'Saving…' : 'Save'} onPress={save} disabled={saving} />
      </View>
      {showDate && <DateSheet initial={expiry} onSave={setExpiry} onClose={() => setShowDate(false)} mode="future" />}
    </Sheet>
  );
}

function NotifSheet({ memberId, initial, onClose }: { memberId: string | null; initial?: Record<string, boolean> | null; onClose: () => void }) {
  const t = useTheme();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => ({ ...Object.fromEntries(NOTIF_ITEMS.map((i) => [i.key, true])), ...(initial || {}) }));
  const toggle = (key: string) => setPrefs((p) => {
    const n = { ...p, [key]: !p[key] };
    if (memberId) db.updateMember(memberId, { notif_prefs: n }).catch(() => {});
    return n;
  });
  return (
    <Sheet visible onClose={onClose} title="Notifications">
      <View>
        {NOTIF_ITEMS.map((i, idx) => {
          const on = prefs[i.key];
          return (
            <View key={i.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: idx < NOTIF_ITEMS.length - 1 ? 1 : 0, borderBottomColor: t.colors.hairline }}>
              <Text style={{ flex: 1 }} size={14.5}>{i.label}</Text>
              <Pressable onPress={() => toggle(i.key)} style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: on ? t.colors.brand : t.colors.hairline, justifyContent: 'center' }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: on ? 21 : 3 }} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}

function EmergencyContacts({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const t = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');

  const load = () => db.getEmergencyContacts(memberId).then(setContacts).catch(() => {});
  useEffect(() => { load(); }, [memberId]);

  const add = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setAddError(null);
    try {
      await db.addEmergencyContact({ member_id: memberId, name: name.trim(), role: role.trim() || null, phone: phone.trim() || null, is_primary: contacts.length === 0 });
      setName(''); setRole(''); setPhone(''); setAdding(false);
      await load();
    } catch {
      setAddError("Couldn't add contact — please try again.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => { await db.deleteEmergencyContact(id); load(); };
  const makePrimary = async (id: string) => { await db.setPrimaryContact(memberId, id); load(); };

  const field = { borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.btn, backgroundColor: t.colors.paper, padding: 11, color: t.colors.ink, fontSize: 14 } as const;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: t.colors.hairline }}>
          <Pressable onPress={onClose} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="chevL" size={20} color={t.colors.muted} />
            <Text color={t.colors.muted} size={14}>Back</Text>
          </Pressable>
          <Text variant="display" size={18} style={{ marginLeft: 12 }}>Emergency contacts</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {contacts.map((c) => (
            <View key={c.id} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text weight="600" size={15}>{c.name}</Text>
                {c.is_primary && <Text size={10.5} weight="600" color={t.colors.brand} style={{ backgroundColor: t.colors.brandTint, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999, overflow: 'hidden' }}>Primary</Text>}
              </View>
              {c.role ? <Text color={t.colors.muted} size={13} style={{ marginTop: 2 }}>{c.role}</Text> : null}
              {c.phone ? <Text variant="mono" color={t.colors.muted} size={13} style={{ marginTop: 2 }}>{c.phone}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                {!c.is_primary && <Pressable onPress={() => makePrimary(c.id)}><Text color={t.colors.brand} size={13} weight="600">Make primary</Text></Pressable>}
                <Pressable onPress={() => remove(c.id)}><Text color={t.colors.danger} size={13} weight="600">Remove</Text></Pressable>
              </View>
            </View>
          ))}
          {adding ? (
            <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.card, padding: 14, gap: 10 }}>
              <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={t.colors.faint} style={field} />
              <TextInput value={role} onChangeText={setRole} placeholder="Relationship (e.g. Parent)" placeholderTextColor={t.colors.faint} style={field} />
              <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={t.colors.faint} keyboardType="phone-pad" style={field} />
              {addError && <Text color={t.colors.danger} size={12.5}>{addError}</Text>}
              <Button label={saving ? 'Adding…' : 'Add contact'} onPress={add} disabled={saving} />
            </View>
          ) : (
            <Pressable onPress={() => setAdding(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.hairline, borderRadius: t.radius.card }}>
              <Icon name="plus" size={16} color={t.colors.muted} />
              <Text color={t.colors.muted} size={13.5} weight="600">Add contact</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const t = useTheme();
  const { session } = useAuth();
  const { member, memberId, loading, error, refresh } = useAthlete();
  const [picker, setPicker] = useState<null | { field: keyof Member; title: string; options: { value: string; label: string; glyph?: Weapon }[] }>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const [docSheet, setDocSheet] = useState<null | 'medical' | 'federation'>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [planOptions, setPlanOptions] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    db.getPlans().then((ps) => setPlanOptions(ps.map((p) => p.name))).catch(() => {});
  }, []);

  const displayName = (session?.user?.user_metadata?.full_name as string | undefined) || member?.name || 'Guest';
  const email = session?.user?.email || member?.email || '';
  const weaponLabel = member?.weapon ? WEAPON_LABEL[member.weapon] : null;
  const memberSince = member?.created_at ? new Date(member.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';
  const medStatus = getDocStatus(member?.medical_cert_url, member?.medical_cert_expiry_date);
  const fedStatus = getDocStatus(member?.federation_licence_url, member?.federation_licence_expiry_date);

  const saveField = async (field: keyof Member, value: string) => {
    if (!memberId) { setSaveError("Your profile isn't loaded yet — please try again in a moment."); return; }
    setSaveError(null);
    try { await db.updateMember(memberId, { [field]: value }); await refresh(); }
    catch { setSaveError("Couldn't save that change. Please try again."); }
  };

  const editAvatar = async () => {
    if (!memberId) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      try { const url = await db.uploadMemberAvatar(memberId, { uri: a.uri, name: a.fileName || 'avatar.jpg', type: a.mimeType }); await db.updateMember(memberId, { avatar_url: url }); await refresh(); } catch { /* ignore */ }
    }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.paper }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, backgroundColor: t.colors.surface, borderBottomWidth: 1, borderBottomColor: t.colors.hairline }}>
        <Avatar name={displayName} size={60} />
        <View style={{ flex: 1 }}>
          <Text variant="display" size={20}>{displayName}</Text>
          <Text color={t.colors.muted} size={13} style={{ marginTop: 2 }}>{weaponLabel && member?.category ? `${weaponLabel} · ${member.category}` : weaponLabel || member?.category || 'Member'}</Text>
          {member?.id && <Text variant="mono" color={t.colors.faint} size={11} style={{ marginTop: 3 }}>MBR-{member.id.slice(0, 5).toUpperCase()}</Text>}
        </View>
        <Pressable onPress={editAvatar} style={{ borderWidth: 1, borderColor: t.colors.hairline, borderRadius: t.radius.btn, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text color={t.colors.muted} size={13} weight="600">Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {(error || (saveError && !memberId)) && !loading && (
          <Pressable onPress={refresh} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.colors.dangerTint, borderRadius: t.radius.card, padding: 13, marginBottom: 16 }}>
            <Icon name="alertCircle" size={18} color={t.colors.danger} />
            <Text style={{ flex: 1 }} color={t.colors.danger} size={13}>{error || saveError} Tap to retry.</Text>
          </Pressable>
        )}
        {saveError && memberId && (
          <Text color={t.colors.danger} size={12.5} style={{ marginBottom: 12, marginLeft: 2 }}>{saveError}</Text>
        )}
        <Section title="Documents">
          <ProfileRow label="Medical certificate" value={<VisaBadge status={medStatus} />} onTap={() => setDocSheet('medical')} />
          <ProfileRow label="Federation licence" value={<VisaBadge status={fedStatus} />} onTap={() => setDocSheet('federation')} last />
        </Section>

        <Section title="Club membership">
          <ProfileRow label="Plan" value={member?.plan_name || '—'} onTap={() => setPicker({ field: 'plan_name', title: 'Membership plan', options: planOptions.map((v) => ({ value: v, label: v })) })} />
          <ProfileRow label="Weapon" value={member?.weapon ? WEAPON_LABEL[member.weapon] : '—'} onTap={() => setPicker({ field: 'weapon', title: 'Weapon', options: WEAPON_OPTIONS.map((v) => ({ value: v, label: WEAPON_LABEL[v], glyph: v })) })} />
          <ProfileRow label="Category" value={member?.category || '—'} onTap={() => setPicker({ field: 'category', title: 'Category', options: CATEGORY_OPTIONS.map((v) => ({ value: v, label: v })) })} />
          <ProfileRow label="Member since" value={memberSince} last />
        </Section>

        <Section title="Personal">
          <ProfileRow icon="user" label="Date of birth" value={member?.date_of_birth ? formatDocDate(member.date_of_birth) || '—' : '—'} onTap={() => setDobOpen(true)} />
          <ProfileRow icon="message" label="Email" value={email || '—'} />
          <ProfileRow icon="users" label="Emergency contacts" value={<Text color={t.colors.brand} size={12} weight="600">Manage →</Text>} onTap={() => setEmergencyOpen(true)} last />
        </Section>

        <Section title="Account">
          <ProfileRow icon="bell" label="Notifications" value="" onTap={() => setNotifOpen(true)} />
          <ProfileRow icon="lock" label="Sign out" value="" accent={t.colors.brand} onTap={signOut} last />
        </Section>
      </ScrollView>

      {picker && <OptionSheet title={picker.title} options={picker.options} value={member?.[picker.field] as string} onSelect={(v) => saveField(picker.field, v)} onClose={() => setPicker(null)} />}
      {dobOpen && <DateSheet initial={member?.date_of_birth} onSave={(v) => saveField('date_of_birth', v)} onClose={() => setDobOpen(false)} />}
      {docSheet && memberId && <DocumentSheet type={docSheet} member={member} memberId={memberId} onClose={() => setDocSheet(null)} onSaved={() => { refresh(); setDocSheet(null); }} />}
      {notifOpen && <NotifSheet memberId={memberId} initial={member?.notif_prefs} onClose={() => setNotifOpen(false)} />}
      {emergencyOpen && memberId && <EmergencyContacts memberId={memberId} onClose={() => setEmergencyOpen(false)} />}
    </SafeAreaView>
  );
}
