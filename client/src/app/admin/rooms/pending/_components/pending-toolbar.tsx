import type { FormEventHandler } from 'react';
import { FilterX, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminRoomQueueStatus } from '@/features/admin/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PendingToolbar({
  keyword,
  status,
  verified,
  hasFilters,
  onKeyword,
  onStatus,
  onVerified,
  onSubmit,
  onClear,
}: {
  keyword: string;
  status: AdminRoomQueueStatus;
  verified: string | null;
  hasFilters: boolean;
  onKeyword: (value: string) => void;
  onStatus: (value: AdminRoomQueueStatus) => void;
  onVerified: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClear: () => void;
}) {
  return (
    <div className="border-b border-zinc-100 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Hàng đợi cần xử lý
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Tin gửi sớm nhất được ưu tiên hiển thị trước.
          </p>
        </div>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <FilterX className="h-4 w-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        ) : null}
      </div>
      <form
        onSubmit={onSubmit}
        className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <Input
            value={keyword}
            onChange={(event) => onKeyword(event.target.value)}
            className="pl-9"
            placeholder="Tìm theo tin, khu vực hoặc chủ trọ"
            aria-label="Tìm kiếm tin chờ duyệt"
          />
        </div>
        <Select value={status} onValueChange={(value) => onStatus(value as AdminRoomQueueStatus)}>
          <SelectTrigger aria-label="Lọc theo trạng thái tin đăng">
            <SelectValue placeholder="Trạng thái tin đăng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="active">Đang hiển thị</SelectItem>
            <SelectItem value="hidden">Đã ẩn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verified ?? 'all'} onValueChange={onVerified}>
          <SelectTrigger aria-label="Lọc theo trạng thái xác minh">
            <SelectValue placeholder="Trạng thái xác minh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả xác minh</SelectItem>
            <SelectItem value="verified">Đã xác minh</SelectItem>
            <SelectItem value="unverified">Chưa xác minh</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">Lọc danh sách</Button>
      </form>
    </div>
  );
}
