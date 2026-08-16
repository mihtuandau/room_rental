// Radix's Slot (used for `asChild`) calls createContext as of v1.2+, so any
// component using it must be a Client Component. That's fine — Server
// Components can still render this; it just ships a small amount of JS.
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // focus ring and disabled handling live here so no variant can forget them
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] active:translate-y-px ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600',
        secondary:
          'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-400',
        outline:
          'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400',
        ghost: 'text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-400',
        danger:
          'bg-danger-600 text-white hover:opacity-90 focus-visible:ring-danger-600',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** render as the child element (e.g. next/link) instead of a <button> */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
