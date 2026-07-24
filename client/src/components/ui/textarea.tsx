import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(
        'min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
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
