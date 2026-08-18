'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export const AUTH_PENDING_MOTION_KEY = 'tro-oi-auth-motion';

type AuthMotionDirection = 'to-register' | 'to-login';

type AuthTransitionLinkProps = {
  href: string;
  direction: AuthMotionDirection;
  className?: string;
  children: ReactNode;
};

export function AuthTransitionLink({ href, direction, className, children }: AuthTransitionLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        window.sessionStorage.setItem(
          AUTH_PENDING_MOTION_KEY,
          JSON.stringify({ targetPathname: href, direction, createdAt: Date.now() }),
        );
      }}
    >
      {children}
    </Link>
  );
}
