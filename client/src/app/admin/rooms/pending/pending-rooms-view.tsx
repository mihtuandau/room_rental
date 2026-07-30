'use client';

import { useState, type FormEvent } from 'react';
import { useQueryStates } from 'nuqs';
import { CircleAlert } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/states';
import type { AdminPendingRoom } from '@/features/admin/api';
import {
  useAdminPendingRooms,
  useApproveAdminRoom,
  useRejectAdminRoom,
  useSetAdminRoomVerified,
} from '@/features/admin/hooks';
import { PendingSkeleton } from './_components/pending-skeleton';
import { PendingStats } from './_components/pending-stats';
import { PendingTable } from './_components/pending-table';
import { PendingToolbar } from './_components/pending-toolbar';
import {
  ApproveRoomDialog,
  RejectRoomDialog,
} from './_components/review-decision-dialogs';
import { ReviewDialog } from './_components/review-dialog';
import { PAGE_SIZE, pendingParsers } from './_lib/pending-config';

export function PendingRoomsView() {
  const [state, setState] = useQueryStates(pendingParsers, {
    history: 'push',
    shallow: true,
  });
  const [keywordInput, setKeywordInput] = useState(state.keyword);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<AdminPendingRoom | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<AdminPendingRoom | null>(null);
  const [note, setNote] = useState('');
  const rooms = useAdminPendingRooms({
    keyword: state.keyword || undefined,
    verified: state.verified ?? undefined,
    page: state.page,
    pageSize: PAGE_SIZE,
  });
  const approve = useApproveAdminRoom();
  const reject = useRejectAdminRoom();
  const verified = useSetAdminRoomVerified();
  const hasFilters = Boolean(state.keyword || state.verified);

  const clearFilters = () => {
    setKeywordInput('');
    void setState({ keyword: '', verified: null, page: 1 });
  };
  const openReject = (room: AdminPendingRoom) => {
    setRejectTarget(room);
    setNote('');
  };
  const approveRoom = () => {
    if (!approveTarget) return;
    void approve.mutateAsync(approveTarget.id).then(() => {
      setApproveTarget(null);
      setReviewId(null);
    });
  };
  const rejectRoom = () => {
    if (!rejectTarget || !note.trim()) return;
    void reject
      .mutateAsync({ roomId: rejectTarget.id, note: note.trim() })
      .then(() => {
        setRejectTarget(null);
        setNote('');
        setReviewId(null);
      });
  };

  if (rooms.isPending && !rooms.data) return <PendingSkeleton />;
  if (rooms.isError) return <ErrorState onRetry={() => void rooms.refetch()} />;
  if (!rooms.data) return null;

  const { data } = rooms;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Duyệt tin đăng"
        description="Kiểm tra thông tin, hình ảnh và lịch sử trước khi đưa tin lên hệ thống."
        action={
          <Badge variant="warning" className="w-fit px-3 py-1.5">
            <CircleAlert className="h-4 w-4" aria-hidden />
            {data.total.toLocaleString('vi-VN')} tin đang chờ
          </Badge>
        }
      />

      <PendingStats total={data.total} rooms={data.rooms} />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <PendingToolbar
          keyword={keywordInput}
          verified={state.verified}
          hasFilters={hasFilters}
          onKeyword={setKeywordInput}
          onVerified={(value) =>
            void setState({
              verified: value === 'all' ? null : value,
              page: 1,
            })
          }
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void setState({ keyword: keywordInput.trim(), page: 1 });
          }}
          onClear={clearFilters}
        />
        <PendingTable
          rooms={data.rooms}
          page={data.page}
          total={data.total}
          totalPages={totalPages}
          hasFilters={hasFilters}
          isUpdating={rooms.isPlaceholderData}
          onClear={clearFilters}
          onReview={(room) => setReviewId(room.id)}
          onApprove={setApproveTarget}
          onReject={openReject}
          onPage={(page) => void setState({ page })}
        />
      </section>

      <ReviewDialog
        roomId={reviewId}
        onClose={() => setReviewId(null)}
        onApprove={setApproveTarget}
        onReject={openReject}
        onToggleVerify={(room) =>
          void verified.mutateAsync({
            roomId: room.id,
            isVerified: !room.isVerified,
          })
        }
        isVerifying={verified.isPending}
      />
      <ApproveRoomDialog
        room={approveTarget}
        pending={approve.isPending}
        onClose={() => setApproveTarget(null)}
        onApprove={approveRoom}
      />
      <RejectRoomDialog
        room={rejectTarget}
        note={note}
        pending={reject.isPending}
        onNote={setNote}
        onClose={() => setRejectTarget(null)}
        onReject={rejectRoom}
      />
    </div>
  );
}
