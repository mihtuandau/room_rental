import Link from 'next/link';
import { SearchX, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface StateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: StateAction;
  className?: string;
}

/**
 * Premium Empty State with a decorative background illustration element
 * and centered content.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white px-6 py-16 text-center sm:px-12 sm:py-20',
        className
      )}
    >
      {/* Decorative background circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <div className="h-64 w-64 rounded-full bg-brand-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {icon ? (
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-50 ring-1 ring-zinc-200/70">
            <div className="text-zinc-400">
              {icon}
            </div>
          </div>
        ) : (
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-50 ring-1 ring-zinc-200/70">
            <SearchX className="h-7 w-7 text-zinc-300" aria-hidden />
          </div>
        )}
        <h3 className="text-lg font-medium text-zinc-900">{title}</h3>
        {description && (
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-8">
            {action.href ? (
              <Button asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'Không tải được dữ liệu',
  description = 'Hệ thống đang gặp gián đoạn hoặc kết nối mạng không ổn định. Vui lòng thử lại sau.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<ServerCrash className="h-8 w-8 text-danger-600" aria-hidden />}
      title={title}
      description={description}
      action={onRetry ? { label: 'Thử lại ngay', onClick: onRetry } : undefined}
    />
  );
}

export function PermissionDeniedState() {
  return (
    <EmptyState
      title="Bạn không có quyền thực hiện thao tác này"
      description="Phiên quản trị của bạn không được cấp quyền cho khu vực này."
    />
  );
}
