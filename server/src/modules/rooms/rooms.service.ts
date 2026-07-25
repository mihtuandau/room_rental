import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { uniqueSlug } from '@/common/utils/slugify';
import { CloudinaryService } from '../storage/cloudinary.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { ConfirmImageDto } from './dto/confirm-image.dto';

// Never select passwordHash/tokenVersion — only fields safe to show a tenant.
const OWNER_PUBLIC_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  contactPhone: true,
  zaloUrl: true,
} as const;

const COVER_IMAGE_INCLUDE = {
  images: { where: { isCover: true }, take: 1 },
} as const;

const MAX_IMAGES_PER_ROOM = 10;

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(userId: string, dto: CreateRoomDto) {
    // A listing is useless without a way to reach the owner, and Google signups
    // start with neither a login phone nor a contact phone — make the client
    // collect one before the listing can exist.
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true, contactPhone: true },
    });
    if (!owner.contactPhone && !owner.phone) {
      throw new BadRequestException(
        'Add a contact phone number to your profile before posting a listing.',
      );
    }

    return this.prisma.room.create({
      data: {
        ...dto,
        ownerId: userId,
        slug: uniqueSlug(dto.title),
        status: 'pending',
      },
    });
  }

  async search(dto: SearchRoomsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;

    // Prisma can't do accent-insensitive matching — narrow to matching ids via
    // a parameterized raw query first, then apply the rest as normal Prisma filters.
    let keywordMatchedIds: number[] | undefined;
    if (dto.keyword?.trim()) {
      // Matched as separate words (each word ANDed, found anywhere across the
      // combined text) rather than one literal phrase — otherwise "phòng trọ
      // quận 10" never matches, since no single field contains that exact
      // string (the title has "phòng trọ", district has "Quận 10", never both).
      const words = dto.keyword.trim().split(/\s+/).filter(Boolean);
      const combinedText = Prisma.sql`unaccent(
        title || ' ' || coalesce(description, '') || ' ' || coalesce(district, '')
        || ' ' || coalesce(ward, '') || ' ' || coalesce(address, '') || ' ' || coalesce(city, '')
      )`;
      const wordConditions = words.map(
        (word) =>
          Prisma.sql`${combinedText} ILIKE unaccent(${'%' + word + '%'})`,
      );

      const rows = await this.prisma.$queryRaw<{ id: number }[]>(
        Prisma.sql`
          SELECT id FROM rooms
          WHERE status = 'active' AND deleted_at IS NULL
            AND ${Prisma.join(wordConditions, ' AND ')}
        `,
      );
      keywordMatchedIds = rows.map((r) => r.id);
      if (keywordMatchedIds.length === 0) {
        return { rooms: [], total: 0, page, pageSize };
      }
    }

    const where = {
      status: 'active' as const,
      deletedAt: null,
      ...(keywordMatchedIds && { id: { in: keywordMatchedIds } }),
      ...(dto.city && { city: dto.city }),
      ...(dto.district && { district: dto.district }),
      ...(dto.ward && { ward: dto.ward }),
      ...(dto.roomType && { roomType: dto.roomType }),
      ...((dto.priceMin ?? dto.priceMax) && {
        price: {
          ...(dto.priceMin && { gte: dto.priceMin }),
          ...(dto.priceMax && { lte: dto.priceMax }),
        },
      }),
      ...((dto.areaMin ?? dto.areaMax) && {
        area: {
          ...(dto.areaMin && { gte: dto.areaMin }),
          ...(dto.areaMax && { lte: dto.areaMax }),
        },
      }),
      ...(dto.verifiedOnly && { isVerified: true }),
      // listing must have EVERY selected amenity, not just any one of them
      ...(dto.amenityIds?.length && {
        AND: dto.amenityIds.map((amenityId) => ({
          amenities: { some: { amenityId } },
        })),
      }),
    };

    const orderBy = [
      { isVerified: 'desc' as const },
      ...(dto.sort === 'price_asc' ? [{ price: 'asc' as const }] : []),
      ...(dto.sort === 'price_desc' ? [{ price: 'desc' as const }] : []),
      ...(!dto.sort || dto.sort === 'newest'
        ? [{ createdAt: 'desc' as const }]
        : []),
    ];

    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: COVER_IMAGE_INCLUDE,
      }),
      this.prisma.room.count({ where }),
    ]);

    return { rooms, total, page, pageSize };
  }

  async findActiveBySlug(slug: string) {
    const room = await this.prisma.room.findFirst({
      where: { slug, status: 'active', deletedAt: null },
      include: {
        images: true,
        owner: { select: OWNER_PUBLIC_SELECT },
        amenities: { include: { amenity: true } },
      },
    });
    if (!room) throw new NotFoundException('Listing not found.');

    await this.prisma.room.update({
      where: { id: room.id },
      data: { viewCount: { increment: 1 } },
    });
    return {
      ...room,
      viewCount: room.viewCount + 1,
      // flatten the join rows — the client only cares about the amenities themselves
      amenities: room.amenities.map((ra) => ra.amenity),
    };
  }

  async findMine(userId: string) {
    return this.prisma.room.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: COVER_IMAGE_INCLUDE,
    });
  }

  async update(userId: string, roomId: number, dto: UpdateRoomDto) {
    const room = await this.findOwned(userId, roomId);
    return this.prisma.room.update({ where: { id: room.id }, data: dto });
  }

  async softDelete(userId: string, roomId: number) {
    const room = await this.findOwned(userId, roomId);
    return this.prisma.room.update({
      where: { id: room.id },
      data: { deletedAt: new Date() },
    });
  }

  // Client uploads to Cloudinary directly (see storage module) — this only
  // persists the resulting key/URL after the fact, and enforces "at most one cover image".
  async addImage(userId: string, roomId: number, dto: ConfirmImageDto) {
    const room = await this.findOwned(userId, roomId);
    const isCover = dto.isCover ?? false;

    const imageCount = await this.prisma.roomImage.count({
      where: { roomId: room.id },
    });
    if (imageCount >= MAX_IMAGES_PER_ROOM) {
      throw new BadRequestException(
        `A listing can have at most ${MAX_IMAGES_PER_ROOM} images.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (isCover) {
        await tx.roomImage.updateMany({
          where: { roomId: room.id, isCover: true },
          data: { isCover: false },
        });
      }
      return tx.roomImage.create({
        data: { roomId: room.id, key: dto.key, url: dto.url, isCover },
      });
    });
  }

  async removeImage(userId: string, roomId: number, imageId: string) {
    const room = await this.findOwned(userId, roomId);
    const image = await this.prisma.roomImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.roomId !== room.id)
      throw new NotFoundException('Image not found.');

    await this.prisma.roomImage.delete({ where: { id: imageId } });
    await this.cloudinaryService.destroyAsset(image.key); // key stores the Cloudinary public_id
    return { success: true };
  }

  private async findOwned(userId: string, roomId: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt)
      throw new NotFoundException('Listing not found.');
    if (room.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this listing.',
      );
    }
    return room;
  }
}
