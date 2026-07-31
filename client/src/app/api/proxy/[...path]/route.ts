import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { SESSION_COOKIE } from '@/lib/auth-cookies';

const API_URL = process.env.API_URL!;

function revalidateRoomImagePages(method: string, path: string[], ok: boolean) {
  if (!ok || !['POST', 'PATCH', 'DELETE'].includes(method)) return;
  if (!/^rooms\/\d+\/images(?:\/|$)/.test(path.join('/'))) return;

  revalidatePath('/');
  revalidatePath('/room/[slug]', 'page');
  revalidatePath('/rooms-for-rent/[slug]', 'page');
}

async function forward(req: NextRequest, path: string[]) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const url = `${API_URL}/${path.join('/')}${req.nextUrl.search}`;
  const hasBody = !['GET', 'HEAD'].includes(req.method);

  try {
    const beRes = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: hasBody ? await req.text() : undefined,
      signal: AbortSignal.timeout(15_000),
    });

    revalidateRoomImagePages(req.method, path, beRes.ok);
    if (beRes.status === 204) return new NextResponse(null, { status: 204 });
    const data = await beRes.json().catch(() => null);
    return NextResponse.json(data, { status: beRes.status });
  } catch {
    return NextResponse.json(
      {
        statusCode: 502,
        message:
          'Không kết nối được máy chủ. Kiểm tra backend và thử lại nhé.',
        timestamp: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
// PUT matters: PUT /rooms/:id/amenities is a real endpoint, and a missing verb
// here fails with a confusing 405
export async function PUT(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
