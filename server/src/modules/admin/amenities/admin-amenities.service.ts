import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { slugify } from '@/common/utils/slugify';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/create-amenity.dto';

@Injectable()
export class AdminAmenitiesService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.amenity.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { rooms: true } } },
    });
  }

  async create(dto: CreateAmenityDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.amenity.findUnique({ where: { slug } });
    if (existing)
      throw new ConflictException('An amenity with this name already exists.');

    return this.prisma.amenity.create({ data: { ...dto, slug } });
  }

  async update(id: number, dto: UpdateAmenityDto) {
    await this.getOrThrow(id);

    const slug = dto.name ? slugify(dto.name) : undefined;
    if (slug) {
      const clash = await this.prisma.amenity.findUnique({ where: { slug } });
      if (clash && clash.id !== id) {
        throw new ConflictException(
          'An amenity with this name already exists.',
        );
      }
    }

    return this.prisma.amenity.update({
      where: { id },
      data: { ...dto, ...(slug ? { slug } : {}) },
    });
  }

  // Hard delete is fine for catalog entries — RoomAmenity join rows cascade,
  // so the amenity simply disappears from any listings that had it.
  async remove(id: number) {
    await this.getOrThrow(id);
    await this.prisma.amenity.delete({ where: { id } });
    return { success: true };
  }

  private async getOrThrow(id: number) {
    const amenity = await this.prisma.amenity.findUnique({ where: { id } });
    if (!amenity) throw new NotFoundException('Amenity not found.');
    return amenity;
  }
}
