import { parseAsInteger, parseAsStringLiteral } from 'nuqs/server';
import type { AdminReport, AdminReportStatus } from '@/features/admin/api';

export const PAGE_SIZE = 15;
export const REPORT_STATUSES = [
  'pending',
  'reviewing',
  'resolved',
  'dismissed',
] as const;

export const REPORT_STATUS_LABELS: Record<AdminReportStatus, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã xử lý',
  dismissed: 'Đã bỏ qua',
};

export const REPORT_REASON_LABELS: Record<AdminReport['reason'], string> = {
  fake_listing: 'Tin giả',
  wrong_info: 'Thông tin sai',
  scam: 'Nghi ngờ lừa đảo',
  already_rented: 'Phòng đã cho thuê',
  other: 'Lý do khác',
};

export const reportParsers = {
  status: parseAsStringLiteral(REPORT_STATUSES),
  page: parseAsInteger.withDefault(1),
};

export const formatReportDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
