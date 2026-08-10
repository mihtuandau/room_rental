import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  let beRes: Response;
  try {
    beRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await req.json()),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json(
      { message: 'Dịch vụ đăng ký tạm thời không khả dụng.' },
      { status: 503 },
    );
  }

  const body = await beRes.json().catch(() => ({ message: 'Đăng ký thất bại.' }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  // Registration creates the account but does NOT start a session — the user is
  // sent to /login to sign in themselves. We deliberately drop the backend's
  // tokens (never set the cookies) so they aren't left signed in on this device.
  return NextResponse.json({ ok: true });
}
