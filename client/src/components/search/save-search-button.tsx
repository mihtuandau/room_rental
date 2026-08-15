'use client';

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { SearchState } from '@/features/rooms/search-params';
import { useCreateSavedSearch } from '@/features/saved-searches/hooks';
import { useIsSignedIn } from '@/stores/auth-store';

function toSavedSearchInput(state: SearchState) {
  return {
    city: state.city || undefined,
    provinceCode: state.provinceCode ?? undefined,
    district: state.district || undefined,
    ward: state.ward || undefined,
    wardCode: state.wardCode ?? undefined,
    roomType: state.roomType ?? undefined,
    priceMin: state.priceMin ?? undefined,
    priceMax: state.priceMax ?? undefined,
    areaMin: state.areaMin ?? undefined,
    areaMax: state.areaMax ?? undefined,
  };
}

export function hasSavedSearchCriteria(state: SearchState) {
  return Boolean(
    state.city ||
      state.provinceCode !== null ||
      state.district ||
      state.ward ||
      state.wardCode !== null ||
      state.roomType ||
      state.priceMin !== null ||
      state.priceMax !== null ||
      state.areaMin !== null ||
      state.areaMax !== null,
  );
}

export function SaveSearchButton({
  state,
  className,
}: {
  state: SearchState;
  className?: string;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const createSavedSearch = useCreateSavedSearch();

  const handleSave = () => {
    if (!isSignedIn) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    createSavedSearch.mutate(toSavedSearchInput(state), {
      onSuccess: () =>
        toast.success('Đã lưu tìm kiếm. Có tin mới phù hợp sẽ báo cho bạn.'),
      onError: () => toast.error('Không lưu được, thử lại nhé.'),
    });
  };

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleSave}
      disabled={createSavedSearch.isPending}
    >
      <Bookmark className="h-4 w-4" aria-hidden />
      {createSavedSearch.isPending ? 'Đang lưu…' : 'Lưu tìm kiếm này'}
    </Button>
  );
}
