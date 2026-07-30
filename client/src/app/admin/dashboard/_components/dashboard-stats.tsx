import { ClipboardCheck, FileWarning, UsersRound } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/admin-page';

export function DashboardStats({
  newUsers,
  pendingRooms,
  pendingReports,
}: {
  newUsers: number;
  pendingRooms: number;
  pendingReports: number;
}) {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      <AdminMetricCard
        icon={UsersRound}
        label="Người dùng mới hôm nay"
        value={newUsers.toLocaleString('vi-VN')}
        detail="Trong ngày hiện tại"
        tone="brand"
      />
      <AdminMetricCard
        icon={ClipboardCheck}
        label="Tin đăng chờ duyệt"
        value={pendingRooms.toLocaleString('vi-VN')}
        detail="Cần kiểm tra nội dung"
        tone="warning"
      />
      <AdminMetricCard
        className="col-span-2 sm:col-span-1"
        icon={FileWarning}
        label="Báo cáo chờ xử lý"
        value={pendingReports.toLocaleString('vi-VN')}
        detail="Cần phản hồi người dùng"
        tone="danger"
      />
    </section>
  );
}
