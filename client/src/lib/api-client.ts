/**
 * Browser-side API client. Talks to Next's own /api/proxy/* Route Handlers —
 * never to the backend origin directly, so the session stays in a first-party
 * httpOnly cookie and the backend URL never ships to the browser.
 */

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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

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
