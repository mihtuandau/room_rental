import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const beRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await req.json()),
  });

  const body = await beRes.json().catch(() => ({ message: 'Đăng ký thất bại.' }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  // Registration creates the account but does NOT start a session — the user is
  // sent to /login to sign in themselves. We deliberately drop the backend's
  // tokens (never set the cookies) so they aren't left signed in on this device.
  return NextResponse.json({ ok: true });
}
