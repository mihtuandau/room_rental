import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  setResolvedTheme: (resolvedTheme: ResolvedTheme) => void;
}

export const THEME_STORAGE_KEY = 'tro-oi-theme';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      resolvedTheme: 'light',
      setPreference: (preference) => set({ preference }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: ({ preference }) => ({ preference }),
    },
  ),
);
