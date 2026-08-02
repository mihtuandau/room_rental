import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '../../../../generated/prisma/client';
import { JwtAccessStrategy } from './jwt-access.strategy';

describe('JwtAccessStrategy', () => {
  function createStrategy(user: unknown) {
    const config = {
      get: jest.fn().mockReturnValue('test-secret-with-at-least-32-characters'),
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
    };
    return {
      strategy: new JwtAccessStrategy(
        config as unknown as ConfigService,
        prisma as unknown as PrismaService,
      ),
      prisma,
    };
  }

  it('accepts a current token for an active user', async () => {
    const { strategy, prisma } = createStrategy({
      role: Role.user,
      tokenVersion: 3,
      deletedAt: null,
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        role: Role.user,
        tokenVersion: 3,
      }),
    ).resolves.toEqual({ id: 'user-1', role: Role.user });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true, tokenVersion: true, deletedAt: true },
    });
  });

  it.each([
    [
      'banned user',
      { role: Role.user, tokenVersion: 3, deletedAt: new Date() },
      { role: Role.user, tokenVersion: 3 },
    ],
    [
      'revoked token version',
      { role: Role.user, tokenVersion: 4, deletedAt: null },
      { role: Role.user, tokenVersion: 3 },
    ],
    [
      'stale role',
      { role: Role.admin, tokenVersion: 3, deletedAt: null },
      { role: Role.user, tokenVersion: 3 },
    ],
  ])('rejects a %s immediately', async (_label, user, token) => {
    const { strategy } = createStrategy(user);

    await expect(
      strategy.validate({
        sub: 'user-1',
        role: token.role,
        tokenVersion: token.tokenVersion,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
