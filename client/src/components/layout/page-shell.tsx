import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const pageContainerVariants = cva(
  'mx-auto w-full px-4 py-8 sm:px-6 lg:px-8',
  {
    variants: {
      size: {
        narrow: 'max-w-5xl',
        wide: 'max-w-7xl',
      },
    },
    defaultVariants: {
      size: 'wide',
    },
  },
);

export function PageContainer({
  children,
  className,
  size,
}: {
  children: ReactNode;
  className?: string;
  size?: VariantProps<typeof pageContainerVariants>['size'];
}) {
  return (
    <div className={cn(pageContainerVariants({ size }), className)}>
      {children}
    </div>
  );
}
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-prose text-sm text-zinc-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
