'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useMyRooms } from '@/features/rooms/hooks';
import {
  ListingsToolbar,
  MyListingsTable,
} from './_components/my-listings-table';

const PAGE_SIZE = 8;
const ALL_STATUS = '__all__';

export function MyListingsView() {
  const { data: rooms, isPending, isError, refetch } = useMyRooms();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);

  if (isPending) return <Skeleton className="h-96 w-full rounded-xl" />;
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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
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
