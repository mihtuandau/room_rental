import type { FormEventHandler } from 'react';
import { FilterX, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LISTING_LABELS,
  LISTING_VALUES,
  ROLE_LABELS,
  ROLE_VALUES,
  STATUS_LABELS,
  STATUS_VALUES,
} from '../_lib/users-view-config';

interface UsersToolbarProps {
  keywordInput: string;
  role: string | null;
  listing: string | null;
  status: string | null;
  hasFilters: boolean;
  isUpdating: boolean;
  onKeywordInput: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onFilter: (key: 'role' | 'listing' | 'status', value: string) => void;
  onClear: () => void;
}

export function UsersToolbar({
  keywordInput,
  role,
  listing,
  status,
  hasFilters,
  isUpdating,
  onKeywordInput,
  onSubmit,
  onFilter,
  onClear,
}: UsersToolbarProps) {
  return (
    <div className="border-b border-zinc-100 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Danh sách tài khoản
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Tìm kiếm theo tên, số điện thoại hoặc email.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <FilterX className="h-4 w-4" aria-hidden />
              Xóa bộ lọc
            </Button>
          ) : null}
          {isUpdating ? (
            <span className="text-xs text-zinc-500">Đang cập nhật…</span>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_150px_190px_170px_auto]"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <Input
            value={keywordInput}
            onChange={(event) => onKeywordInput(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại hoặc email"
            aria-label="Tìm kiếm người dùng"
            className="pl-9"
          />
        </div>
        <Select
          value={role ?? 'all'}
          onValueChange={(value) => onFilter('role', value)}
        >
          <SelectTrigger aria-label="Lọc theo loại tài khoản">
            <SelectValue placeholder="Mọi tài khoản" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi tài khoản</SelectItem>
            {ROLE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={listing ?? 'all'}
          onValueChange={(value) => onFilter('listing', value)}
        >
          <SelectTrigger aria-label="Lọc theo hoạt động đăng tin">
            <SelectValue placeholder="Mọi hoạt động đăng tin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi hoạt động đăng tin</SelectItem>
            {LISTING_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {LISTING_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status ?? 'all'}
          onValueChange={(value) => onFilter('status', value)}
        >
          <SelectTrigger aria-label="Lọc theo trạng thái">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Tìm</Button>
      </form>
    </div>
  );
}
