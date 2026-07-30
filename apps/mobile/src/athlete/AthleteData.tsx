import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, auth } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Member, Booking } from '@riposte/core';

export interface BookingSlot {
  coachId?: string | null;
  date?: string | null;
  time?: string | null;
  piste?: string | null;
  weapon?: string | null;
}

interface AthleteDataValue {
  member: Member | null;
  memberId: string | null;
  upcoming: Booking[];
  loading: boolean;
  /** Set when the member profile failed to load (was silently swallowed before). */
  error: string | null;
  refresh: () => Promise<void>;
  /** Returns true if the booking was actually written, false on failure. */
  book: (slot: BookingSlot) => Promise<boolean>;
}

const Ctx = createContext<AthleteDataValue | undefined>(undefined);

export function AthleteDataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const m = await auth.upsertMemberFromAuth(user);
        if (!active) return;
        setMember(m); setMemberId(m.id);
        const b = await db.getUpcomingBookings(m.id);
        if (active) setUpcoming(b);
      } catch (e) {
        if (active) setError("Couldn't load your profile. Please try again.");
        console.warn('[AthleteData] member load failed', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session?.user?.id]);

  const refresh = useCallback(async () => {
    if (!memberId) return;
    try {
      const [m, b] = await Promise.all([db.getMember(memberId), db.getUpcomingBookings(memberId)]);
      if (m) setMember(m);
      setUpcoming(b);
    } catch { /* ignore */ }
  }, [memberId]);

  const book = useCallback(async (slot: BookingSlot): Promise<boolean> => {
    if (!memberId) return false;
    let ok = true;
    try {
      await db.createBooking({
        member_id: memberId,
        coach_id: slot.coachId ?? null,
        slot_date: slot.date ?? null,
        slot_time: slot.time ?? null,
        piste: slot.piste ?? null,
        weapon: (slot.weapon as Booking['weapon']) ?? null,
      });
    } catch {
      ok = false;
    }
    await refresh(); // re-syncs upcoming from the server either way
    return ok;
  }, [memberId, refresh]);

  return (
    <Ctx.Provider value={{ member, memberId, upcoming, loading, error, refresh, book }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAthlete(): AthleteDataValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAthlete must be used within AthleteDataProvider');
  return ctx;
}
