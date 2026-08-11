import { NextRequest, NextResponse } from 'next/server';
import { readBackendRefreshToken, setSessionCookies } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  // body is { accessToken } — the access token Facebook Login handed the browser.
  let beRes: Response;
  try {
    beRes = await fetch(`${API_URL}/auth/facebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await req.json()),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json(
      { message: 'Dịch vụ đăng nhập tạm thời không khả dụng.' },
      { status: 503 },
    );
  }

  const body = await beRes.json().catch(() => ({ message: 'Đăng nhập Facebook thất bại.' }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  const res = NextResponse.json({ accessToken: body.accessToken });
  setSessionCookies(res, {
    accessToken: body.accessToken,
    refreshToken: readBackendRefreshToken(beRes),
  });
  return res;
}
