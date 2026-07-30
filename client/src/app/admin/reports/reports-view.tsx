'use client';

import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import { Flag } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/states';
import type { AdminReport } from '@/features/admin/api';
import { useAdminReports, useResolveAdminReport } from '@/features/admin/hooks';
import { ReportDialog } from './_components/report-dialog';
import { ReportsSkeleton } from './_components/reports-skeleton';
import { ReportsStats } from './_components/reports-stats';
import { ReportsTable } from './_components/reports-table';
import {
  PAGE_SIZE,
  reportParsers,
} from './_lib/reports-config';

export function AdminReportsView() {
  const [state, setState] = useQueryStates(reportParsers, {
    history: 'push',
    shallow: true,
  });
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [note, setNote] = useState('');
  const reports = useAdminReports({
    status: state.status ?? undefined,
    page: state.page,
    pageSize: PAGE_SIZE,
  });
  const resolve = useResolveAdminReport();

  const submit = (status: 'resolved' | 'dismissed') => {
    if (!selected || !note.trim()) return;
    void resolve
      .mutateAsync({
        id: selected.id,
        status,
        resolutionNote: note.trim(),
      })
      .then(() => {
        setSelected(null);
        setNote('');
      });
  };

  if (reports.isPending && !reports.data) return <ReportsSkeleton />;
  if (reports.isError) {
    return <ErrorState onRetry={() => void reports.refetch()} />;
  }
  if (!reports.data) return null;

  const { data } = reports;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pending = data.reports.filter(
    (report) => report.status === 'pending',
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Báo cáo vi phạm"
        description="Theo dõi báo cáo từ người dùng và lưu lại hướng xử lý rõ ràng."
        action={
          <Badge variant="pending" className="w-fit px-3 py-1.5">
            <Flag className="h-4 w-4" aria-hidden />
            {data.total.toLocaleString('vi-VN')} báo cáo
          </Badge>
        }
      />

      <ReportsStats total={data.total} pending={pending} />

      <ReportsTable
        reports={data.reports}
        status={state.status}
        page={data.page}
        total={data.total}
        totalPages={totalPages}
        isUpdating={reports.isPlaceholderData}
        onStatus={(status) => void setState({ status, page: 1 })}
        onSelect={(report) => {
          setSelected(report);
          setNote('');
        }}
        onPage={(page) => void setState({ page })}
      />

      <ReportDialog
        report={selected}
        note={note}
        loading={resolve.isPending}
        onNote={setNote}
        onClose={() => setSelected(null)}
        onSubmit={submit}
      />
    </div>
  );
}
