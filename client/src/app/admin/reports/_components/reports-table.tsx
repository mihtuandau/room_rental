'use client';

import { ChevronLeft, ChevronRight, FileWarning } from 'lucide-react';
import {
  adminStickyActionCellClassName,
  adminStickyActionHeadClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from '@/components/admin/admin-page';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminReport, AdminReportStatus } from '@/features/admin/api';
import {
  formatReportDate,
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
} from '../_lib/reports-config';
import { ReportStatusBadge } from './report-status-badge';

export function ReportsTable({
  reports,
  status,
  page,
  total,
  totalPages,
  isUpdating,
  onStatus,
  onSelect,
  onPage,
}: {
  reports: AdminReport[];
  status: AdminReportStatus | null;
  page: number;
  total: number;
  totalPages: number;
  isUpdating: boolean;
  onStatus: (status: AdminReportStatus | null) => void;
  onSelect: (report: AdminReport) => void;
  onPage: (page: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Danh sách báo cáo
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Chọn một báo cáo để xem chi tiết và xử lý.
          </p>
        </div>
        <Select
          value={status ?? 'all'}
          onValueChange={(value) =>
            onStatus(value === 'all' ? null : (value as AdminReportStatus))
          }
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Lọc theo trạng thái báo cáo"
          >
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {REPORT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {REPORT_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {reports.length === 0 ? (
        <EmptyState
          icon={<FileWarning className="h-10 w-10" />}
          title="Không có báo cáo phù hợp"
          description="Thử chọn một trạng thái khác để xem dữ liệu."
        />
      ) : (
        <div className="overflow-x-auto">
          <p className="px-5 pb-2 text-xs text-zinc-500 md:hidden">
            Vuốt ngang để xem đầy đủ thông tin.
          </p>
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className={adminTableHeadClassName}>
              <tr>
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-4 py-3">Tin bị báo cáo</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Người gửi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className={`${adminStickyActionHeadClassName} px-5 py-3`}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className={isUpdating ? 'opacity-60' : undefined}>
              {reports.map((report) => (
                <tr key={report.id} className={adminTableRowClassName}>
                  <td className="px-5 py-4 text-zinc-600">
                    {formatReportDate(report.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-60 truncate font-medium text-zinc-900">
                      {report.room.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      #{report.room.id}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-zinc-800">
                      {REPORT_REASON_LABELS[report.reason]}
                    </p>
                    <p className="mt-1 max-w-48 truncate text-xs text-zinc-500">
                      {report.description || 'Không có mô tả thêm'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-zinc-800">
                      {report.reporter.fullName || 'Người dùng ẩn danh'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {report.reporter.phone || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <ReportStatusBadge status={report.status} />
                  </td>
                  <td className={`${adminStickyActionCellClassName} px-5 py-4`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelect(report)}
                    >
                      {report.status === 'pending' ||
                      report.status === 'reviewing'
                        ? 'Xử lý'
                        : 'Xem chi tiết'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 ? (
        <nav
          aria-label="Phân trang báo cáo"
          className="flex items-center justify-between border-t border-zinc-100 px-5 py-3"
        >
          <p className="text-xs text-zinc-500">
            Trang {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPage(page + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
