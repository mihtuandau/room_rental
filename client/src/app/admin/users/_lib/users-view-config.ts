import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import type { AdminUser } from '@/features/admin/api';

export const PAGE_SIZE = 20;
export const ROLE_VALUES = ['user', 'admin'] as const;
export const LISTING_VALUES = ['none', 'any', 'active'] as const;
export const STATUS_VALUES = ['active', 'banned'] as const;

export const ROLE_LABELS = {
  user: 'Người dùng',
  admin: 'Quản trị viên',
} as const;

export const LISTING_LABELS = {
  none: 'Chưa có tin đăng',
  any: 'Đã có tin đăng',
  active: 'Có tin đang hoạt động',
} as const;

export const STATUS_LABELS = {
  active: 'Đang hoạt động',
  banned: 'Đã khóa',
} as const;

export const userParsers = {
  keyword: parseAsString.withDefault(''),
  role: parseAsStringLiteral(ROLE_VALUES),
  listing: parseAsStringLiteral(LISTING_VALUES),
  status: parseAsStringLiteral(STATUS_VALUES),
  page: parseAsInteger.withDefault(1),
};

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export function downloadUsersCsv(users: AdminUser[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const safe = (value: string) =>
    /^[=+\-@]/.test(value) ? `'${value}` : value;
  const rows = users.map((user) =>
    [
      user.id,
      user.fullName || '',
      user.email || '',
      user.phone || '',
      ROLE_LABELS[user.role],
      String(user.listingCount),
      user.hasActiveListing ? 'Có' : 'Không',
      user.isPhoneVerified ? 'Đã xác minh' : 'Chưa xác minh',
      user.deletedAt ? 'Đã khóa' : 'Đang hoạt động',
      formatDate(user.createdAt),
    ]
      .map((value) => escape(safe(value)))
      .join(','),
  );
  const content = `\uFEFFMã người dùng,Tên,Email,Số điện thoại,Loại tài khoản,Số tin đăng,Có tin hoạt động,Xác minh,Trạng thái,Ngày tham gia\n${rows.join('\n')}`;
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `tro-oi-nguoi-dung-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
