import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Best-effort application cache. Redis outages must not take public reads
 * offline; callers simply fall back to Prisma when a cache operation fails.
 */
@Injectable()
export class RedisCacheService implements OnApplicationShutdown {
  private readonly redis: Redis;
  private unavailableUntil = 0;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (Date.now() < this.unavailableUntil) return undefined;
    try {
      await this.connectIfNeeded();
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : undefined;
    } catch {
      this.markUnavailable();
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (Date.now() < this.unavailableUntil) return;
    try {
      await this.connectIfNeeded();
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.markUnavailable();
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (Date.now() < this.unavailableUntil) return;
    try {
      await this.connectIfNeeded();
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch {
      this.markUnavailable();
    }
  }

  private async connectIfNeeded() {
    if (this.redis.status === 'wait') await this.redis.connect();
  }

  private markUnavailable() {
    // Avoid opening a new connection on every request during an outage.
    this.unavailableUntil = Date.now() + 5_000;
  }

  async onApplicationShutdown() {
    if (this.redis.status !== 'end') await this.redis.quit();
  }
}
