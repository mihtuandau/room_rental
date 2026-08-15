'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import type { MyRoomItem } from '@/features/rooms/api';
import { useMyRooms } from '@/features/rooms/hooks';
import {
  ListingsToolbar,
  MyListingsTable,
} from './_components/my-listings-table';
import { MyListingsSkeleton } from './_components/my-listings-skeleton';

const PAGE_SIZE = 8;
const ALL_STATUS = '__all__';

export function MyListingsView() {
  const { data: rooms, isPending, isError, refetch } = useMyRooms();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);

  if (isPending) return <MyListingsSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (rooms.length === 0) {
    return (
      <EmptyState
        title="Bạn chưa đăng tin nào"
        description="Đăng tin cho thuê để tiếp cận hàng nghìn người thuê tiềm năng."
        action={{ label: 'Đăng tin ngay', href: '/manage/listings/new' }}
      />
    );
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filtered = rooms.filter(
    (room) =>
      room.title.toLowerCase().includes(normalizedKeyword) &&
      (statusFilter === ALL_STATUS || room.status === statusFilter),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRooms = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetPageAnd(action: () => void) {
    action();
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <ListingsStats rooms={rooms} />
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <ListingsToolbar
        keyword={keyword}
        status={statusFilter}
        allStatusValue={ALL_STATUS}
        onKeywordChange={(value) =>
          resetPageAnd(() => setKeyword(value))
        }
        onStatusChange={(value) =>
          resetPageAnd(() => setStatusFilter(value))
        }
      />
      {filtered.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tin đăng phù hợp"
          description="Thử đổi từ khoá hoặc bộ lọc trạng thái."
          className="py-12"
        />
      ) : (
        <>
          <MyListingsTable rooms={pagedRooms} />
          <ListingsPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
      </div>
    </div>
  );
}

function ListingsStats({ rooms }: { rooms: MyRoomItem[] }) {
  const items = [
    { label: 'Tổng tin đăng', value: rooms.length, icon: FileText, tone: 'bg-brand-50 text-brand-700' },
    { label: 'Đang hiển thị', value: rooms.filter((room) => room.status === 'active').length, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Chờ duyệt', value: rooms.filter((room) => room.status === 'pending').length, icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Bị từ chối', value: rooms.filter((room) => room.status === 'rejected').length, icon: XCircle, tone: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-4 lg:divide-x lg:divide-zinc-100">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-2 p-3 sm:gap-3 sm:p-5">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase leading-tight tracking-wide text-zinc-500 sm:text-xs">{label}</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900">{value.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListingsPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600">
      <p>
        Hiển thị {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, totalItems)} trong {totalItems} tin đăng
      </p>
      {totalPages > 1 ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
