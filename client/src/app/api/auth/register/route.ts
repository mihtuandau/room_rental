import { NextRequest, NextResponse } from 'next/server';
import { readBackendRefreshToken, setSessionCookies } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const beRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await req.json()),
  });

  const body = await beRes.json().catch(() => ({ message: 'Đăng ký thất bại.' }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  const res = NextResponse.json({ accessToken: body.accessToken });
  setSessionCookies(res, {
    accessToken: body.accessToken,
    refreshToken: readBackendRefreshToken(beRes),
  });
  return res;
}
