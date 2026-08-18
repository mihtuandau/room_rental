'use client';

import { useState, type FormEvent } from 'react';
import { useQueryStates } from 'nuqs';
import { CircleAlert } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page';
import { Badge } from '@/components/ui/badge';
import { ErrorState, PermissionDeniedState } from '@/components/ui/states';
import { isForbiddenError } from '@/lib/api-client';
import type { AdminPendingRoom, AdminRoomQueueStatus } from '@/features/admin/api';
import {
  useAdminPendingRooms,
  useApproveAdminRoom,
  useHideAdminRoom,
  useRejectAdminRoom,
  useRestoreAdminRoom,
  useSetAdminRoomVerified,
} from '@/features/admin/hooks';
import { PendingSkeleton } from './_components/pending-skeleton';
import { PendingStats } from './_components/pending-stats';
import { PendingTable } from './_components/pending-table';
import { PendingToolbar } from './_components/pending-toolbar';
import {
  ApproveRoomDialog,
  HideRoomDialog,
  RejectRoomDialog,
  RestoreRoomDialog,
} from './_components/review-decision-dialogs';
import { ReviewDialog } from './_components/review-dialog';
import {
  PAGE_SIZE,
  pendingParsers,
  ROOM_QUEUE_STATUS_LABELS,
} from './_lib/pending-config';

const QUEUE_STATUSES: AdminRoomQueueStatus[] = ['pending', 'active', 'hidden'];

export function PendingRoomsView() {
  const [state, setState] = useQueryStates(pendingParsers, {
    history: 'push',
    shallow: true,
  });
  const [keywordInput, setKeywordInput] = useState(state.keyword);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminPendingRoom | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminPendingRoom | null>(null);
  const [hideTarget, setHideTarget] = useState<AdminPendingRoom | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminPendingRoom | null>(null);
  const [note, setNote] = useState('');
  const queueStatus = QUEUE_STATUSES.includes(state.status as AdminRoomQueueStatus)
    ? (state.status as AdminRoomQueueStatus)
    : 'pending';
  const rooms = useAdminPendingRooms({
    keyword: state.keyword || undefined,
    verified: state.verified ?? undefined,
    status: queueStatus,
    page: state.page,
    pageSize: PAGE_SIZE,
  });
  const approve = useApproveAdminRoom();
  const reject = useRejectAdminRoom();
  const hide = useHideAdminRoom();
  const restore = useRestoreAdminRoom();
  const verified = useSetAdminRoomVerified();
  const hasFilters = Boolean(state.keyword || state.verified || queueStatus !== 'pending');

  const clearFilters = () => {
    setKeywordInput('');
    void setState({ keyword: '', verified: null, status: 'pending', page: 1 });
  };
  const openReject = (room: AdminPendingRoom) => {
    setRejectTarget(room);
    setNote('');
  };
  const openHide = (room: AdminPendingRoom) => {
    setHideTarget(room);
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
    void reject.mutateAsync({ roomId: rejectTarget.id, note: note.trim() }).then(() => {
      setRejectTarget(null);
      setNote('');
      setReviewId(null);
    });
  };
  const hideRoom = () => {
    if (!hideTarget) return;
    void hide.mutateAsync({ roomId: hideTarget.id, note: note.trim() || undefined }).then(() => {
      setHideTarget(null);
      setNote('');
      setReviewId(null);
    });
  };
  const restoreRoom = () => {
    if (!restoreTarget) return;
    void restore.mutateAsync(restoreTarget.id).then(() => {
      setRestoreTarget(null);
      setReviewId(null);
    });
  };

  if (rooms.isPending && !rooms.data) return <PendingSkeleton />;
  if (rooms.isError) {
    if (isForbiddenError(rooms.error)) return <PermissionDeniedState />;
    return <ErrorState onRetry={() => void rooms.refetch()} />;
  }
  if (!rooms.data) return null;

  const { data } = rooms;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý tin đăng"
        description="Kiểm tra, duyệt và kiểm soát khả năng hiển thị của tin đăng trên hệ thống."
        action={
          <Badge variant={queueStatus === 'pending' ? 'warning' : 'neutral'} className="w-fit px-3 py-1.5">
            <CircleAlert className="h-4 w-4" aria-hidden />
            {data.total.toLocaleString('vi-VN')} {ROOM_QUEUE_STATUS_LABELS[queueStatus].toLowerCase()}
          </Badge>
        }
      />

      <PendingStats total={data.total} rooms={data.rooms} />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <PendingToolbar
          keyword={keywordInput}
          status={queueStatus}
          verified={state.verified}
          hasFilters={hasFilters}
          onKeyword={setKeywordInput}
          onStatus={(value) => void setState({ status: value, page: 1 })}
          onVerified={(value) => void setState({ verified: value === 'all' ? null : value, page: 1 })}
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
          onHide={openHide}
          onRestore={setRestoreTarget}
          onPage={(page) => void setState({ page })}
        />
      </section>

      <ReviewDialog
        roomId={reviewId}
        onClose={() => setReviewId(null)}
        onApprove={setApproveTarget}
        onReject={openReject}
        onHide={openHide}
        onRestore={setRestoreTarget}
        onToggleVerify={(room) => void verified.mutateAsync({ roomId: room.id, isVerified: !room.isVerified })}
        isVerifying={verified.isPending}
      />
      <ApproveRoomDialog room={approveTarget} pending={approve.isPending} onClose={() => setApproveTarget(null)} onApprove={approveRoom} />
      <RejectRoomDialog room={rejectTarget} note={note} pending={reject.isPending} onNote={setNote} onClose={() => setRejectTarget(null)} onReject={rejectRoom} />
      <HideRoomDialog room={hideTarget} note={note} pending={hide.isPending} onNote={setNote} onClose={() => setHideTarget(null)} onHide={hideRoom} />
      <RestoreRoomDialog room={restoreTarget} pending={restore.isPending} onClose={() => setRestoreTarget(null)} onRestore={restoreRoom} />
    </div>
  );
}
