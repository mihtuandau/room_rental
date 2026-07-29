import { getVietnamStartOfDay } from './admin-dashboard.service';

describe('getVietnamStartOfDay', () => {
  it('uses midnight in the Asia/Ho_Chi_Minh timezone', () => {
    const now = new Date('2026-07-29T20:30:00.000Z');

    expect(getVietnamStartOfDay(now).toISOString()).toBe(
      '2026-07-29T17:00:00.000Z',
    );
  });
});
