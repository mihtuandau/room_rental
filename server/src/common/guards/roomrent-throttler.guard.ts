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
    const subject = getJwtSubject(bearer.slice(7));
    if (subject) {
      // Access tokens rotate on refresh; rate-limit the stable account subject
      // instead of allowing a fresh token to reset the bucket.
      const userFingerprint = createHash('sha256')
        .update(subject)
        .digest('hex');
      return `user:${userFingerprint}`;
    }
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
    const fingerprint = createHash('sha256').update(visitorId).digest('hex');
    return `visitor:${fingerprint}`;
  }

  return `ip:${request.ip ?? request.socket?.remoteAddress ?? 'unknown'}`;
}

function getJwtSubject(token: string): string | undefined {
  const payload = token.split('.')[1];
  if (!payload) return undefined;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { sub?: unknown };
    return typeof decoded.sub === 'string' && decoded.sub.trim()
      ? decoded.sub
      : undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class RoomRentThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    return Promise.resolve(
      buildRateLimitTracker(request as unknown as TrackerRequest),
    );
  }
}
