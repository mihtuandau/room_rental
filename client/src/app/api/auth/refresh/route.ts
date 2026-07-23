import { NextRequest, NextResponse } from 'next/server';
import {
  REFRESH_COOKIE,
  clearSessionCookies,
  readBackendRefreshToken,
  setSessionCookies,
} from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const beRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    // the backend reads its own refresh_token cookie — not a bearer token,
    // and not a JSON body
    headers: { Cookie: `refresh_token=${refreshToken}` },
  });

  if (!beRes.ok) {
    // revoked elsewhere (logout, password change, ban) — clear ours too so the
    // user isn't stuck in a session that can never recover
    const res = NextResponse.json({ message: 'Phiên đã hết hạn.' }, { status: 401 });
    clearSessionCookies(res);
    return res;
  }

  const { accessToken } = await beRes.json();
  const res = NextResponse.json({ accessToken });
  setSessionCookies(res, { accessToken, refreshToken: readBackendRefreshToken(beRes) });
  return res;
}
