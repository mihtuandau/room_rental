/**
 * Browser-side API client. Talks to Next's own /api/proxy/* Route Handlers —
 * never to the backend origin directly, so the session stays in a first-party
 * httpOnly cookie and the backend URL never ships to the browser.
 */

import { useAuthStore } from '@/stores/auth-store';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** class-validator returns an array of messages for a 400 */
    public fieldErrors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface BackendError {
  statusCode?: number;
  message?: string | string[];
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Refresh once for every group of concurrent 401s. The refresh endpoint sets
 * the replacement httpOnly session cookie; the returned token only keeps the
 * in-memory signed-in indicator current and is never used as API transport.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) {
          useAuthStore.getState().setAccessToken(null);
          return null;
        }

        const { accessToken } = (await res.json()) as { accessToken: string };
        useAuthStore.getState().setAccessToken(accessToken);
        return accessToken;
      })
      .catch(() => {
        useAuthStore.getState().setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const request = () => fetch(`/api/proxy${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  let res = await request();

  // Access tokens are short-lived. Refreshing through the dedicated auth route
  // keeps rr_refresh scoped to /api/auth, then a single retry uses its new
  // rr_session cookie. Never retry a second 401 to avoid refresh loops.
  if (res.status === 401 && (await refreshAccessToken())) {
    res = await request();
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as BackendError | null;
    const raw = body?.message;
    const list = Array.isArray(raw) ? raw : undefined;
    throw new ApiError(
      res.status,
      list?.[0] ?? (typeof raw === 'string' ? raw : 'Đã có lỗi xảy ra.'),
      list,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Auth routes are their own handlers (they set cookies), so they skip the proxy. */
export async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as (BackendError & T) | null;
  if (!res.ok) {
    const raw = data?.message;
    const list = Array.isArray(raw) ? raw : undefined;
    throw new ApiError(
      res.status,
      list?.[0] ?? (typeof raw === 'string' ? raw : 'Đã có lỗi xảy ra.'),
      list,
    );
  }
  return data as T;
}
