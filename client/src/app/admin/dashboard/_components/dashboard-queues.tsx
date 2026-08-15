import { formatPrice } from '@/lib/utils';
import type { AdminPendingRoom, AdminReport } from '@/features/admin/api';
import Link from 'next/link';

const REPORT_REASON_LABELS: Record<AdminReport['reason'], string> = {
  fake_listing: 'Tin giả',
  wrong_info: 'Sai thông tin',
  scam: 'Nghi ngờ lừa đảo',
  already_rented: 'Phòng đã cho thuê',
  other: 'Báo cáo khác',
};

export function DashboardQueues({
  rooms,
  reports,
  pendingRoomCount,
}: {
  rooms: AdminPendingRoom[];
  reports: AdminReport[];
  pendingRoomCount: number;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <PendingRoomsCard rooms={rooms} total={pendingRoomCount} />
      <PendingReportsCard reports={reports} />
    </section>
  );
}

function PendingRoomsCard({
  rooms,
  total,
}: {
  rooms: AdminPendingRoom[];
  total: number;
}) {
  return (
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
          {total} chờ duyệt
        </span>
      </div>
      {rooms.length ? (
        <div className="divide-y divide-zinc-100">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href="/admin/rooms/pending"
              aria-label={`Mở hàng đợi duyệt tin: ${room.title}`}
              className="grid gap-2 px-4 py-4 transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {room.title}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {room.owner.fullName || 'Chủ trọ chưa cập nhật tên'} ·{' '}
                  {[room.ward, room.district, room.city].filter(Boolean).join(', ')}
                </p>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {formatPrice(room.price)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-zinc-600">
          Không có tin đăng nào chờ duyệt.
        </p>
      )}
    </div>
  );
}

function PendingReportsCard({ reports }: { reports: AdminReport[] }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Báo cáo mới</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Ưu tiên rà soát các phản ánh của người thuê.
        </p>
      </div>
      {reports.length ? (
        reports.map((report) => (
          <Link
            key={report.id}
            href="/admin/reports"
            aria-label={`Mở hàng đợi báo cáo: ${REPORT_REASON_LABELS[report.reason]}`}
            className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
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
              {report.description || 'Người thuê chưa thêm nội dung báo cáo.'}
            </p>
            <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
              Báo cáo bởi: {report.reporter.fullName || 'Người thuê'}
            </p>
          </Link>
        ))
      ) : (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600">
          Không có báo cáo nào chờ xử lý.
        </p>
      )}
    </div>
  );
}
