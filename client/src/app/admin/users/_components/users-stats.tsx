import {
  BadgeCheck,
  CircleAlert,
  ShieldAlert,
  UsersRound,
} from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/admin-page';
import type { AdminUsersSummary } from '@/features/admin/api';

export function UsersStats({
  total,
  summary,
}: {
  total: number;
  summary: AdminUsersSummary;
}) {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <AdminMetricCard
        label="Tổng kết quả"
        value={total.toLocaleString('vi-VN')}
        detail="Theo bộ lọc hiện tại"
        icon={UsersRound}
        tone="brand"
      />
      <AdminMetricCard
        label="Đang hoạt động"
        value={summary.active.toLocaleString('vi-VN')}
        detail="Theo từ khóa và vai trò"
        icon={BadgeCheck}
        tone="brand"
      />
      <AdminMetricCard
        label="Chưa xác minh"
        value={summary.unverified.toLocaleString('vi-VN')}
        detail="Trong nhóm đang xem"
        icon={CircleAlert}
        tone="warning"
      />
      <AdminMetricCard
        label="Tài khoản đã khóa"
        value={summary.banned.toLocaleString('vi-VN')}
        detail="Theo từ khóa và vai trò"
        icon={ShieldAlert}
        tone="danger"
      />
    </section>
  );
}
