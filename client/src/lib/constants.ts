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

/** Shown on the edit page's read-only status card — landlords can't change status themselves. */
export const ROOM_STATUS_DESCRIPTIONS: Record<RoomStatus, string> = {
  draft: 'Chưa đăng, chỉ mình bạn thấy.',
  pending: 'Đang chờ admin kiểm duyệt trước khi hiển thị công khai.',
  active: 'Đang hiển thị công khai với người thuê tiềm năng.',
  hidden: 'Đã bị ẩn khỏi kết quả tìm kiếm.',
  rejected: 'Admin đã từ chối tin đăng này.',
  expired: 'Tin đăng đã hết hạn hiển thị.',
};

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
} as const;

export type ContactType = keyof typeof CONTACT_TYPE_LABELS;

export const AMENITY_TYPE_LABELS = {
  basic: 'Cơ bản',
  utility: 'Tiện ích',
  security: 'An ninh',
  nearby: 'Xung quanh',
} as const;

export type AmenityType = keyof typeof AMENITY_TYPE_LABELS;

/**
 * Fallback used only if the live provinces API (features/locations/api.ts) is
 * unreachable. The city value is matched exactly against `city` on the
 * backend, so these strings must equal what listings are stored with (e.g.
 * the seed uses "Hồ Chí Minh"). Bare names, no "Thành phố"/"Tỉnh" prefix.
 */
export const VN_CITY_OPTIONS = [
  { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Bình Dương', label: 'Bình Dương' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Cần Thơ', label: 'Cần Thơ' },
  { value: 'Hải Phòng', label: 'Hải Phòng' },
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/** Quick price brackets for the hero search bar — maps to priceMin/priceMax. */
export const PRICE_RANGE_OPTIONS = [
  { value: 'under-3', label: 'Dưới 3 triệu', priceMin: null, priceMax: 3_000_000 },
  { value: '3-6', label: '3 - 6 triệu', priceMin: 3_000_000, priceMax: 6_000_000 },
  { value: '6-10', label: '6 - 10 triệu', priceMin: 6_000_000, priceMax: 10_000_000 },
  { value: 'over-10', label: 'Trên 10 triệu', priceMin: 10_000_000, priceMax: null },
] as const;

export type PriceRangeValue = (typeof PRICE_RANGE_OPTIONS)[number]['value'];

/** UI-only radius choices for the home map. Backend search remains unchanged. */
export const RADIUS_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 3, label: '3 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
] as const;

/**
 * Area-landing pages (`/rooms-for-rent/<slug>`) — SEO entry points for a
 * specific district, pre-filtered server-rendered lists distinct from the
 * general search results. `city`/`district` must match the backend's stored
 * values exactly (same rule as VN_CITY_OPTIONS above).
 */
export interface AreaLanding {
  slug: string;
  city: string;
  district: string;
  /** Shown in headings/metadata, e.g. "Quận 7, Hồ Chí Minh". */
  label: string;
}

export const AREA_LANDINGS: AreaLanding[] = [
  { slug: 'quan-7', city: 'Hồ Chí Minh', district: 'Quận 7', label: 'Quận 7, Hồ Chí Minh' },
  {
    slug: 'binh-thanh',
    city: 'Hồ Chí Minh',
    district: 'Bình Thạnh',
    label: 'Bình Thạnh, Hồ Chí Minh',
  },
  { slug: 'quan-1', city: 'Hồ Chí Minh', district: 'Quận 1', label: 'Quận 1, Hồ Chí Minh' },
  { slug: 'quan-10', city: 'Hồ Chí Minh', district: 'Quận 10', label: 'Quận 10, Hồ Chí Minh' },
  { slug: 'thu-duc', city: 'Hồ Chí Minh', district: 'Thành phố Thủ Đức', label: 'TP. Thủ Đức, Hồ Chí Minh' },
  { slug: 'cau-giay', city: 'Hà Nội', district: 'Cầu Giấy', label: 'Cầu Giấy, Hà Nội' },
  { slug: 'nam-tu-liem', city: 'Hà Nội', district: 'Nam Từ Liêm', label: 'Nam Từ Liêm, Hà Nội' },
  { slug: 'hai-ba-trung', city: 'Hà Nội', district: 'Hai Bà Trưng', label: 'Hai Bà Trưng, Hà Nội' },
];

export function findAreaLanding(slug: string): AreaLanding | undefined {
  return AREA_LANDINGS.find((a) => a.slug === slug);
}

/** Backend caps listings at 10 images; the UI enforces it too. */
export const MAX_IMAGES_PER_ROOM = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
