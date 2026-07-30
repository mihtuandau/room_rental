import type { FormEventHandler } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AmenityType } from '@/lib/constants';
import {
  AMENITY_TYPES,
  AMENITY_TYPE_LABELS,
  type AmenitySort,
  type AmenityStatusFilter,
} from '../_lib/amenities-config';

export function AmenitiesToolbar({
  input,
  type,
  status,
  sort,
  onInput,
  onSubmit,
  onType,
  onStatus,
  onSort,
}: {
  input: string;
  type: AmenityType | 'all';
  status: AmenityStatusFilter;
  sort: AmenitySort;
  onInput: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onType: (value: AmenityType | 'all') => void;
  onStatus: (value: AmenityStatusFilter) => void;
  onSort: (value: AmenitySort) => void;
}) {
  return (
    <div className="border-b border-zinc-100 p-4 sm:p-5">
      <form
        className="grid w-full gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_150px_190px]"
        onSubmit={onSubmit}
      >
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <Input
            className="pl-9"
            value={input}
            onChange={(event) => onInput(event.target.value)}
            placeholder="Tìm theo tên tiện ích…"
            aria-label="Tìm kiếm tiện ích"
          />
        </div>
        <Button className="hidden" variant="outline" type="submit">
          Tìm
        </Button>
        <Select
          value={type}
          onValueChange={(value) => onType(value as AmenityType | 'all')}
        >
          <SelectTrigger aria-label="Lọc theo danh mục">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {AMENITY_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {AMENITY_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => onStatus(value as AmenityStatusFilter)}
        >
          <SelectTrigger aria-label="Lọc theo trạng thái">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi trạng thái</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="inactive">Đã tắt</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => onSort(value as AmenitySort)}
        >
          <SelectTrigger aria-label="Sắp xếp tiện ích">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Tên A–Z</SelectItem>
            <SelectItem value="usage">Dùng nhiều nhất</SelectItem>
          </SelectContent>
        </Select>
      </form>
    </div>
  );
}
