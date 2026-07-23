import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(
        'h-10 w-full rounded-md border bg-white px-3 text-sm transition-colors',
        'placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:bg-zinc-50',
        error
          ? 'border-danger-600 focus:ring-danger-600'
          : 'border-zinc-300 focus:border-brand-600 focus:ring-brand-600',
        className,
      )}
      {...props}
    />
  );
}
