import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';

interface TrackerRequest {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: { phone?: unknown; visitorId?: unknown };
  socket?: { remoteAddress?: string };
}

export function buildRateLimitTracker(request: TrackerRequest): string {
  const authorization = request.headers?.authorization;
  const bearer = Array.isArray(authorization)
    ? authorization[0]
    : authorization;
  if (bearer?.startsWith('Bearer ')) {
    const fingerprint = createHash('sha256')
      .update(bearer.slice(7))
      .digest('hex');
    return `session:${fingerprint}`;
  }

  const phone = request.body?.phone;
  if (typeof phone === 'string' && phone.trim()) {
    return `phone:${phone.replace(/\s+/g, '')}`;
  }

  const visitorId = request.body?.visitorId;
  if (typeof visitorId === 'string' && visitorId.trim()) {
    const fingerprint = createHash('sha256')
      .update(visitorId)
      .digest('hex');
    return `visitor:${fingerprint}`;
  }

  return `ip:${request.ip ?? request.socket?.remoteAddress ?? 'unknown'}`;
}

@Injectable()
export class RoomRentThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    return Promise.resolve(
      buildRateLimitTracker(request as unknown as TrackerRequest),
    );
  }
}
