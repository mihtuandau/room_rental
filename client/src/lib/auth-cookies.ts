import type { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'rr_session'; // access token
export const REFRESH_COOKIE = 'rr_refresh'; // refresh token

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export function setSessionCookies(
  res: NextResponse,
  { accessToken, refreshToken }: { accessToken: string; refreshToken?: string },
) {
  res.cookies.set(SESSION_COOKIE, accessToken, {
    ...base,
    path: '/',
    maxAge: 60 * 20, // mirrors the backend's JWT_ACCESS_EXPIRES_IN
  });

  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      ...base,
      path: '/api/auth', // only sent to our own auth routes, narrowing exposure
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
  // deleting a path-scoped cookie needs the same path, so overwrite it instead
  res.cookies.set(REFRESH_COOKIE, '', { ...base, path: '/api/auth', maxAge: 0 });
}

/**
 * The backend returns the refresh token in a Set-Cookie header, never in the
 * response body — lift it out so we can re-issue it on our own origin.
 */
export function readBackendRefreshToken(res: Response): string | undefined {
  for (const cookie of res.headers.getSetCookie()) {
    const match = /(?:^|;\s*)refresh_token=([^;]+)/.exec(cookie);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}
