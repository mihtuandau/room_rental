---
name: add-bff-proxy-route
description: "Create RoomRent Next.js BFF routes. Use for authentication, secure cookies, token refresh, logout, or authenticated NestJS proxy requests."
---

# Route Handlers as a BFF proxy

Next sits in the middle: it receives the request from a Client Component, reads
the session from `httpOnly` cookies on our origin, attaches the access token as a
bearer credential server-side, and forwards the request to NestJS. Browser code
calls the same-origin proxy and never reads a token to build an Authorization header.

The auth store may keep the returned access token in memory as a short-lived
signed-in signal. Do not use that memory value as the normal API transport; the
proxy reads the protected `rr_session` cookie.

## What the backend actually returns (get this right)

| Endpoint | Request | Response |
|---|---|---|
| `POST /auth/login` | `{ phone, password }` | body `{ accessToken }` + `Set-Cookie: refresh_token=…; Path=/auth/refresh; HttpOnly` |
| `POST /auth/register` | `{ phone, password, fullName? }` | same shape, HTTP 201 |
| `POST /auth/google` | `{ idToken }` | same shape |
| `POST /auth/refresh` | reads the `refresh_token` **cookie** | `{ accessToken }` + a fresh cookie |
| `POST /auth/logout` | reads the `refresh_token` **cookie** | `{ success: true }` |

Two consequences that are easy to get wrong:
- The refresh token is **never in the response body** — it must be lifted out of the
  backend's `Set-Cookie` header.
- `/auth/refresh` and `/auth/logout` authenticate via **cookie, not a bearer token** —
  forward it as a `Cookie` header, not in the JSON body.

## Shared helpers

`src/lib/auth-cookies.ts`
```ts
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "rr_session";   // access token
export const REFRESH_COOKIE = "rr_refresh";   // refresh token

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export function setSessionCookies(
  res: NextResponse,
  { accessToken, refreshToken }: { accessToken: string; refreshToken?: string },
) {
  res.cookies.set(SESSION_COOKIE, accessToken, {
    ...base,
    path: "/",
    maxAge: 60 * 20, // mirror the backend's JWT_ACCESS_EXPIRES_IN
  });
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      ...base,
      path: "/api/auth", // only sent to our own auth routes, narrowing exposure
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.set(REFRESH_COOKIE, "", { ...base, path: "/api/auth", maxAge: 0 });
}

/** Pull refresh_token out of the backend's Set-Cookie headers. */
export function readBackendRefreshToken(res: Response): string | undefined {
  for (const cookie of res.headers.getSetCookie()) {
    const match = /(?:^|;\s*)refresh_token=([^;]+)/.exec(cookie);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}
```

## Template: login (register and Google are identical apart from the path/body)

`src/app/api/auth/login/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { readBackendRefreshToken, setSessionCookies } from "@/lib/auth-cookies";

const API_URL = process.env.API_URL!; // server-only, never NEXT_PUBLIC_

export async function POST(req: NextRequest) {
  const beRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await req.json()),
  });

  const body = await beRes.json().catch(() => ({ message: "Đăng nhập thất bại." }));
  if (!beRes.ok) return NextResponse.json(body, { status: beRes.status });

  // Return a short-lived in-memory session signal to the auth store. API calls
  // still use /api/proxy; the proxy reads rr_session and adds Authorization.
  const res = NextResponse.json({ accessToken: body.accessToken });
  setSessionCookies(res, {
    accessToken: body.accessToken,
    refreshToken: readBackendRefreshToken(beRes),
  });
  return res;
}
```

`src/app/api/auth/google/route.ts` — same as above, forwarding `{ idToken }` to
`${API_URL}/auth/google`.

## Template: refresh

`src/app/api/auth/refresh/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  clearSessionCookies,
  readBackendRefreshToken,
  setSessionCookies,
} from "@/lib/auth-cookies";

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  const beRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    // the backend reads its own refresh_token cookie — not a bearer token,
    // and not a JSON body
    headers: { Cookie: `refresh_token=${refreshToken}` },
  });

  if (!beRes.ok) {
    // token was revoked (logout elsewhere, password change, ban) — clear ours too
    const res = NextResponse.json({ message: "Phiên đã hết hạn." }, { status: 401 });
    clearSessionCookies(res);
    return res;
  }

  const { accessToken } = await beRes.json();
  const res = NextResponse.json({ accessToken });
  setSessionCookies(res, { accessToken, refreshToken: readBackendRefreshToken(beRes) });
  return res;
}
```

## Template: logout

`src/app/api/auth/logout/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE, clearSessionCookies } from "@/lib/auth-cookies";

const API_URL = process.env.API_URL!;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  // Tell the backend so it bumps tokenVersion and kills every other session too.
  // Best-effort: even if it fails, still clear our cookies locally.
  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: `refresh_token=${refreshToken}` },
    }).catch(() => undefined);
  }

  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
```

## Template: the catch-all authenticated proxy

`src/app/api/proxy/[...path]/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookies";

const API_URL = process.env.API_URL!;

async function forward(req: NextRequest, path: string[]) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const url = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(req.method);

  const beRes = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: hasBody ? await req.text() : undefined,
  });

  if (beRes.status === 204) return new NextResponse(null, { status: 204 });
  const data = await beRes.json().catch(() => null);
  return NextResponse.json(data, { status: beRes.status });
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
export async function PUT(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return forward(req, (await params).path);
}
```

> `PUT` matters here — `PUT /rooms/:id/amenities` is a real endpoint. A proxy
> missing a verb fails with a confusing 405.

## Do NOT
- Set a token cookie with `httpOnly: false` "so the client can read it" — that defeats the entire point of the BFF.
- Expose `API_URL` as `NEXT_PUBLIC_*`.
- Send the refresh token to `/auth/refresh` or `/auth/logout` in a JSON body — this backend reads it from the cookie and will answer 401.
- Put business logic (validation, calculations) in the proxy — it only forwards; the logic lives in NestJS.

## Checklist
- [ ] Session cookies are `httpOnly`, `secure` in production, `sameSite: "lax"`
- [ ] Browser API functions call `/api/proxy` and never build a bearer header
- [ ] `API_URL` is server-only
- [ ] The refresh token is lifted out of the backend's `Set-Cookie`, not the body
- [ ] `/auth/refresh` and `/auth/logout` forward it as a `Cookie` header
- [ ] A failed refresh clears our cookies so the user isn't stuck in a broken session
- [ ] The catch-all proxy handles GET/POST/PATCH/PUT/DELETE
