'use client';

import { useEffect } from 'react';
import {
  type ResolvedTheme,
  type ThemePreference,
  useThemeStore,
} from '@/stores/theme-store';

function resolveTheme(
  preference: ThemePreference,
  media: MediaQueryList,
): ResolvedTheme {
  if (preference === 'system') return media.matches ? 'dark' : 'light';
  return preference;
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeBootstrap() {
  const preference = useThemeStore((state) => state.preference);
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const syncTheme = () => {
      const resolvedTheme = resolveTheme(preference, media);
      applyTheme(resolvedTheme);
      setResolvedTheme(resolvedTheme);
    };

    syncTheme();
    media.addEventListener('change', syncTheme);
    return () => media.removeEventListener('change', syncTheme);
  }, [preference, setResolvedTheme]);

  return null;
}
