import { BadgeCheck, CircleAlert, ShieldCheck } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/admin-page';
import type { AdminPendingRoom } from '@/features/admin/api';

export function PendingStats({
  total,
  rooms,
}: {
  total: number;
  rooms: AdminPendingRoom[];
}) {
  const verified = rooms.filter((room) => room.isVerified).length;

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-[1fr_1fr_1fr_1.35fr]">
      <AdminMetricCard
        icon={CircleAlert}
        label="Chờ duyệt"
        value={total.toLocaleString('vi-VN')}
        detail="Theo bộ lọc hiện tại"
        tone="warning"
      />
      <AdminMetricCard
        icon={BadgeCheck}
        label="Đã xác minh"
        value={verified.toLocaleString('vi-VN')}
        detail="Trên trang đang xem"
        tone="brand"
      />
      <AdminMetricCard
        icon={ShieldCheck}
        label="Cần kiểm tra"
        value={(rooms.length - verified).toLocaleString('vi-VN')}
        detail="Chưa có nhãn xác minh"
        tone="danger"
      />
      <article className="min-h-32 rounded-lg border border-brand-100 bg-brand-50/60 p-4 sm:p-5">
        <p className="text-sm font-semibold text-zinc-900">Lưu ý khi duyệt</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Đối chiếu ảnh, giá, vị trí và thông tin liên hệ. Lý do từ chối sẽ
          được gửi đến chủ trọ.
        </p>
      </article>
    </section>
  );
}
