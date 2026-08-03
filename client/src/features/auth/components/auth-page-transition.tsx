'use client';

/* Route navigation is the external event that drives the outgoing layer. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type RouteLayer = { pathname: string; node: React.ReactNode };

function isRegisterPath(pathname: string) {
  return pathname === '/register';
}

export function AuthPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [current, setCurrent] = useState<RouteLayer>({ pathname, node: children });
  const [outgoing, setOutgoing] = useState<RouteLayer | null>(null);

  useEffect(() => {
    if (current.pathname === pathname) return;
    setOutgoing(current);
    setCurrent({ pathname, node: children });
    const timeout = window.setTimeout(() => setOutgoing(null), 440);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const enteringFromLeft = isRegisterPath(current.pathname);
  return (
    <div className="auth-page-transition">
      {outgoing && (
        <div
          className={`auth-route-layer auth-route-outgoing ${enteringFromLeft ? 'auth-fly-out-right' : 'auth-fly-out-left'}`}
          aria-hidden="true"
          inert
        >
          {outgoing.node}
        </div>
      )}
      <div className={`auth-route-layer auth-route-current ${enteringFromLeft ? 'auth-fly-in-left' : 'auth-fly-in-right'}`}>
        {current.node}
      </div>
    </div>
  );
}
/* eslint-enable react-hooks/set-state-in-effect */
