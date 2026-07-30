import { parseAsInteger, parseAsString } from 'nuqs/server';
import type { AdminPendingRoom } from '@/features/admin/api';

export const PAGE_SIZE = 12;
export const ROOM_TYPE_LABELS: Record<
  AdminPendingRoom['roomType'],
  string
> = {
  boarding_house: 'Phòng trọ',
  whole_house: 'Nhà nguyên căn',
  mini_apartment: 'Chung cư mini',
  serviced_apartment: 'Căn hộ dịch vụ',
  shared_room: 'Ở ghép',
};

export const pendingParsers = {
  keyword: parseAsString.withDefault(''),
  verified: parseAsString,
  page: parseAsInteger.withDefault(1),
};

export const formatCompactMoney = (value: number) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000)} tr`;

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
    new Date(value),
  );
