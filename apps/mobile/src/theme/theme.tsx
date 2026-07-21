import React, { createContext, useContext } from 'react';
import { lightTheme, darkTheme } from '@riposte/core';
import type { Theme } from '@riposte/core';

export type SurfaceRole = 'athlete' | 'coach';

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * Provides the design theme for a surface. Athlete = light, Coach = dark —
 * matching the two web surfaces. Wrap each role's route group in its own
 * provider so the whole subtree reads the right palette.
 */
export function ThemeProvider({ role, children }: { role?: SurfaceRole; children: React.ReactNode }) {
  const theme = role === 'coach' ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
