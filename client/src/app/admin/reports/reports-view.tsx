"use client";

import { useState } from "react";
import { parseAsInteger, parseAsStringLiteral } from "nuqs/server";
import { useQueryStates } from "nuqs";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileWarning,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { AdminReport, AdminReportStatus } from "@/features/admin/api";
import { useAdminReports, useResolveAdminReport } from "@/features/admin/hooks";
import {
  AdminMetricCard,
  AdminPageHeader,
  adminStickyActionCellClassName,
  adminStickyActionHeadClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from "@/components/admin/admin-page";

const PAGE_SIZE = 15;
const STATUSES = ["pending", "reviewing", "resolved", "dismissed"] as const;
const statusLabels: Record<AdminReportStatus, string> = {
  pending: "Chờ xử lý",
  reviewing: "Đang xem xét",
  resolved: "Đã xử lý",
  dismissed: "Đã bỏ qua",
};
const reasonLabels: Record<AdminReport["reason"], string> = {
  fake_listing: "Tin giả",
  wrong_info: "Thông tin sai",
  scam: "Nghi ngờ lừa đảo",
  already_rented: "Phòng đã cho thuê",
  other: "Lý do khác",
};
const parsers = {
  status: parseAsStringLiteral(STATUSES),
  page: parseAsInteger.withDefault(1),
};
const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function AdminReportsView() {
  const [state, setState] = useQueryStates(parsers, {
    history: "push",
    shallow: true,
  });
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [note, setNote] = useState("");
  const reports = useAdminReports({
    status: state.status ?? undefined,
    page: state.page,
    pageSize: PAGE_SIZE,
  });
  const resolve = useResolveAdminReport();
  const submit = (status: "resolved" | "dismissed") => {
    if (!selected || !note.trim()) return;
    void resolve
      .mutateAsync({ id: selected.id, status, resolutionNote: note.trim() })
      .then(() => {
        setSelected(null);
        setNote("");
      });
  };
  if (reports.isPending && !reports.data) return <ReportsSkeleton />;
  if (reports.isError)
    return <ErrorState onRetry={() => void reports.refetch()} />;
  if (!reports.data) return null;
  const { data } = reports;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pending = data.reports.filter(
    (report) => report.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Báo cáo vi phạm"
        description="Theo dõi báo cáo từ người dùng và lưu lại hướng xử lý rõ ràng."
        action={
          <Badge variant="pending" className="w-fit px-3 py-1.5">
            <Flag className="h-4 w-4" />
            {data.total.toLocaleString("vi-VN")} báo cáo
          </Badge>
        }
      />
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <AdminMetricCard
          icon={FileWarning}
          label="Tổng báo cáo"
          value={data.total.toLocaleString("vi-VN")}
          detail="Theo bộ lọc hiện tại"
          tone="brand"
        />
        <AdminMetricCard
          icon={CircleAlert}
          label="Cần xử lý"
          value={pending.toLocaleString("vi-VN")}
          detail="Trên trang đang xem"
          tone="warning"
        />
        <article className="col-span-2 min-h-32 rounded-lg border border-danger-100 bg-danger-50/50 p-4 sm:p-5 md:col-span-1">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger-100 text-danger-600">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Ưu tiên an toàn
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Kiểm tra kỹ báo cáo lừa đảo trước khi đưa ra quyết định.
              </p>
            </div>
          </div>
        </article>
      </section>
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
            value={state.status ?? "all"}
            onValueChange={(value) =>
              void setState({
                status: value === "all" ? null : (value as AdminReportStatus),
                page: 1,
              })
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
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data.reports.length === 0 ? (
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
              <tbody
                className={reports.isPlaceholderData ? "opacity-60" : undefined}
              >
                {data.reports.map((report) => (
                  <tr key={report.id} className={adminTableRowClassName}>
                    <td className="px-5 py-4 text-zinc-600">
                      {date(report.createdAt)}
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
                        {reasonLabels[report.reason]}
                      </p>
                      <p className="mt-1 max-w-48 truncate text-xs text-zinc-500">
                        {report.description || "Không có mô tả thêm"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-zinc-800">
                        {report.reporter.fullName || "Người dùng ẩn danh"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {report.reporter.phone || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td
                      className={`${adminStickyActionCellClassName} px-5 py-4`}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(report);
                          setNote("");
                        }}
                      >
                        {report.status === "pending" ||
                        report.status === "reviewing"
                          ? "Xử lý"
                          : "Xem chi tiết"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.total > 0 && (
          <nav className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
            <p className="text-xs text-zinc-500">
              Trang {data.page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={data.page <= 1}
                onClick={() => void setState({ page: data.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={data.page >= totalPages}
                onClick={() => void setState({ page: data.page + 1 })}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        )}
      </section>
      <ReportDialog
        report={selected}
        note={note}
        setNote={setNote}
        loading={resolve.isPending}
        onClose={() => setSelected(null)}
        onSubmit={submit}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: AdminReportStatus }) {
  return (
    <Badge
      variant={
        status === "resolved"
          ? "verified"
          : status === "dismissed"
            ? "neutral"
            : status === "pending"
              ? "pending"
              : "warning"
      }
    >
      {statusLabels[status]}
    </Badge>
  );
}
function ReportDialog({
  report,
  note,
  setNote,
  loading,
  onClose,
  onSubmit,
}: {
  report: AdminReport | null;
  note: string;
  setNote: (note: string) => void;
  loading: boolean;
  onClose: () => void;
  onSubmit: (status: "resolved" | "dismissed") => void;
}) {
  const open = !!report;
  const actionable =
    report?.status === "pending" || report?.status === "reviewing";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !value && !loading && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {report && (
            <div className="space-y-4">
              <div className="rounded-md bg-zinc-50 p-4">
                <p className="font-medium text-zinc-900">{report.room.title}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {reasonLabels[report.reason]}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  {report.description ||
                    "Người dùng không cung cấp mô tả bổ sung."}
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
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ghi lại kết quả kiểm tra hoặc lý do bỏ qua…"
                  />
                </div>
              ) : (
                <div className="rounded-md border border-zinc-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-800">
                      Kết quả xử lý
                    </p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                    {report.resolutionNote || "Không có ghi chú xử lý."}
                  </p>
                  {report.resolvedAt ? (
                    <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                      {report.resolvedBy?.fullName || "Quản trị viên"} ·{" "}
                      {date(report.resolvedAt)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </DialogBody>
        {actionable && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="danger"
              disabled={!note.trim() || loading}
              onClick={() => onSubmit("dismissed")}
            >
              Bỏ qua
            </Button>
            <Button
              disabled={!note.trim() || loading}
              onClick={() => onSubmit("resolved")}
            >
              {loading ? "Đang lưu…" : "Đã xử lý"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-80" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={
              index === 2 ? "col-span-2 h-32 md:col-span-1" : "h-32"
            }
          />
        ))}
      </div>
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
