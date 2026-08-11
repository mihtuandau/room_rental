import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import { Prisma, RoomStatus } from '../../../generated/prisma/client';
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
  createdAt: true,
  phone: true,
  contactPhone: true,
  isPhoneVerified: true,
  contactPhoneVerified: true,
} as const;

/** Keep a useful hint visible without exposing a landlord's full number. */
function maskPhone(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '******';
  return `${digits.slice(0, 2)}${'*'.repeat(digits.length - 5)}${digits.slice(-3)}`;
}

function publicCloudinaryAvatar(
  avatarUrl: string | null | undefined,
  userId: string,
) {
  if (!avatarUrl) return null;
  try {
    const url = new URL(avatarUrl);
    const uploadMarker = '/image/upload/';
    const uploadIndex = url.pathname.indexOf(uploadMarker);
    const pathSegments =
      uploadIndex >= 0
        ? url.pathname
            .slice(uploadIndex + uploadMarker.length)
            .split('/')
            .filter(Boolean)
        : [];
    const avatarFolderIndex = pathSegments.indexOf('avatars');
    return url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      avatarFolderIndex >= 0 &&
      pathSegments[avatarFolderIndex + 1] === userId &&
      pathSegments.length > avatarFolderIndex + 2
      ? avatarUrl
      : null;
  } catch {
    return null;
  }
}

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

// Keep list/search responses to fields needed by public cards and maps. In
// particular, never expose ownerId, moderation state, deletion timestamps, or
// Cloudinary public IDs through a public listing endpoint.
const PUBLIC_ROOM_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  area: true,
  bedrooms: true,
  city: true,
  district: true,
  roomType: true,
  isVerified: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  images: {
    where: { isCover: true },
    orderBy: { createdAt: 'asc' as const },
    take: 1,
    select: { url: true },
  },
} as const;

const PUBLIC_ROOM_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  roomType: true,
  price: true,
  area: true,
  deposit: true,
  bedrooms: true,
  bathrooms: true,
  maxOccupants: true,
  city: true,
  district: true,
  ward: true,
  address: true,
  latitude: true,
  longitude: true,
  isVerified: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  images: {
    orderBy: ROOM_IMAGE_ORDER,
    select: { id: true, url: true, isCover: true, position: true },
  },
  owner: { select: OWNER_PUBLIC_SELECT },
  amenities: { include: { amenity: true } },
} as const;

type FeaturedLocation = {
  city: string;
  district: string;
  count: number;
  minPrice: number | null;
  imageUrl: string | null;
};

type RoomSearchResult = {
  rooms: unknown[];
  total: number;
  page: number;
  pageSize: number;
};

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    @Optional() private cache?: RedisCacheService,
  ) {}

  /**
   * Returns data-driven area cards for the public homepage. Only publicly
   * visible listings count, and a disabled/deleted owner removes their rooms
   * from the aggregate as well.
   */
  async featuredLocations(limit = 4) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 4, 1), 12);
    const cacheKey = `roomrent:cache:rooms:featured:${safeLimit}`;
    const cached = await this.cache?.get<FeaturedLocation[]>(cacheKey);
    if (cached) return cached;

    const where = {
      status: 'active' as const,
      deletedAt: null,
      owner: { is: { deletedAt: null } },
    };
    const grouped = await this.prisma.room.groupBy({
      by: ['city', 'district'],
      where,
      _count: { _all: true },
      _min: { price: true },
    });

    const topLocations = grouped
      .sort((a, b) => {
        const countDiff = b._count._all - a._count._all;
        if (countDiff !== 0) return countDiff;
        return `${a.city}/${a.district}`.localeCompare(
          `${b.city}/${b.district}`,
          'vi',
        );
      })
      .slice(0, safeLimit);

    const result: FeaturedLocation[] = await Promise.all(
      topLocations.map(async (location) => {
        const roomWithCover = await this.prisma.room.findFirst({
          where: { ...where, city: location.city, district: location.district },
          orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
          select: {
            images: {
              where: { isCover: true },
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        });

        return {
          city: location.city,
          district: location.district,
          count: location._count._all,
          minPrice: location._min.price,
          imageUrl: roomWithCover?.images[0]?.url ?? null,
        };
      }),
    );
    await this.cache?.set(cacheKey, result, 60);
    return result;
  }

  private async invalidatePublicRoomCache() {
    await this.cache?.deleteByPrefix('roomrent:cache:rooms:');
  }

  async create(userId: string, dto: CreateRoomDto) {
    // A listing is useless without a way to reach the owner, and Google signups
    // start with neither a login phone nor a contact phone — make the client
    // collect one before the listing can exist.
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        phone: true,
        contactPhone: true,
        contactPhoneVerified: true,
        isPhoneVerified: true,
      },
    });
    if (!owner.contactPhone && !owner.phone) {
      throw new BadRequestException(
        'Add a contact phone number to your profile before posting a listing.',
      );
    }
    const contactPhoneVerified = owner.contactPhone
      ? owner.contactPhoneVerified ||
        (owner.contactPhone === owner.phone && owner.isPhoneVerified)
      : owner.isPhoneVerified;
    if (!contactPhoneVerified) {
      throw new BadRequestException(
        'Verify your contact phone number before posting a listing.',
      );
    }

    const room = await this.prisma.room.create({
      data: {
        ...dto,
        ownerId: userId,
        slug: uniqueSlug(dto.title),
        status: 'pending',
      },
    });
    await this.invalidatePublicRoomCache();
    return room;
  }

  async search(dto: SearchRoomsDto): Promise<RoomSearchResult> {
    if (
      dto.priceMin !== undefined &&
      dto.priceMax !== undefined &&
      dto.priceMin > dto.priceMax
    ) {
      throw new BadRequestException(
        'Minimum price must be less than or equal to maximum price.',
      );
    }
    if (
      dto.areaMin !== undefined &&
      dto.areaMax !== undefined &&
      dto.areaMin > dto.areaMax
    ) {
      throw new BadRequestException(
        'Minimum area must be less than or equal to maximum area.',
      );
    }

    const normalizedKey = JSON.stringify(
      Object.entries(dto)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [key, value]),
    );
    const cacheKey = `roomrent:cache:rooms:search:${createHash('sha256')
      .update(normalizedKey)
      .digest('hex')}`;
    const cached = await this.cache?.get<RoomSearchResult>(cacheKey);
    if (cached) return cached;

    const result = await this.searchUncached(dto);
    await this.cache?.set(cacheKey, result, 15);
    return result;
  }

  private async searchUncached(dto: SearchRoomsDto): Promise<RoomSearchResult> {
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

    // Keep keyword/radius filtering, counting, ordering, and pagination in
    // SQL. Fetching every matching id into Node makes popular searches grow
    // without bound and turns intersecting two scopes into O(n²) work.
    if (dto.keyword?.trim() || hasRadiusSearch) {
      return this.searchWithRawScope(dto, page, pageSize, hasRadiusSearch);
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
            AND EXISTS (
              SELECT 1 FROM users
              WHERE users.id = rooms.owner_id AND users.deleted_at IS NULL
            )
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
            AND EXISTS (
              SELECT 1 FROM users
              WHERE users.id = rooms.owner_id AND users.deleted_at IS NULL
            )
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
      owner: { is: { deletedAt: null } },
      ...(scopedIds && { id: { in: scopedIds } }),
      ...(dto.city && { city: dto.city }),
      ...(dto.district && { district: dto.district }),
      ...(dto.ward && { ward: dto.ward }),
      ...(dto.roomType && { roomType: dto.roomType }),
      ...((dto.priceMin !== undefined || dto.priceMax !== undefined) && {
        price: {
          ...(dto.priceMin !== undefined && { gte: dto.priceMin }),
          ...(dto.priceMax !== undefined && { lte: dto.priceMax }),
        },
      }),
      ...((dto.areaMin !== undefined || dto.areaMax !== undefined) && {
        area: {
          ...(dto.areaMin !== undefined && { gte: dto.areaMin }),
          ...(dto.areaMax !== undefined && { lte: dto.areaMax }),
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
      { id: 'desc' as const },
    ];

    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: PUBLIC_ROOM_LIST_SELECT,
      }),
      this.prisma.room.count({ where }),
    ]);

    return { rooms, total, page, pageSize };
  }

  private async searchWithRawScope(
    dto: SearchRoomsDto,
    page: number,
    pageSize: number,
    hasRadiusSearch: boolean,
  ) {
    const predicates: Prisma.Sql[] = [
      Prisma.sql`r.status = 'active'`,
      Prisma.sql`r.deleted_at IS NULL`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = r.owner_id AND u.deleted_at IS NULL
      )`,
    ];

    if (dto.city) predicates.push(Prisma.sql`r.city = ${dto.city}`);
    if (dto.district) predicates.push(Prisma.sql`r.district = ${dto.district}`);
    if (dto.ward) predicates.push(Prisma.sql`r.ward = ${dto.ward}`);
    if (dto.roomType)
      predicates.push(Prisma.sql`r.room_type = ${dto.roomType}`);
    if (dto.priceMin !== undefined)
      predicates.push(Prisma.sql`r.price >= ${dto.priceMin}`);
    if (dto.priceMax !== undefined)
      predicates.push(Prisma.sql`r.price <= ${dto.priceMax}`);
    if (dto.areaMin !== undefined)
      predicates.push(Prisma.sql`r.area >= ${dto.areaMin}`);
    if (dto.areaMax !== undefined)
      predicates.push(Prisma.sql`r.area <= ${dto.areaMax}`);
    if (dto.verifiedOnly) predicates.push(Prisma.sql`r.is_verified = true`);

    for (const amenityId of dto.amenityIds ?? []) {
      predicates.push(Prisma.sql`EXISTS (
        SELECT 1 FROM room_amenities ra
        WHERE ra.room_id = r.id AND ra.amenity_id = ${amenityId}
      )`);
    }

    const words = dto.keyword?.trim().split(/\s+/).filter(Boolean) ?? [];
    const textExpression = Prisma.sql`unaccent(
      concat_ws(' ', r.title, r.description, r.district, r.ward, r.address, r.city)
    )`;
    for (const word of words) {
      predicates.push(
        Prisma.sql`${textExpression} ILIKE unaccent(${'%' + word + '%'})`,
      );
    }

    let distanceExpression: Prisma.Sql | undefined;
    if (hasRadiusSearch) {
      const lat = dto.lat!;
      const lng = dto.lng!;
      const radiusKm = dto.radiusKm ?? 3;
      const latDelta = radiusKm / 111.045;
      const longitudeScale = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
      const lngDelta = radiusKm / (111.045 * longitudeScale);
      predicates.push(
        Prisma.sql`r.latitude BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
        Prisma.sql`r.longitude BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}`,
        Prisma.sql`r.latitude IS NOT NULL AND r.longitude IS NOT NULL`,
      );
      distanceExpression = Prisma.sql`6371 * 2 * asin(sqrt(
        power(sin(radians((${lat} - r.latitude) / 2)), 2) +
        cos(radians(${lat})) * cos(radians(r.latitude)) *
        power(sin(radians((${lng} - r.longitude) / 2)), 2)
      ))`;
      predicates.push(Prisma.sql`${distanceExpression} <= ${radiusKm}`);
    }

    const whereSql = Prisma.join(predicates, ' AND ');
    const orderBy =
      hasRadiusSearch && (!dto.sort || dto.sort === 'newest')
        ? Prisma.sql`r.is_verified DESC, distance_km ASC, r.created_at DESC, r.id DESC`
        : dto.sort === 'price_asc'
          ? Prisma.sql`r.is_verified DESC, r.price ASC, r.id DESC`
          : dto.sort === 'price_desc'
            ? Prisma.sql`r.is_verified DESC, r.price DESC, r.id DESC`
            : Prisma.sql`r.is_verified DESC, r.created_at DESC, r.id DESC`;
    const distanceSelect = distanceExpression
      ? Prisma.sql`, ${distanceExpression} AS distance_km`
      : Prisma.empty;
    const offset = (page - 1) * pageSize;

    const [countRows, pageRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM rooms r
        WHERE ${whereSql}
      `),
      this.prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
        SELECT r.id${distanceSelect}
        FROM rooms r
        WHERE ${whereSql}
        ORDER BY ${orderBy}
        OFFSET ${offset}
        LIMIT ${pageSize}
      `),
    ]);

    const ids = pageRows.map((row) => row.id);
    if (ids.length === 0) {
      return {
        rooms: [],
        total: Number(countRows[0]?.count ?? 0),
        page,
        pageSize,
      };
    }

    const fetchedRooms = await this.prisma.room.findMany({
      where: { id: { in: ids } },
      select: PUBLIC_ROOM_LIST_SELECT,
    });
    const byId = new Map(fetchedRooms.map((room) => [room.id, room]));
    return {
      rooms: ids.flatMap((id) => {
        const room = byId.get(id);
        return room ? [room] : [];
      }),
      total: Number(countRows[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async findActiveBySlug(slug: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        slug,
        status: 'active',
        deletedAt: null,
        owner: { is: { deletedAt: null } },
      },
      select: PUBLIC_ROOM_DETAIL_SELECT,
    });
    if (!room) throw new NotFoundException('Listing not found.');

    const {
      phone,
      contactPhone,
      isPhoneVerified,
      contactPhoneVerified: rawContactPhoneVerified,
      ...publicOwner
    } = room.owner;
    const hasVerifiedContactPhone = contactPhone
      ? rawContactPhoneVerified || (contactPhone === phone && isPhoneVerified)
      : isPhoneVerified;

    return {
      ...room,
      owner: {
        ...publicOwner,
        avatarUrl: publicCloudinaryAvatar(
          publicOwner.avatarUrl,
          publicOwner.id,
        ),
        contactPhoneMasked: maskPhone(contactPhone ?? phone),
        contactPhoneVerified: hasVerifiedContactPhone,
      },
      // flatten the join rows — the client only cares about the amenities themselves
      amenities: room.amenities.map((ra) => ra.amenity),
    };
  }

  async recordView(roomId: number, visitorId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        status: 'active',
        deletedAt: null,
        owner: { is: { deletedAt: null } },
      },
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
    const requiresReview =
      room.status === RoomStatus.active || room.status === RoomStatus.rejected;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.room.updateMany({
        where: {
          id: room.id,
          ownerId: userId,
          deletedAt: null,
          status: room.status,
        },
        data: {
          ...dto,
          ...(requiresReview
            ? {
                status: RoomStatus.pending,
                publishedAt: null,
                isVerified: false,
                verifiedAt: null,
              }
            : {}),
        },
      });
      if (result.count !== 1) {
        throw new BadRequestException(
          'Listing changed while you were editing. Refresh and try again.',
        );
      }
      return tx.room.findUniqueOrThrow({ where: { id: room.id } });
    });
    await this.invalidatePublicRoomCache();
    return updated;
  }

  async softDelete(userId: string, roomId: number) {
    const room = await this.findOwned(userId, roomId);
    const deleted = await this.prisma.room.update({
      where: { id: room.id },
      data: { deletedAt: new Date() },
    });
    await this.invalidatePublicRoomCache();
    return deleted;
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
    const createdImage = await this.prisma.$transaction(async (tx) => {
      // Serialize image-count/cover decisions per room. The partial unique
      // index protects the cover invariant; this lock also protects the
      // maximum-image count from concurrent confirmations.
      if (typeof tx.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${room.id})`;
      }
      const lockedImageCount =
        typeof tx.roomImage.count === 'function'
          ? await tx.roomImage.count({ where: { roomId: room.id } })
          : imageCount;
      const lockedCurrentCover =
        typeof tx.roomImage.findFirst === 'function'
          ? await tx.roomImage.findFirst({
              where: { roomId: room.id, isCover: true },
            })
          : currentCover;
      if (lockedImageCount >= ROOM_IMAGE_MAX_COUNT) {
        throw new BadRequestException(
          `A listing can have at most ${ROOM_IMAGE_MAX_COUNT} images.`,
        );
      }
      if (
        room.status === RoomStatus.active ||
        room.status === RoomStatus.rejected
      ) {
        const demoted = await tx.room.updateMany({
          where: {
            id: room.id,
            ownerId: userId,
            status: room.status,
            deletedAt: null,
          },
          data: {
            status: RoomStatus.pending,
            publishedAt: null,
            isVerified: false,
            verifiedAt: null,
          },
        });
        if (demoted.count !== 1) {
          throw new BadRequestException(
            'Listing changed while you were editing. Refresh and try again.',
          );
        }
      }
      const isCover = dto.isCover === true || lockedCurrentCover === null;
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
          position: lockedImageCount,
        },
      });
    });
    await this.invalidatePublicRoomCache();
    return createdImage;
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

    const updatedImage = await this.prisma.$transaction(async (tx) => {
      if (
        room.status === RoomStatus.active ||
        room.status === RoomStatus.rejected
      ) {
        const demoted = await tx.room.updateMany({
          where: {
            id: room.id,
            ownerId: userId,
            status: room.status,
            deletedAt: null,
          },
          data: {
            status: RoomStatus.pending,
            publishedAt: null,
            isVerified: false,
            verifiedAt: null,
          },
        });
        if (demoted.count !== 1) {
          throw new BadRequestException(
            'Listing changed while you were editing. Refresh and try again.',
          );
        }
      }
      await tx.roomImage.updateMany({
        where: { roomId: room.id, isCover: true },
        data: { isCover: false },
      });
      return tx.roomImage.update({
        where: { id: image.id },
        data: { isCover: true },
      });
    });
    await this.invalidatePublicRoomCache();
    return updatedImage;
  }

  // Replaces the full amenity set (idempotent) rather than diffing — the form
  // always submits the complete selected list, same pattern as the seed script.
  async setAmenities(userId: string, roomId: number, amenityIds: number[]) {
    const room = await this.findOwned(userId, roomId);
    await this.prisma.$transaction(async (tx) => {
      if (
        room.status === RoomStatus.active ||
        room.status === RoomStatus.rejected
      ) {
        const demoted = await tx.room.updateMany({
          where: {
            id: room.id,
            ownerId: userId,
            status: room.status,
            deletedAt: null,
          },
          data: {
            status: RoomStatus.pending,
            publishedAt: null,
            isVerified: false,
            verifiedAt: null,
          },
        });
        if (demoted.count !== 1) {
          throw new BadRequestException(
            'Listing changed while you were editing. Refresh and try again.',
          );
        }
      }
      await tx.roomAmenity.deleteMany({ where: { roomId: room.id } });
      await tx.roomAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ roomId: room.id, amenityId })),
      });
    });
    await this.invalidatePublicRoomCache();
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
      if (
        room.status === RoomStatus.active ||
        room.status === RoomStatus.rejected
      ) {
        const demoted = await tx.room.updateMany({
          where: {
            id: room.id,
            ownerId: userId,
            status: room.status,
            deletedAt: null,
          },
          data: {
            status: RoomStatus.pending,
            publishedAt: null,
            isVerified: false,
            verifiedAt: null,
          },
        });
        if (demoted.count !== 1) {
          throw new BadRequestException(
            'Listing changed while you were editing. Refresh and try again.',
          );
        }
      }
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
    await this.invalidatePublicRoomCache();
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
