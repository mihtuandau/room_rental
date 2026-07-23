'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * The access token is held in memory, so it's gone after every reload. The
 * refresh cookie survives, so on mount we trade it for a fresh access token —
 * that's what keeps the user signed in across reloads without ever persisting
 * a token where JS could read it.
 */
export function AuthBootstrap() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (cancelled) return;
        // 401 simply means "not signed in" — an expected outcome, not an error
        if (res.ok) {
          const { accessToken } = (await res.json()) as { accessToken: string };
          setAccessToken(accessToken);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setBootstrapped(true);
      });

    return () => {
      cancelled = true;
    };
  }, [setAccessToken, setBootstrapped]);

  return null;
}
