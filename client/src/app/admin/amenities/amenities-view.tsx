'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useQueryState } from 'nuqs';
import { parseAsString } from 'nuqs/server';
import { Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminAmenities,
  useCreateAdminAmenity,
  useDeleteAdminAmenity,
  useUpdateAdminAmenity,
} from '@/features/admin/hooks';
import type { Amenity } from '@/features/amenities/api';
import type { AmenityType } from '@/lib/constants';
import { AmenitiesGuidance } from './_components/amenities-guidance';
import { AmenitiesStats } from './_components/amenities-stats';
import { AmenitiesTable } from './_components/amenities-table';
import { AmenitiesToolbar } from './_components/amenities-toolbar';
import { AmenityFormDialog } from './_components/amenity-form-dialog';
import { DeleteAmenityDialog } from './_components/delete-amenity-dialog';
import {
  AMENITY_TYPE_LABELS,
  type AmenityFormValues,
  type AmenitySort,
  type AmenityStatusFilter,
} from './_lib/amenities-config';

export function AdminAmenitiesView() {
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault(''));
  const [input, setInput] = useState(query);
  const [typeFilter, setTypeFilter] = useState<AmenityType | 'all'>('all');
  const [statusFilter, setStatusFilter] =
    useState<AmenityStatusFilter>('all');
  const [sort, setSort] = useState<AmenitySort>('name');
  const [form, setForm] = useState<Amenity | 'new' | null>(null);
  const [target, setTarget] = useState<Amenity | null>(null);
  const amenities = useAdminAmenities();
  const create = useCreateAdminAmenity();
  const update = useUpdateAdminAmenity();
  const remove = useDeleteAdminAmenity();

  const items = useMemo(
    () =>
      (amenities.data ?? [])
        .filter(
          (item) =>
            `${item.name} ${AMENITY_TYPE_LABELS[item.type]}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (typeFilter === 'all' || item.type === typeFilter) &&
            (statusFilter === 'all' ||
              (statusFilter === 'active'
                ? item.isActive
                : !item.isActive)),
        )
        .sort((first, second) =>
          sort === 'usage'
            ? (second._count?.rooms ?? 0) - (first._count?.rooms ?? 0)
            : first.name.localeCompare(second.name, 'vi'),
        ),
    [amenities.data, query, sort, statusFilter, typeFilter],
  );
  const summary = {
    total: amenities.data?.length ?? 0,
    active:
      amenities.data?.filter((item) => item.isActive).length ?? 0,
    used:
      amenities.data?.reduce(
        (total, item) => total + (item._count?.rooms ?? 0),
        0,
      ) ?? 0,
  };

  const save = (value: AmenityFormValues) => {
    if (form === 'new') {
      void create.mutateAsync(value).then(() => setForm(null));
    } else if (form) {
      void update
        .mutateAsync({ id: form.id, ...value })
        .then(() => setForm(null));
    }
  };

  if (amenities.isPending) return <AmenitiesSkeleton />;
  if (amenities.isError) {
    return <ErrorState onRetry={() => void amenities.refetch()} />;
  }

  return (
    <div className="amenity-console space-y-6">
      <AdminPageHeader
        title="Quản lý tiện ích"
        description="Chuẩn hóa các tiện ích hiển thị trên tin đăng."
        action={
          <Button onClick={() => setForm('new')}>
            <Plus className="h-4 w-4" aria-hidden />
            Thêm tiện ích
          </Button>
        }
      />

      <AmenitiesStats {...summary} />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <AmenitiesToolbar
          input={input}
          type={typeFilter}
          status={statusFilter}
          sort={sort}
          onInput={setInput}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void setQuery(input.trim());
          }}
          onType={setTypeFilter}
          onStatus={setStatusFilter}
          onSort={setSort}
        />
        <AmenitiesTable
          items={items}
          isUpdating={update.isPending}
          onToggle={(item) =>
            void update.mutateAsync({
              id: item.id,
              isActive: !item.isActive,
            })
          }
          onEdit={setForm}
          onDelete={setTarget}
        />
      </section>

      <AmenitiesGuidance />

      <AmenityFormDialog
        item={form}
        loading={create.isPending || update.isPending}
        onClose={() => setForm(null)}
        onSave={save}
      />
      <DeleteAmenityDialog
        item={target}
        pending={remove.isPending}
        onClose={() => setTarget(null)}
        onDelete={() => {
          if (target) {
            void remove.mutateAsync(target.id).then(() => setTarget(null));
          }
        }}
      />
    </div>
  );
}

export function AmenitiesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải tiện ích">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-9 w-60" />
          <Skeleton className="mt-2 h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_150px_190px]">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid gap-3 border-b border-zinc-100 px-5 py-4 sm:grid-cols-5 sm:items-center">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 sm:justify-self-end" />
          </div>
        ))}
      </section>
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  );
}
