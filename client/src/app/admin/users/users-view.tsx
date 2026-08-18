'use client';

import { useState, type FormEvent } from 'react';
import { useQueryStates } from 'nuqs';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { PermissionDeniedState } from '@/components/ui/states';
import { isForbiddenError } from '@/lib/api-client';
import type { AdminUser } from '@/features/admin/api';
import {
  useAdminUsers,
  useBanAdminUser,
  useExportAdminUsers,
  useUnbanAdminUser,
} from '@/features/admin/hooks';
import { BanUserDialog } from './_components/ban-user-dialog';
import { UsersSkeleton } from './_components/users-skeleton';
import { UsersStats } from './_components/users-stats';
import { UsersTable } from './_components/users-table';
import { UsersToolbar } from './_components/users-toolbar';
import {
  downloadUsersCsv,
  PAGE_SIZE,
  userParsers,
} from './_lib/users-view-config';

export function AdminUsersView() {
  const [state, setState] = useQueryStates(userParsers, {
    history: 'push',
    shallow: true,
  });
  const [keywordInput, setKeywordInput] = useState(state.keyword);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const filters = {
    keyword: state.keyword || undefined,
    role: state.role ?? undefined,
    listing: state.listing ?? undefined,
    status: state.status ?? undefined,
  };
  const users = useAdminUsers({
    ...filters,
    page: state.page,
    pageSize: PAGE_SIZE,
  });
  const ban = useBanAdminUser();
  const unban = useUnbanAdminUser();
  const exportUsers = useExportAdminUsers();

  const applyKeyword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void setState({ keyword: keywordInput.trim(), page: 1 });
  };

  const setFilter = (key: 'role' | 'listing' | 'status', value: string) => {
    void setState({ [key]: value === 'all' ? null : value, page: 1 });
  };

  const clearFilters = () => {
    setKeywordInput('');
    void setState({
      keyword: '',
      role: null,
      listing: null,
      status: null,
      page: 1,
    });
  };

  const exportCsv = async () => {
    const result = await exportUsers.mutateAsync({
      ...filters,
      page: 1,
      pageSize: 10_000,
    });
    downloadUsersCsv(result.users);
    toast.success(
      result.truncated
        ? 'Đã xuất 10.000 tài khoản đầu tiên.'
        : `Đã xuất ${result.total} tài khoản.`,
    );
  };

  if (users.isPending && !users.data) return <UsersSkeleton />;
  if (users.isError) {
    if (isForbiddenError(users.error)) return <PermissionDeniedState />;
    return <ErrorState onRetry={() => void users.refetch()} />;
  }
  if (!users.data) return null;

  const { data } = users;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasFilters = Boolean(
    state.keyword || state.role || state.listing || state.status,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Người dùng"
        description="Quản lý tài khoản, trạng thái xác minh và quyền truy cập nền tảng."
        action={
          <Button
            variant="outline"
            onClick={() => void exportCsv()}
            disabled={exportUsers.isPending || data.total === 0}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportUsers.isPending ? 'Đang xuất…' : 'Xuất CSV'}
          </Button>
        }
      />

      <UsersStats total={data.total} summary={data.summary} />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <UsersToolbar
          keywordInput={keywordInput}
          role={state.role}
          listing={state.listing}
          status={state.status}
          hasFilters={hasFilters}
          isUpdating={users.isPlaceholderData}
          onKeywordInput={setKeywordInput}
          onSubmit={applyKeyword}
          onFilter={setFilter}
          onClear={clearFilters}
        />
        <UsersTable
          users={data.users}
          page={data.page}
          total={data.total}
          totalPages={totalPages}
          hasFilters={hasFilters}
          isUpdating={users.isPlaceholderData}
          isUnbanning={unban.isPending}
          onClearFilters={clearFilters}
          onBan={setSelectedUser}
          onUnban={(userId) => void unban.mutateAsync(userId)}
          onPage={(page) => void setState({ page })}
        />
      </section>

      <BanUserDialog
        user={selectedUser}
        isPending={ban.isPending}
        onClose={() => setSelectedUser(null)}
        onConfirm={(user) => {
          void ban.mutateAsync(user.id).then(() => setSelectedUser(null));
        }}
      />
    </div>
  );
}
