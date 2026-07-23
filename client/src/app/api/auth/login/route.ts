import { NextRequest, NextResponse } from 'next/server';
import { readBackendRefreshToken, setSessionCookies } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const beRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await req.json()),
  });

  const body = await beRes.json().catch(() => ({ message: 'Đăng nhập thất bại.' }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  // The access token goes back to the client for the Authorization header;
  // the refresh token stays in an httpOnly cookie on our own origin.
  const res = NextResponse.json({ accessToken: body.accessToken });
  setSessionCookies(res, {
    accessToken: body.accessToken,
    refreshToken: readBackendRefreshToken(beRes),
  });
  return res;
}
