import { z } from 'zod';

export const REPORT_REASON_VALUES = [
  'fake_listing',
  'wrong_info',
  'scam',
  'already_rented',
  'other',
] as const;

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASON_VALUES, {
    message: 'Chọn một lý do báo cáo.',
  }),
  description: z.string().max(1000, 'Mô tả tối đa 1000 ký tự.').optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
