import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MetricTone = 'brand' | 'warning' | 'danger' | 'neutral';

const metricToneClasses: Record<MetricTone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  neutral: 'bg-zinc-100 text-zinc-700',
};

export function AdminPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
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
        <p className="mt-1 max-w-prose text-sm text-zinc-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function AdminMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'brand',
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: MetricTone;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'min-h-32 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
          {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
        </div>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
            metricToneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </article>
  );
}

export function AdminPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-zinc-200 bg-white',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminPanelHeader({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-zinc-100 p-4 sm:p-5', className)}>
      {title || action ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-xs text-zinc-500">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export const adminTableHeadClassName =
  'border-b border-zinc-100 bg-zinc-50 text-xs font-medium text-zinc-500';

export const adminTableRowClassName =
  'border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/70';
