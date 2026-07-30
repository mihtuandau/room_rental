'use client';

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  LockKeyhole,
  UnlockKeyhole,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  adminStickyActionCellClassName,
  adminStickyActionHeadClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from '@/components/admin/admin-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import type { AdminUser } from '@/features/admin/api';
import { formatDate, ROLE_LABELS } from '../_lib/users-view-config';

interface UsersTableProps {
  users: AdminUser[];
  page: number;
  total: number;
  totalPages: number;
  hasFilters: boolean;
  isUpdating: boolean;
  isUnbanning: boolean;
  onClearFilters: () => void;
  onBan: (user: AdminUser) => void;
  onUnban: (userId: string) => void;
  onPage: (page: number) => void;
}

export function UsersTable({
  users,
  page,
  total,
  totalPages,
  hasFilters,
  isUpdating,
  isUnbanning,
  onClearFilters,
  onBan,
  onUnban,
  onPage,
}: UsersTableProps) {
  return (
    <>
      {users.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="h-10 w-10" />}
          title="Không tìm thấy tài khoản phù hợp"
          description="Thử thay đổi từ khóa hoặc xóa bớt điều kiện lọc."
          action={
            hasFilters
              ? { label: 'Xóa bộ lọc', onClick: onClearFilters }
              : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <p className="px-4 pb-2 text-xs text-zinc-500 md:hidden">
            Vuốt ngang để xem đầy đủ thông tin.
          </p>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className={adminTableHeadClassName}>
              <tr>
                <th className="hidden px-4 py-3 lg:table-cell">
                  Mã người dùng
                </th>
                <th className="px-4 py-3 sm:px-5">Thông tin người dùng</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Tài khoản & tin đăng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tham gia</th>
                <th
                  className={`${adminStickyActionHeadClassName} px-4 py-3 sm:px-5`}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className={isUpdating ? 'opacity-60' : undefined}>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onBan={() => onBan(user)}
                  onUnban={() => onUnban(user.id)}
                  isUnbanning={isUnbanning}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 ? (
        <Pagination page={page} totalPages={totalPages} onPage={onPage} />
      ) : null}
    </>
  );
}

function UserRow({
  user,
  onBan,
  onUnban,
  isUnbanning,
}: {
  user: AdminUser;
  onBan: () => void;
  onUnban: () => void;
  isUnbanning: boolean;
}) {
  return (
    <tr className={adminTableRowClassName}>
      <td className="hidden px-4 py-4 lg:table-cell">
        <div className="flex items-center gap-2">
          <code className="text-xs text-zinc-600" title={user.id}>
            …{user.id.slice(-6)}
          </code>
          <button
            type="button"
            aria-label={`Sao chép mã người dùng của ${user.fullName || 'tài khoản này'}`}
            title="Sao chép mã đầy đủ"
            onClick={() => void copyUserId(user.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </td>
      <td className="px-4 py-4 sm:px-5">
        <p className="font-medium text-zinc-900">
          {user.fullName || 'Chưa cập nhật tên'}
        </p>
      </td>
      <td className="px-4 py-4 text-zinc-600">
        {user.phone || 'Chưa có số điện thoại'}
      </td>
      <td className="px-4 py-4">
        <AccountActivity user={user} />
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1.5">
          {user.deletedAt ? (
            <Badge variant="danger">Đã khóa</Badge>
          ) : (
            <Badge variant="verified">Đang hoạt động</Badge>
          )}
          <p
            className={
              user.isPhoneVerified
                ? 'flex items-center gap-1 text-xs text-brand-700'
                : 'flex items-center gap-1 text-xs text-zinc-500'
            }
          >
            <span
              className={
                user.isPhoneVerified
                  ? 'h-1.5 w-1.5 rounded-full bg-brand-600'
                  : 'h-1.5 w-1.5 rounded-full bg-zinc-400'
              }
            />
            {user.isPhoneVerified ? 'Đã xác minh' : 'Chưa xác minh'}
          </p>
        </div>
      </td>
      <td className="px-4 py-4 text-zinc-600">
        {formatDate(user.createdAt)}
      </td>
      <td className={`${adminStickyActionCellClassName} px-4 py-4 sm:px-5`}>
        {user.role === 'admin' ? (
          <span className="text-xs text-zinc-400">Tài khoản quản trị</span>
        ) : user.deletedAt ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isUnbanning}
            onClick={onUnban}
          >
            <UnlockKeyhole className="h-4 w-4" aria-hidden />
            {isUnbanning ? 'Đang mở khóa…' : 'Mở khóa'}
          </Button>
        ) : (
          <Button variant="danger" size="sm" onClick={onBan}>
            <LockKeyhole className="h-4 w-4" aria-hidden />
            Khóa
          </Button>
        )}
      </td>
    </tr>
  );
}

function AccountActivity({ user }: { user: AdminUser }) {
  return (
    <div className="space-y-1.5">
      <Badge variant={user.role === 'admin' ? 'verified' : 'neutral'}>
        {ROLE_LABELS[user.role]}
      </Badge>
      {user.role === 'user' ? (
        <p className="text-xs text-zinc-500">
          {user.hasActiveListing
            ? 'Có tin đang hoạt động'
            : user.listingCount > 0
              ? `${user.listingCount.toLocaleString('vi-VN')} tin đăng`
              : 'Chưa có tin đăng'}
        </p>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Phân trang người dùng"
      className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 sm:px-5"
    >
      <p className="text-xs text-zinc-500">
        Trang {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Trang trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Trang sau
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

async function copyUserId(userId: string) {
  try {
    await navigator.clipboard.writeText(userId);
    toast.success('Đã sao chép mã người dùng.');
  } catch {
    toast.error('Không thể sao chép mã. Hãy thử lại.');
  }
}
