import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavedSearchDto) {
    if (
      dto.priceMin !== undefined &&
      dto.priceMax !== undefined &&
      dto.priceMin > dto.priceMax
    ) {
      throw new BadRequestException('priceMin cannot exceed priceMax.');
    }
    if (
      dto.areaMin !== undefined &&
      dto.areaMax !== undefined &&
      dto.areaMin > dto.areaMax
    ) {
      throw new BadRequestException('areaMin cannot exceed areaMax.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (typeof tx.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
      }
      const count = await tx.savedSearch.count({ where: { userId } });
      if (count >= 20) {
        throw new BadRequestException(
          'You can save at most 20 searches. Delete one before adding another.',
        );
      }
      const duplicate = await tx.savedSearch.findFirst({
        where: {
          userId,
          city: dto.city ?? null,
          district: dto.district ?? null,
          ward: dto.ward ?? null,
          roomType: dto.roomType ?? null,
          priceMin: dto.priceMin ?? null,
          priceMax: dto.priceMax ?? null,
          areaMin: dto.areaMin ?? null,
          areaMax: dto.areaMax ?? null,
        },
      });
      if (duplicate) {
        throw new BadRequestException('This saved search already exists.');
      }
      return tx.savedSearch.create({ data: { ...dto, userId } });
    });
  }

  async findMine(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id },
    });
    if (!savedSearch) throw new NotFoundException('Saved search not found.');
    if (savedSearch.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this saved search.',
      );
    }

    await this.prisma.savedSearch.delete({ where: { id } });
    return { success: true };
  }

  async update(userId: string, id: string, dto: UpdateSavedSearchDto) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id },
    });
    if (!savedSearch) throw new NotFoundException('Saved search not found.');
    if (savedSearch.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this saved search.',
      );
    }

    return this.prisma.savedSearch.update({
      where: { id },
      data: dto,
    });
  }
}
