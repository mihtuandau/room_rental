'use client';

/* Route navigation is the external event that drives the outgoing layer. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type RouteLayer = { pathname: string; node: React.ReactNode };

function isSwappedAuthPath(pathname: string) {
  return pathname === '/register' || pathname === '/forgot-password';
}

export function AuthPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [current, setCurrent] = useState<RouteLayer>({ pathname, node: children });

  useEffect(() => {
    if (current.pathname === pathname) return;
    setCurrent({ pathname, node: children });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const enteringFromLeft = isSwappedAuthPath(current.pathname);
  return (
    <div className="auth-page-transition">
      <div className={`auth-route-layer p-6 sm:p-8 auth-route-current ${enteringFromLeft ? 'auth-fly-in-left' : 'auth-fly-in-right'}`}>
        {current.node}
      </div>
    </div>
  );
}
/* eslint-enable react-hooks/set-state-in-effect */
