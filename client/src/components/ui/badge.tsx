import { ShieldCheck } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ROOM_STATUS_LABELS, type RoomStatus } from '@/lib/constants';

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        verified: 'bg-brand-50 text-brand-700',
        pending: 'bg-warning-50 text-warning-600',
        warning: 'bg-warning-50 text-warning-600',
        danger: 'bg-danger-50 text-danger-600',
        neutral: 'bg-zinc-100 text-zinc-600',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/**
 * The verified signal is the product's whole promise, so it ships as one
 * component rather than a colour a call site has to remember: colour alone
 * carries no meaning for a colour-blind user or a greyscale print.
 */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="verified" className={className}>
      <ShieldCheck className="h-3 w-3" aria-hidden />
      Đã xác minh
    </Badge>
  );
}

/** Only the owner and admins see this — public listings are always `active`. */
const STATUS_VARIANT: Record<RoomStatus, BadgeProps['variant']> = {
  draft: 'neutral',
  pending: 'pending',
  active: 'verified',
  hidden: 'neutral',
  rejected: 'danger',
  expired: 'neutral',
};

export function RoomStatusBadge({
  status,
  className,
}: {
  status: RoomStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {ROOM_STATUS_LABELS[status]}
    </Badge>
  );
}

export { badgeVariants };
