'use client';

import { Dialog as SheetPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'right' | 'bottom';
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
      <SheetPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-white shadow-popover focus:outline-none',
          side === 'right' && 'inset-y-0 right-0 w-full max-w-sm border-l border-zinc-200',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t border-zinc-200',
          className,
        )}
        {...props}
      >
        {side === 'bottom' && (
          <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-zinc-200" aria-hidden />
        )}
        {children}
        <SheetPrimitive.Close
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" aria-hidden />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-zinc-100 px-5 py-4 pr-16', className)}
      {...props}
    />
  );
}

export function SheetTitle(
  props: React.ComponentProps<typeof SheetPrimitive.Title>,
) {
  return <SheetPrimitive.Title className="text-base font-semibold" {...props} />;
}

export function SheetDescription(
  props: React.ComponentProps<typeof SheetPrimitive.Description>,
) {
  return (
    <SheetPrimitive.Description
      className="mt-1 text-sm text-zinc-600"
      {...props}
    />
  );
}

export function SheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto p-5', className)} {...props} />;
}
