import Link from 'next/link';
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
 * A generic "no data" message tells the user nothing — always name the
 * situation and offer the action that resolves it.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center py-16 text-center', className)}>
      {icon && <div className="mb-4 text-zinc-400">{icon}</div>}
      <h3 className="text-base font-medium text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-600">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Button className="mt-6" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button className="mt-6" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}

export function ErrorState({
  title = 'Không tải được dữ liệu',
  description = 'Có thể do kết nối mạng. Bạn thử lại nhé.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={onRetry ? { label: 'Thử lại', onClick: onRetry } : undefined}
    />
  );
}
