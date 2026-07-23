import { NextResponse, type NextRequest } from 'next/server';

/**
 * Coarse gate only — it checks that a session cookie exists, never verifies the
 * JWT signature. Real authorisation is the backend answering 401/403.
 */
export function middleware(req: NextRequest) {
  // The access cookie expires after ~20 minutes while the refresh cookie lasts
  // 30 days, so check for either — testing only rr_session would bounce a user
  // with a perfectly valid session back to the login page.
  const signedIn =
    req.cookies.has('rr_session') || req.cookies.has('rr_refresh');

  if (!signedIn) {
    const login = new URL('/dang-nhap', req.url);
    login.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/quan-ly/:path*', '/admin/:path*'],
};
