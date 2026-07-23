import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_COOKIE, clearSessionCookies } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  // Tell the backend so it bumps tokenVersion and kills sessions on other
  // devices too. Best-effort: clear our cookies either way.
  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
    }).catch(() => undefined);
  }

  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
