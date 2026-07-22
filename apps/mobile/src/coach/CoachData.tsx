import React, { createContext, useContext, useState } from 'react';
import type { Coach, Weapon } from '@riposte/core';
import { useAuth } from '../auth/AuthProvider';

export interface CoachItem {
  id: string;
  type: 'lesson' | 'group' | 'open';
  t: string;
  startMin: number;
  durMin: number;
  title: string | null;
  who?: string;
  weapon?: Weapon | null;
  piste?: string | null;
  status?: string;
  live?: boolean;
  blockId?: string;
  bookingId?: string;
  memberId?: string | null;
  memberCredits?: number | null;
  memberCat?: string | null;
  memberName?: string | null;
}

interface CoachDataValue {
  coach: Coach | null;
  selected: CoachItem | null;
  setSelected: (item: CoachItem | null) => void;
}

const Ctx = createContext<CoachDataValue | undefined>(undefined);

export function CoachDataProvider({ children }: { children: React.ReactNode }) {
  const { resolution } = useAuth();
  const [selected, setSelected] = useState<CoachItem | null>(null);
  return <Ctx.Provider value={{ coach: resolution?.coach ?? null, selected, setSelected }}>{children}</Ctx.Provider>;
}

export function useCoach(): CoachDataValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCoach must be used within CoachDataProvider');
  return ctx;
}
