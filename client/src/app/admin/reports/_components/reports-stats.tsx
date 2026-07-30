import { CircleAlert, FileWarning, ShieldAlert } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/admin-page';

export function ReportsStats({
  total,
  pending,
}: {
  total: number;
  pending: number;
}) {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <AdminMetricCard
        icon={FileWarning}
        label="Tổng báo cáo"
        value={total.toLocaleString('vi-VN')}
        detail="Theo bộ lọc hiện tại"
        tone="brand"
      />
      <AdminMetricCard
        icon={CircleAlert}
        label="Cần xử lý"
        value={pending.toLocaleString('vi-VN')}
        detail="Trên trang đang xem"
        tone="warning"
      />
      <article className="col-span-2 min-h-32 rounded-lg border border-danger-100 bg-danger-50/50 p-4 sm:p-5 md:col-span-1">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger-100 text-danger-600">
            <ShieldAlert className="h-5 w-5" aria-hidden />
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
  );
}
