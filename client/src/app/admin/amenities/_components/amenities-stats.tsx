import { BarChart3, Power, Tags } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/admin-page';

export function AmenitiesStats({
  total,
  active,
  used,
}: {
  total: number;
  active: number;
  used: number;
}) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <AdminMetricCard
        label="Tổng tiện ích"
        value={total.toLocaleString('vi-VN')}
        detail="Trong catalogue"
        icon={Tags}
        tone="brand"
      />
      <AdminMetricCard
        label="Đang hoạt động"
        value={active.toLocaleString('vi-VN')}
        detail={`${total - active} tiện ích đã tắt`}
        icon={Power}
        tone="brand"
      />
      <AdminMetricCard
        className="col-span-2 sm:col-span-1"
        label="Lượt gắn tin"
        value={used.toLocaleString('vi-VN')}
        detail="Trên tất cả tin đăng"
        icon={BarChart3}
        tone="neutral"
      />
    </section>
  );
}
