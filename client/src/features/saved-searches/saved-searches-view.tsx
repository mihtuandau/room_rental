'use client';

import { Bell, BellOff, Bookmark, LoaderCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import {
  useDeleteSavedSearch,
  useSavedSearches,
  useUpdateSavedSearch,
} from './hooks';
import type { SavedSearch } from './api';

function criteriaLabel(search: SavedSearch) {
  const location = [search.ward, search.district, search.city].filter(Boolean).join(', ');
  const parts = [
    location || 'Mọi khu vực',
    search.roomType ? ROOM_TYPE_LABELS[search.roomType] : null,
    search.priceMin != null || search.priceMax != null
      ? `${search.priceMin?.toLocaleString('vi-VN') ?? '0'} – ${search.priceMax?.toLocaleString('vi-VN') ?? 'không giới hạn'} đ`
      : null,
    search.areaMin != null || search.areaMax != null
      ? `${search.areaMin ?? 0} – ${search.areaMax ?? 'không giới hạn'} m²`
      : null,
  ].filter(Boolean);

  return parts;
}

function SavedSearchCard({ search }: { search: SavedSearch }) {
  const update = useUpdateSavedSearch();
  const remove = useDeleteSavedSearch();

  const toggleNotifications = () => {
    update.mutate(
      { id: search.id, notificationsEnabled: !search.notificationsEnabled },
      {
        onSuccess: () =>
          toast.success(
            search.notificationsEnabled
              ? 'Đã tắt thông báo cho tìm kiếm này.'
              : 'Đã bật thông báo cho tìm kiếm này.',
          ),
        onError: () => toast.error('Không cập nhật được trạng thái thông báo.'),
      },
    );
  };

  const deleteSearch = () => {
    if (!window.confirm('Bạn có chắc muốn xoá tìm kiếm đã lưu này không?')) return;
    remove.mutate(search.id, {
      onSuccess: () => toast.success('Đã xoá tìm kiếm đã lưu.'),
      onError: () => toast.error('Không xoá được tìm kiếm, thử lại nhé.'),
    });
  };

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Bookmark className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="font-semibold text-zinc-900">Điều kiện tìm kiếm</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {criteriaLabel(search).map((criteria) => (
              <span key={criteria} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                {criteria}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            {search.lastNotifiedAt
              ? `Thông báo gần nhất: ${new Date(search.lastNotifiedAt).toLocaleDateString('vi-VN')}`
              : 'Chưa có thông báo mới'}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={search.notificationsEnabled}
            onClick={toggleNotifications}
            disabled={update.isPending}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-wait disabled:opacity-60"
          >
            {update.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : search.notificationsEnabled ? (
              <Bell className="h-4 w-4 text-brand-600" aria-hidden />
            ) : (
              <BellOff className="h-4 w-4 text-zinc-400" aria-hidden />
            )}
            {search.notificationsEnabled ? 'Đang bật' : 'Đã tắt'}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deleteSearch}
            disabled={remove.isPending}
            aria-label="Xoá tìm kiếm đã lưu"
          >
            <Trash2 className="h-4 w-4 text-danger-600" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function SavedSearchesView() {
  const { data, isPending, isError, refetch } = useSavedSearches();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!data?.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <Bookmark className="mx-auto h-8 w-8 text-zinc-400" aria-hidden />
        <h2 className="mt-3 font-semibold text-zinc-900">Chưa có tìm kiếm đã lưu</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Lưu một bộ lọc tìm phòng để nhận thông báo khi có tin phù hợp.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((search) => <SavedSearchCard key={search.id} search={search} />)}
    </div>
  );
}
