'use client';

export function AuthStepTransition({ stepKey, direction = 'forward', className, children }: { stepKey: string; direction?: 'forward' | 'back'; className?: string; children: React.ReactNode }) {
  return <div key={stepKey} className={`auth-step-transition auth-step-${direction} ${className ?? ''}`}>{children}</div>;
}
