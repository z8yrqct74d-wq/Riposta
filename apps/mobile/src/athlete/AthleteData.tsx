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
  credits: number;
  upcoming: Booking[];
  loading: boolean;
  refresh: () => Promise<void>;
  /** Returns true if the booking was actually written, false on failure. */
  book: (slot: BookingSlot) => Promise<boolean>;
}

const Ctx = createContext<AthleteDataValue | undefined>(undefined);

export function AthleteDataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const m = await auth.upsertMemberFromAuth(user);
        if (!active) return;
        setMember(m); setMemberId(m.id); setCredits(m.credits ?? 0);
        const b = await db.getUpcomingBookings(m.id);
        if (active) setUpcoming(b);
      } catch {
        /* leave defaults */
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
      if (m) { setMember(m); setCredits(m.credits ?? 0); }
      setUpcoming(b);
    } catch { /* ignore */ }
  }, [memberId]);

  const book = useCallback(async (slot: BookingSlot): Promise<boolean> => {
    if (!memberId) return false;
    setCredits((c) => c - 1); // optimistic
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
      ok = false; // revert the optimistic decrement below via refresh()
    }
    await refresh(); // re-syncs credits/upcoming from the server either way
    return ok;
  }, [memberId, refresh]);

  return (
    <Ctx.Provider value={{ member, memberId, credits, upcoming, loading, refresh, book }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAthlete(): AthleteDataValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAthlete must be used within AthleteDataProvider');
  return ctx;
}
