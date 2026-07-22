import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSavedSearchDto) {
    return this.prisma.savedSearch.create({ data: { ...dto, userId } });
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
}
