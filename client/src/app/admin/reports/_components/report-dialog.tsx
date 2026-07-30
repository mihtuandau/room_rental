'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AdminReport } from '@/features/admin/api';
import {
  formatReportDate,
  REPORT_REASON_LABELS,
} from '../_lib/reports-config';
import { ReportStatusBadge } from './report-status-badge';

export function ReportDialog({
  report,
  note,
  loading,
  onNote,
  onClose,
  onSubmit,
}: {
  report: AdminReport | null;
  note: string;
  loading: boolean;
  onNote: (note: string) => void;
  onClose: () => void;
  onSubmit: (status: 'resolved' | 'dismissed') => void;
}) {
  const actionable =
    report?.status === 'pending' || report?.status === 'reviewing';

  return (
    <Dialog
      open={Boolean(report)}
      onOpenChange={(open) => !open && !loading && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {report ? (
            <div className="space-y-4">
              <div className="rounded-md bg-zinc-50 p-4">
                <p className="font-medium text-zinc-900">{report.room.title}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {REPORT_REASON_LABELS[report.reason]}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  {report.description ||
                    'Người dùng không cung cấp mô tả bổ sung.'}
                </p>
              </div>
              {actionable ? (
                <div>
                  <label
                    htmlFor="report-resolution-note"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Ghi chú xử lý
                  </label>
                  <Textarea
                    id="report-resolution-note"
                    className="mt-2 min-h-28"
                    value={note}
                    onChange={(event) => onNote(event.target.value)}
                    placeholder="Ghi lại kết quả kiểm tra hoặc lý do bỏ qua…"
                  />
                </div>
              ) : (
                <div className="rounded-md border border-zinc-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-800">
                      Kết quả xử lý
                    </p>
                    <ReportStatusBadge status={report.status} />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                    {report.resolutionNote || 'Không có ghi chú xử lý.'}
                  </p>
                  {report.resolvedAt ? (
                    <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                      {report.resolvedBy?.fullName || 'Quản trị viên'} ·{' '}
                      {formatReportDate(report.resolvedAt)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </DialogBody>
        {actionable ? (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="danger"
              disabled={!note.trim() || loading}
              onClick={() => onSubmit('dismissed')}
            >
              Bỏ qua
            </Button>
            <Button
              disabled={!note.trim() || loading}
              onClick={() => onSubmit('resolved')}
            >
              {loading ? 'Đang lưu…' : 'Đã xử lý'}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
