import { Injectable, OnApplicationShutdown } from '@nestjs/common';
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
      timeToBlockExpire: isBlocked ? Math.max(blockDuration, timeToExpire) : 0,
    };
  }

  async onApplicationShutdown() {
    if (this.redis.status !== 'end') await this.redis.quit();
  }
}
