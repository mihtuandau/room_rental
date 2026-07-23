import { NextRequest, NextResponse } from 'next/server';
import { readBackendRefreshToken, setSessionCookies } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  // body is { idToken } — the ID token Google Sign-In handed the browser.
  // The backend verifies it against Google's keys; we never trust it here.
  const beRes = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await req.json()),
  });

  const body = await beRes.json().catch(() => ({ message: 'Đăng nhập Google thất bại.' }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  const res = NextResponse.json({ accessToken: body.accessToken });
  setSessionCookies(res, {
    accessToken: body.accessToken,
    refreshToken: readBackendRefreshToken(beRes),
  });
  return res;
}
