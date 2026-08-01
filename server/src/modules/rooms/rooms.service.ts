import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { uniqueSlug } from '@/common/utils/slugify';
import { CloudinaryService } from '../storage/cloudinary.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { ConfirmImageDto } from './dto/confirm-image.dto';
import { ROOM_IMAGE_MAX_COUNT } from '../storage/storage.constants';

// Public listing detail must not expose contact fields. Phone/Zalo are returned
// only by ContactLogsService after authentication, rate limiting, and logging.
const OWNER_PUBLIC_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
} as const;

const COVER_IMAGE_INCLUDE = {
  images: {
    where: { isCover: true },
    orderBy: { createdAt: 'asc' as const },
    take: 1,
  },
} as const;

const ROOM_IMAGE_ORDER = [
  { isCover: 'desc' as const },
  { position: 'asc' as const },
  { createdAt: 'asc' as const },
];

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
      select: {
        phone: true,
        contactPhone: true,
        isPhoneVerified: true,
      },
    });
    if (!owner.contactPhone && !owner.phone) {
      throw new BadRequestException(
        'Add a contact phone number to your profile before posting a listing.',
      );
    }
    if (owner.phone && !owner.isPhoneVerified) {
      throw new BadRequestException(
        'Verify your phone number before posting a listing.',
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
    const hasAnyGeoParam =
      dto.lat !== undefined ||
      dto.lng !== undefined ||
      dto.radiusKm !== undefined;
    const hasRadiusSearch = dto.lat !== undefined && dto.lng !== undefined;

    if (hasAnyGeoParam && !hasRadiusSearch) {
      throw new BadRequestException(
        'Both latitude and longitude are required for radius search.',
      );
    }

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

    let radiusMatchedIds: number[] | undefined;
    if (hasRadiusSearch) {
      const radiusKm = dto.radiusKm ?? 3;
      const rows = await this.prisma.$queryRaw<{ id: number }[]>(
        Prisma.sql`
          SELECT id
          FROM rooms
          WHERE status = 'active'
            AND deleted_at IS NULL
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
            AND (
              6371 * 2 * asin(
                sqrt(
                  power(sin(radians((${dto.lat} - latitude) / 2)), 2) +
                  cos(radians(${dto.lat})) *
                  cos(radians(latitude)) *
                  power(sin(radians((${dto.lng} - longitude) / 2)), 2)
                )
              )
            ) <= ${radiusKm}
        `,
      );
      radiusMatchedIds = rows.map((r) => r.id);
      if (radiusMatchedIds.length === 0) {
        return { rooms: [], total: 0, page, pageSize };
      }
    }

    const scopedIds =
      keywordMatchedIds && radiusMatchedIds
        ? keywordMatchedIds.filter((id) => radiusMatchedIds.includes(id))
        : (keywordMatchedIds ?? radiusMatchedIds);
    if (scopedIds && scopedIds.length === 0) {
      return { rooms: [], total: 0, page, pageSize };
    }

    const where = {
      status: 'active' as const,
      deletedAt: null,
      ...(scopedIds && { id: { in: scopedIds } }),
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
        images: { orderBy: ROOM_IMAGE_ORDER },
        owner: { select: OWNER_PUBLIC_SELECT },
        amenities: { include: { amenity: true } },
      },
    });
    if (!room) throw new NotFoundException('Listing not found.');

    return {
      ...room,
      // flatten the join rows — the client only cares about the amenities themselves
      amenities: room.amenities.map((ra) => ra.amenity),
    };
  }

  async recordView(roomId: number, visitorId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, status: 'active', deletedAt: null },
      select: { id: true },
    });
    if (!room) throw new NotFoundException('Listing not found.');

    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = createHash('sha256').update(visitorId).digest('hex');
    const dedupeKey = createHash('sha256')
      .update(`${roomId}:${visitorHash}:${day}`)
      .digest('hex');

    try {
      await this.prisma.$transaction([
        this.prisma.roomView.create({
          data: { roomId, ipHash: visitorHash, dedupeKey },
        }),
        this.prisma.room.update({
          where: { id: roomId },
          data: { viewCount: { increment: 1 } },
        }),
      ]);
      return { recorded: true };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return { recorded: false };
      }
      throw error;
    }
  }

  async findMine(userId: string) {
    return this.prisma.room.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: COVER_IMAGE_INCLUDE,
    });
  }

  // Full detail (all images, amenities) of one of the caller's own listings,
  // any status — powers the edit form. Unlike findActiveBySlug this doesn't
  // touch viewCount; an owner opening their own edit page isn't a real view.
  async findMineDetail(userId: string, roomId: number) {
    const room = await this.findOwned(userId, roomId);
    const full = await this.prisma.room.findUniqueOrThrow({
      where: { id: room.id },
      include: {
        images: { orderBy: ROOM_IMAGE_ORDER },
        amenities: { include: { amenity: true } },
      },
    });
    return {
      ...full,
      amenities: full.amenities.map((ra) => ra.amenity),
    };
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
    const image = await this.cloudinaryService.verifyRoomImage(
      dto.key,
      userId,
      room.id,
    );
    const [imageCount, currentCover] = await Promise.all([
      this.prisma.roomImage.count({
        where: { roomId: room.id },
      }),
      this.prisma.roomImage.findFirst({
        where: { roomId: room.id, isCover: true },
      }),
    ]);
    if (imageCount >= ROOM_IMAGE_MAX_COUNT) {
      throw new BadRequestException(
        `A listing can have at most ${ROOM_IMAGE_MAX_COUNT} images.`,
      );
    }
    const duplicate = await this.prisma.roomImage.findFirst({
      where: { key: image.key },
    });
    if (duplicate) {
      throw new BadRequestException('This image has already been attached.');
    }
    // Repair legacy cover-less listings as soon as another image is attached.
    // A listing with images should always have exactly one public thumbnail.
    const isCover = dto.isCover === true || currentCover === null;

    return this.prisma.$transaction(async (tx) => {
      if (isCover) {
        await tx.roomImage.updateMany({
          where: { roomId: room.id, isCover: true },
          data: { isCover: false },
        });
      }
      return tx.roomImage.create({
        data: {
          roomId: room.id,
          key: image.key,
          url: image.url,
          isCover,
          position: imageCount,
        },
      });
    });
  }

  async setCoverImage(userId: string, roomId: number, imageId: string) {
    const room = await this.findOwned(userId, roomId);
    const image = await this.prisma.roomImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.roomId !== room.id) {
      throw new NotFoundException('Image not found.');
    }
    if (image.isCover) return image;

    return this.prisma.$transaction(async (tx) => {
      await tx.roomImage.updateMany({
        where: { roomId: room.id, isCover: true },
        data: { isCover: false },
      });
      return tx.roomImage.update({
        where: { id: image.id },
        data: { isCover: true },
      });
    });
  }

  // Replaces the full amenity set (idempotent) rather than diffing — the form
  // always submits the complete selected list, same pattern as the seed script.
  async setAmenities(userId: string, roomId: number, amenityIds: number[]) {
    const room = await this.findOwned(userId, roomId);
    await this.prisma.$transaction([
      this.prisma.roomAmenity.deleteMany({ where: { roomId: room.id } }),
      this.prisma.roomAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ roomId: room.id, amenityId })),
      }),
    ]);
    return { success: true };
  }

  async removeImage(userId: string, roomId: number, imageId: string) {
    const room = await this.findOwned(userId, roomId);
    const image = await this.prisma.roomImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.roomId !== room.id)
      throw new NotFoundException('Image not found.');

    await this.prisma.$transaction(async (tx) => {
      await tx.roomImage.delete({ where: { id: imageId } });

      if (image.isCover) {
        const nextCover = await tx.roomImage.findFirst({
          where: { roomId: room.id },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        });
        if (nextCover) {
          await tx.roomImage.update({
            where: { id: nextCover.id },
            data: { isCover: true },
          });
        }
      }
    });
    if (
      this.cloudinaryService.isOwnedRoomImagePublicId(
        image.key,
        userId,
        room.id,
      )
    ) {
      await this.cloudinaryService.destroyAsset(image.key);
    } else {
      // Legacy rows predate owner-scoped public IDs. Deleting their DB record is
      // safe, but destroying an unscoped key could delete another listing's asset.
      this.cloudinaryService.warnLegacyAssetNotDestroyed(image.key, room.id);
    }
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
