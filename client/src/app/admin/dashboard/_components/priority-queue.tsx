import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ClipboardCheck,
  FileWarning,
} from 'lucide-react';

export function PriorityQueue({
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
        <QueueLink
          href="/admin/rooms/pending"
          label="Duyệt tin đăng"
          detail={`${pendingRooms} tin đang chờ`}
          tone="warning"
          icon={<ClipboardCheck className="h-5 w-5" aria-hidden />}
        />
        <QueueLink
          href="/admin/reports?status=pending"
          label="Xử lý báo cáo"
          detail={`${pendingReports} báo cáo đang chờ`}
          tone="danger"
          icon={<FileWarning className="h-5 w-5" aria-hidden />}
        />
      </div>
    </article>
  );
}

function QueueLink({
  href,
  label,
  detail,
  tone,
  icon,
}: {
  href: string;
  label: string;
  detail: string;
  tone: 'warning' | 'danger';
  icon: ReactNode;
}) {
  const toneClasses =
    tone === 'warning'
      ? 'hover:border-zinc-300 hover:bg-warning-50'
      : 'hover:border-zinc-300 hover:bg-danger-50';
  const iconClasses =
    tone === 'warning'
      ? 'bg-warning-50 text-warning-600'
      : 'bg-danger-50 text-danger-600';

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-md border border-zinc-200 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${toneClasses}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconClasses}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zinc-900">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{detail}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
