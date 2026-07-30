import { Badge } from '@/components/ui/badge';
import type { AdminReportStatus } from '@/features/admin/api';
import { REPORT_STATUS_LABELS } from '../_lib/reports-config';

export function ReportStatusBadge({
  status,
}: {
  status: AdminReportStatus;
}) {
  return (
    <Badge
      variant={
        status === 'resolved'
          ? 'verified'
          : status === 'dismissed'
            ? 'neutral'
            : status === 'pending'
              ? 'pending'
              : 'warning'
      }
    >
      {REPORT_STATUS_LABELS[status]}
    </Badge>
  );
}
