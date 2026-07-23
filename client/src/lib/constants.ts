/**
 * The single place backend enums are mapped to Vietnamese labels. Retyping these
 * inline is how "Chung cư mini" becomes "Chung cư Mini" on another screen.
 */

export const ROOM_TYPE_LABELS = {
  boarding_house: 'Phòng trọ',
  whole_house: 'Nhà nguyên căn',
  mini_apartment: 'Chung cư mini',
  serviced_apartment: 'Căn hộ dịch vụ',
  shared_room: 'Ở ghép',
} as const;

export type RoomType = keyof typeof ROOM_TYPE_LABELS;

export const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as RoomType, label }),
);

export const ROOM_STATUS_LABELS = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  active: 'Đang hiển thị',
  hidden: 'Đã ẩn',
  rejected: 'Bị từ chối',
  expired: 'Hết hạn',
} as const;

export type RoomStatus = keyof typeof ROOM_STATUS_LABELS;

export const REPORT_REASON_LABELS = {
  fake_listing: 'Tin giả',
  wrong_info: 'Sai thông tin',
  scam: 'Lừa đảo',
  already_rented: 'Đã cho thuê',
  other: 'Khác',
} as const;

export type ReportReason = keyof typeof REPORT_REASON_LABELS;

export const CONTACT_TYPE_LABELS = {
  phone: 'Gọi điện',
  zalo: 'Zalo',
  message: 'Nhắn tin',
} as const;

export type ContactType = keyof typeof CONTACT_TYPE_LABELS;

export const AMENITY_TYPE_LABELS = {
  basic: 'Cơ bản',
  utility: 'Tiện ích',
  security: 'An ninh',
  nearby: 'Xung quanh',
} as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/** Backend caps listings at 10 images; the UI enforces it too. */
export const MAX_IMAGES_PER_ROOM = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
