'use client';

import { Pencil, Tags, Trash2 } from 'lucide-react';
import {
  adminStickyActionCellClassName,
  adminStickyActionHeadClassName,
  adminTableHeadClassName,
  adminTableRowClassName,
} from '@/components/admin/admin-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import type { Amenity } from '@/features/amenities/api';
import { AMENITY_TYPE_LABELS } from '../_lib/amenities-config';
import { AmenitySymbol } from './amenity-symbol';

export function AmenitiesTable({
  items,
  isUpdating,
  onToggle,
  onEdit,
  onDelete,
}: {
  items: Amenity[];
  isUpdating: boolean;
  onToggle: (item: Amenity) => void;
  onEdit: (item: Amenity) => void;
  onDelete: (item: Amenity) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Tags className="h-10 w-10" />}
        title="Không tìm thấy tiện ích"
        description="Thử một từ khóa khác hoặc thêm tiện ích mới."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <p className="px-5 pb-2 text-xs text-zinc-500 md:hidden">
        Vuốt ngang để xem đầy đủ thông tin.
      </p>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className={adminTableHeadClassName}>
          <tr>
            <th className="px-5 py-3">Tiện ích</th>
            <th className="px-4 py-3">Danh mục</th>
            <th className="px-4 py-3">Tin sử dụng</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Mã catalogue</th>
            <th className={`${adminStickyActionHeadClassName} px-5 py-3`}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={adminTableRowClassName}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm">
                    <AmenitySymbol icon={item.icon} />
                  </span>
                  <p className="text-sm font-semibold text-zinc-900">
                    {item.name}
                  </p>
                </div>
              </td>
              <td className="px-4 py-4">
                <Badge variant="neutral" className="bg-zinc-100 px-3 py-1">
                  {AMENITY_TYPE_LABELS[item.type]}
                </Badge>
              </td>
              <td className="px-4 py-4 text-xs text-zinc-700">
                {item._count?.rooms ?? 0} tin đăng
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.isActive}
                    aria-label={`Đổi trạng thái ${item.name}`}
                    disabled={isUpdating}
                    onClick={() => onToggle(item)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${item.isActive ? 'bg-brand-600' : 'bg-zinc-300'}`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${item.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                  <span
                    className={
                      item.isActive
                        ? 'text-xs font-medium text-brand-700'
                        : 'text-xs font-medium text-zinc-500'
                    }
                  >
                    {item.isActive ? 'Bật' : 'Tắt'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 font-mono text-xs text-zinc-500">
                {item.slug}
              </td>
              <td className={`${adminStickyActionCellClassName} px-5 py-4`}>
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Sửa ${item.name}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-danger-600 hover:bg-danger-50"
                    aria-label={`Xóa ${item.name}`}
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
