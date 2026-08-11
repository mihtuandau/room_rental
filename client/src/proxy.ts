import { NextResponse, type NextRequest } from 'next/server';

function buildContentSecurityPolicy(nonce: string, isDevelopment: boolean) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "object-src 'none'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
      'https://accounts.google.com',
    ].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    [
      "connect-src 'self'",
      ...(isDevelopment ? ['ws:'] : []),
      'https://accounts.google.com',
      'https://api.cloudinary.com',
      'https://nominatim.openstreetmap.org',
      'https://provinces.open-api.vn',
      'https://tile.openstreetmap.org',
    ].join(' '),
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

/**
 * This is only a coarse client-side gate. The backend still verifies the
 * session and role for every protected API request.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, isDevelopment);
  const { pathname, search } = request.nextUrl;
  const isProtectedRoute =
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    pathname.startsWith('/manage/') ||
    pathname.startsWith('/admin/');
  const signedIn =
    request.cookies.has('rr_session') || request.cookies.has('rr_refresh');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  if (isProtectedRoute && !signedIn) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
