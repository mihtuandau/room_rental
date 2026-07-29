"use client";

import {
  ArrowRight,
  ClipboardCheck,
  FileWarning,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import {
  AdminMetricCard,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminDashboardSummary,
  usePendingAdminReports,
  usePendingAdminRooms,
} from "@/features/admin/hooks";

const REPORT_REASON_LABELS = {
  fake_listing: "Tin giả",
  wrong_info: "Sai thông tin",
  scam: "Nghi ngờ lừa đảo",
  already_rented: "Phòng đã cho thuê",
  other: "Báo cáo khác",
} as const;

export function AdminDashboardView() {
  const summary = useAdminDashboardSummary();
  const rooms = usePendingAdminRooms();
  const reports = usePendingAdminReports();
  const hasError = summary.isError || rooms.isError || reports.isError;

  if (summary.isPending || rooms.isPending || reports.isPending)
    return <DashboardSkeleton />;
  if (hasError) {
    return (
      <ErrorState
        onRetry={() =>
          void Promise.all([
            summary.refetch(),
            rooms.refetch(),
            reports.refetch(),
          ])
        }
      />
    );
  }

  const data = summary.data;
  if (!data) return null;
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi các mục cần được xử lý trong hôm nay."
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <AdminMetricCard
          icon={UsersRound}
          label="Người dùng mới hôm nay"
          value={data.newUsersToday.toLocaleString("vi-VN")}
          detail="Trong ngày hiện tại"
          tone="brand"
        />
        <AdminMetricCard
          icon={ClipboardCheck}
          label="Tin đăng chờ duyệt"
          value={data.pendingRooms.toLocaleString("vi-VN")}
          detail="Cần kiểm tra nội dung"
          tone="warning"
        />
        <AdminMetricCard
          className="col-span-2 sm:col-span-1"
          icon={FileWarning}
          label="Báo cáo chờ xử lý"
          value={data.pendingReports.toLocaleString("vi-VN")}
          detail="Cần phản hồi người dùng"
          tone="danger"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <WorkloadChart
          newUsers={data.newUsersToday}
          pendingReports={data.pendingReports}
          pendingRooms={data.pendingRooms}
        />
        <PriorityQueue
          pendingReports={data.pendingReports}
          pendingRooms={data.pendingRooms}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Tin đăng chờ duyệt
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Các tin đăng gửi sớm nhất được ưu tiên hiển thị.
              </p>
            </div>
            <span className="rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-600">
              {data.pendingRooms} chờ duyệt
            </span>
          </div>
          {rooms.data?.rooms.length ? (
            <div className="divide-y divide-zinc-100">
              {rooms.data.rooms.map((room) => (
                <article
                  key={room.id}
                  className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {room.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {room.owner.fullName || "Chủ trọ chưa cập nhật tên"} ·{" "}
                      {room.district}, {room.city}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatPrice(room.price)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-zinc-600">
              Không có tin đăng nào chờ duyệt.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Báo cáo mới</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ưu tiên rà soát các phản ánh của người thuê.
            </p>
          </div>
          {reports.data?.reports.length ? (
            reports.data.reports.map((report) => (
              <article
                key={report.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {REPORT_REASON_LABELS[report.reason]}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {report.room.title}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-danger-50 px-2 py-1 text-[10px] font-semibold text-danger-600">
                    Mới
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
                  {report.description ||
                    "Người thuê chưa thêm nội dung báo cáo."}
                </p>
                <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  Báo cáo bởi: {report.reporter.fullName || "Người thuê"}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600">
              Không có báo cáo nào chờ xử lý.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function WorkloadChart({
  newUsers,
  pendingReports,
  pendingRooms,
}: {
  newUsers: number;
  pendingReports: number;
  pendingRooms: number;
}) {
  const values = [
    { label: "Tin chờ duyệt", value: pendingRooms },
    { label: "Báo cáo mới", value: pendingReports },
    { label: "Người dùng mới", value: newUsers },
  ];

  return (
    <article className="hidden rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 md:block">
      <h2 className="text-lg font-semibold text-zinc-900">
        Khối lượng cần theo dõi
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        So sánh số liệu hiện tại giữa các nhóm vận hành.
      </p>
      <div
        className="mt-6 h-52"
        aria-label="Biểu đồ cột khối lượng cần theo dõi"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={values}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--color-zinc-200)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-zinc-500)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--color-zinc-500)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--color-zinc-100)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
              <Cell fill="var(--color-warning-600)" />
              <Cell fill="var(--color-danger-600)" />
              <Cell fill="var(--color-brand-600)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function PriorityQueue({
  pendingReports,
  pendingRooms,
}: {
  pendingReports: number;
  pendingRooms: number;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-zinc-900">Ưu tiên xử lý</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Đi thẳng tới các hàng đợi đang cần quản trị viên kiểm tra.
      </p>
      <div className="mt-5 space-y-3">
        <Link
          href="/admin/rooms/pending"
          className="group flex items-center gap-3 rounded-md border border-zinc-200 p-3 transition-colors hover:border-warning-300 hover:bg-warning-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning-50 text-warning-600">
            <ClipboardCheck className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-zinc-900">
              Duyệt tin đăng
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              {pendingRooms} tin đang chờ
            </span>
          </span>
          <ArrowRight
            className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
        <Link
          href="/admin/reports?status=pending"
          className="group flex items-center gap-3 rounded-md border border-zinc-200 p-3 transition-colors hover:border-danger-300 hover:bg-danger-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger-50 text-danger-600">
            <FileWarning className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-zinc-900">
              Xử lý báo cáo
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              {pendingReports} báo cáo đang chờ
            </span>
          </span>
          <ArrowRight
            className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-card">
      <p className="text-zinc-600">{item.name}</p>
      <p className="mt-1 font-semibold text-zinc-900">{item.value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className={
              index === 2
                ? "col-span-2 h-32 w-full rounded-lg sm:col-span-1"
                : "h-32 w-full rounded-lg"
            }
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
