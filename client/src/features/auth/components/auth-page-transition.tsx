'use client';

export function AuthPageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page-transition">
      <div className="auth-route-layer p-6 sm:p-8 auth-route-current">{children}</div>
    </div>
  );
}
