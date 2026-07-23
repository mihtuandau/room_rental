import { create } from 'zustand';

/**
 * The access token lives in memory only — never localStorage, so an XSS bug
 * can't read it back out. It's short-lived (~20 min); the long-lived refresh
 * token is an httpOnly cookie set by our own Route Handler, so a page reload
 * silently restores the session via POST /api/auth/refresh.
 */
interface AuthState {
  accessToken: string | null;
  /** false until the first refresh attempt settles, so route guards don't flash */
  isBootstrapped: boolean;
  setAccessToken: (token: string | null) => void;
  setBootstrapped: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isBootstrapped: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setBootstrapped: (isBootstrapped) => set({ isBootstrapped }),
}));

export const useIsSignedIn = () => useAuthStore((s) => s.accessToken !== null);
