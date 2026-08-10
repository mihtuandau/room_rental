import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { ThrottlerStorage } from '@nestjs/throttler';

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

/** Shared throttler counters for multi-instance deployments. */
@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private unavailableUntil = 0;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (Date.now() < this.unavailableUntil) {
      return this.failClosed(blockDuration);
    }

    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      const redisKey = `roomrent:throttle:${throttlerName}:${key}`;
      const totalHits = await this.redis.incr(redisKey);
      if (totalHits === 1) await this.redis.pexpire(redisKey, ttl);
      const timeToExpire = Math.max(await this.redis.pttl(redisKey), 0);
      const isBlocked = totalHits > limit;
      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire: isBlocked
          ? Math.max(blockDuration, timeToExpire)
          : 0,
      };
    } catch (error) {
      // Never silently disable abuse protection when the shared limiter is
      // unavailable. Temporarily fail closed while avoiding a Redis connection
      // attempt on every request during the outage.
      this.unavailableUntil = Date.now() + 5_000;
      this.logger.error(
        'Redis throttler unavailable; requests are blocked.',
        error instanceof Error ? error.message : String(error),
      );
      return this.failClosed(blockDuration);
    }
  }

  private failClosed(blockDuration: number): ThrottlerStorageRecord {
    const retryAfter = Math.max(blockDuration, 5_000);
    return {
      totalHits: Number.MAX_SAFE_INTEGER,
      timeToExpire: retryAfter,
      isBlocked: true,
      timeToBlockExpire: retryAfter,
    };
  }

  async onApplicationShutdown() {
    if (this.redis.status !== 'end') await this.redis.quit();
  }
}
