import { z } from 'zod';
import { ROOM_TYPE_OPTIONS, type RoomType } from '@/lib/constants';

const ROOM_TYPE_VALUES = ROOM_TYPE_OPTIONS.map((o) => o.value) as [
  RoomType,
  ...RoomType[],
];

/**
 * `<input type="number">` gives back a string. Coercing manually (rather than
 * `z.coerce.number()`) keeps the schema's inferred type a plain `number` /
 * `number | undefined` — z.coerce's type doesn't line up with react-hook-form's
 * Resolver generic in this zod version. An empty string becomes undefined so
 * optional fields validate cleanly; an unparsable value is passed through
 * as-is so the wrapped schema's own error message fires instead of a silent NaN.
 */
function numberField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => {
    if (v === '' || v === undefined || v === null) return undefined;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(n) ? v : n;
  }, schema);
}

// Mirrors the backend's CreateRoomDto exactly, so a valid form is rarely rejected.
export const createRoomSchema = z.object({
  title: z
    .string()
    .min(10, 'Tiêu đề cần tối thiểu 10 ký tự.')
    .max(120, 'Tiêu đề tối đa 120 ký tự.'),
  description: z.string().max(3000, 'Mô tả tối đa 3000 ký tự.').optional().or(z.literal('')),
  roomType: z.enum(ROOM_TYPE_VALUES, { message: 'Chọn loại phòng.' }),
  price: numberField(z.number().int().positive('Giá thuê phải lớn hơn 0.')),
  area: numberField(z.number().positive('Diện tích phải lớn hơn 0.').optional()),
  deposit: numberField(z.number().int().min(0, 'Tiền cọc không hợp lệ.').optional()),
  bedrooms: numberField(
    z.number().int().min(0).max(20, 'Số phòng ngủ không hợp lệ.').optional(),
  ),
  bathrooms: numberField(
    z.number().int().min(0).max(20, 'Số phòng tắm không hợp lệ.').optional(),
  ),
  maxOccupants: numberField(
    z.number().int().min(1).max(50, 'Số người tối đa không hợp lệ.').optional(),
  ),
  city: z.string().min(1, 'Chọn tỉnh, thành phố.'),
  district: z.string().min(1, 'Nhập quận, huyện.'),
  ward: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

// react-hook-form needs both sides: the raw shape fields actually hold before
// submit (strings from <input type="number">) and what the resolver produces
// after zod's preprocess runs — see useForm's 3-generic form in the component.
export type CreateRoomFormInput = z.input<typeof createRoomSchema>;
export type CreateRoomFormOutput = z.output<typeof createRoomSchema>;
