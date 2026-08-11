import { buildRateLimitTracker } from './roomrent-throttler.guard';

describe('buildRateLimitTracker', () => {
  it('separates authenticated sessions even when they share the BFF IP', () => {
    const first = buildRateLimitTracker({
      ip: '127.0.0.1',
      headers: { authorization: 'Bearer first-token' },
    });
    const second = buildRateLimitTracker({
      ip: '127.0.0.1',
      headers: { authorization: 'Bearer second-token' },
    });

    expect(first).toMatch(/^session:[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
    expect(first).not.toContain('first-token');
  });

  it('keeps the same account bucket when access tokens rotate', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'user-1' })).toString(
      'base64url',
    );
    const first = buildRateLimitTracker({
      headers: { authorization: `Bearer header.${payload}.sig-1` },
    });
    const second = buildRateLimitTracker({
      headers: { authorization: `Bearer header.${payload}.sig-2` },
    });

    expect(first).toMatch(/^user:[a-f0-9]{64}$/);
    expect(first).toBe(second);
  });

  it('tracks public authentication attempts by normalized phone', () => {
    expect(
      buildRateLimitTracker({
        ip: '127.0.0.1',
        body: { phone: '0912 345 678' },
      }),
    ).toBe('phone:0912345678');
  });

  it('falls back to the request IP for anonymous traffic', () => {
    expect(buildRateLimitTracker({ ip: '203.0.113.10' })).toBe(
      'ip:203.0.113.10',
    );
  });
});
