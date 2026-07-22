import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import slugifyLib from 'slugify';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  RoomType,
  RoomStatus,
  AmenityType,
  Amenity,
  // The generated client's .ts source uses Node16/NodeNext-style ".js" extension
  // imports that plain ts-node can't resolve — run against the compiled output
  // instead (same as every other one-off script in this project). Run
  // `pnpm run build` first if this file is missing.
} from '../dist/generated/prisma/client';

function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true, locale: 'vi' });
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORD_HASH_COST = 12;
const SEED_PASSWORD = 'Passw0rd!'; // dev-only, same for every seeded account

async function seedUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, PASSWORD_HASH_COST);

  const admin = await prisma.user.upsert({
    where: { phone: '0900000000' },
    update: {},
    create: {
      phone: '0900000000',
      passwordHash,
      fullName: 'RoomRent Admin',
      role: Role.admin,
      isPhoneVerified: true,
    },
  });

  const landlord = await prisma.user.upsert({
    where: { phone: '0911111111' },
    update: {},
    create: {
      phone: '0911111111',
      passwordHash,
      fullName: 'Landlord Demo',
      role: Role.landlord,
      isPhoneVerified: true,
      contactPhone: '0911111111',
      zaloUrl: 'https://zalo.me/0911111111',
    },
  });

  const tenant = await prisma.user.upsert({
    where: { phone: '0922222222' },
    update: {},
    create: {
      phone: '0922222222',
      passwordHash,
      fullName: 'Tenant Demo',
      role: Role.tenant,
      isPhoneVerified: true,
    },
  });

  return { admin, landlord, tenant };
}

async function seedAmenities(): Promise<Amenity[]> {
  const catalog: { name: string; type: AmenityType; icon: string }[] = [
    { name: 'WiFi', type: AmenityType.basic, icon: 'wifi' },
    { name: 'Điều hòa', type: AmenityType.basic, icon: 'ac' },
    { name: 'Nóng lạnh', type: AmenityType.basic, icon: 'water-heater' },
    { name: 'Tủ lạnh', type: AmenityType.basic, icon: 'fridge' },
    { name: 'Ban công', type: AmenityType.basic, icon: 'balcony' },
    { name: 'Nội thất đầy đủ', type: AmenityType.basic, icon: 'furniture' },
    { name: 'Cho nuôi thú cưng', type: AmenityType.basic, icon: 'pet' },
    { name: 'Máy giặt', type: AmenityType.utility, icon: 'washing-machine' },
    { name: 'Thang máy', type: AmenityType.utility, icon: 'elevator' },
    { name: 'Chỗ để xe', type: AmenityType.utility, icon: 'parking' },
    { name: 'Bảo vệ 24/7', type: AmenityType.security, icon: 'shield' },
    { name: 'Camera an ninh', type: AmenityType.security, icon: 'camera' },
    { name: 'Gần chợ', type: AmenityType.nearby, icon: 'market' },
    { name: 'Gần trường học', type: AmenityType.nearby, icon: 'school' },
    { name: 'Gần bệnh viện', type: AmenityType.nearby, icon: 'hospital' },
  ];

  const amenities: Amenity[] = [];
  for (const item of catalog) {
    const slug = slugify(item.name);
    const amenity = await prisma.amenity.upsert({
      where: { slug },
      update: {},
      create: { ...item, slug },
    });
    amenities.push(amenity);
  }
  return amenities;
}

interface SeedRoom {
  title: string;
  roomType: RoomType;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  city: string;
  district: string;
  ward?: string;
  description: string;
  status: RoomStatus;
  isVerified: boolean;
  amenityNames: string[];
}

const SEED_ROOMS: SeedRoom[] = [
  {
    title: 'Phòng trọ full nội thất gần ĐH Bách Khoa',
    roomType: RoomType.boarding_house,
    price: 2500000,
    area: 20,
    city: 'Hồ Chí Minh',
    district: 'Quận 10',
    description: 'Phòng sạch sẽ, an ninh, giờ giấc tự do, gần trường đại học.',
    status: RoomStatus.active,
    isVerified: true,
    amenityNames: ['WiFi', 'Điều hòa', 'Nội thất đầy đủ', 'Gần trường học'],
  },
  {
    title: 'Nhà nguyên căn 2 tầng khu dân cư yên tĩnh',
    roomType: RoomType.whole_house,
    price: 8000000,
    area: 60,
    bedrooms: 3,
    bathrooms: 2,
    city: 'Hồ Chí Minh',
    district: 'Bình Thạnh',
    description: 'Nhà riêng, có sân trước, phù hợp gia đình hoặc ở ghép.',
    status: RoomStatus.active,
    isVerified: true,
    amenityNames: ['Chỗ để xe', 'Ban công', 'Camera an ninh'],
  },
  {
    title: 'Chung cư mini cao cấp view thành phố',
    roomType: RoomType.mini_apartment,
    price: 5500000,
    area: 35,
    bedrooms: 1,
    bathrooms: 1,
    city: 'Hồ Chí Minh',
    district: 'Quận 7',
    description: 'Toà nhà có thang máy, bảo vệ 24/7, nội thất đầy đủ.',
    status: RoomStatus.active,
    isVerified: true,
    amenityNames: ['Thang máy', 'Bảo vệ 24/7', 'Điều hòa', 'Nội thất đầy đủ'],
  },
  {
    title: 'Căn hộ dịch vụ full đồ dùng, điện nước giá dân',
    roomType: RoomType.serviced_apartment,
    price: 4200000,
    area: 28,
    city: 'Hồ Chí Minh',
    district: 'Tân Bình',
    description: 'Điện nước theo giá nhà nước, ra vào bằng vân tay.',
    status: RoomStatus.active,
    isVerified: false,
    amenityNames: ['WiFi', 'Nóng lạnh', 'Máy giặt'],
  },
  {
    title: 'Phòng ở ghép sinh viên giá rẻ',
    roomType: RoomType.shared_room,
    price: 1200000,
    area: 15,
    city: 'Hồ Chí Minh',
    district: 'Thủ Đức',
    description: 'Phù hợp sinh viên, ở ghép 2-3 người, gần chợ.',
    status: RoomStatus.active,
    isVerified: false,
    amenityNames: ['WiFi', 'Gần chợ'],
  },
  {
    title: 'Phòng trọ mới xây, chưa ai ở',
    roomType: RoomType.boarding_house,
    price: 3000000,
    area: 22,
    city: 'Hồ Chí Minh',
    district: 'Gò Vấp',
    description: 'Phòng mới 100%, nội thất cơ bản, an ninh tốt.',
    status: RoomStatus.active,
    isVerified: true,
    amenityNames: ['WiFi', 'Điều hòa', 'Chỗ để xe', 'Camera an ninh'],
  },
  {
    title: 'Căn hộ mini gần bệnh viện Thủ Đức',
    roomType: RoomType.mini_apartment,
    price: 3800000,
    area: 25,
    city: 'Hồ Chí Minh',
    district: 'Thủ Đức',
    description: 'Thuận tiện đi lại, gần bệnh viện và trường học.',
    status: RoomStatus.pending, // demo: awaiting admin review
    isVerified: false,
    amenityNames: ['WiFi', 'Gần bệnh viện'],
  },
  {
    title: 'Phòng trọ rộng rãi, cho nuôi thú cưng',
    roomType: RoomType.boarding_house,
    price: 2800000,
    area: 24,
    city: 'Hồ Chí Minh',
    district: 'Bình Tân',
    description: 'Chủ nhà dễ tính, cho nuôi chó mèo, không chung chủ.',
    status: RoomStatus.pending, // demo: awaiting admin review
    isVerified: false,
    amenityNames: ['Cho nuôi thú cưng', 'Chỗ để xe'],
  },
];

async function seedRooms(landlordId: string, amenities: Amenity[]) {
  const byName = new Map(amenities.map((a) => [a.name, a]));

  for (const seedRoom of SEED_ROOMS) {
    const slug = slugify(seedRoom.title);
    const { amenityNames, ...roomData } = seedRoom;

    const room = await prisma.room.upsert({
      where: { slug },
      update: {},
      create: {
        ...roomData,
        slug,
        ownerId: landlordId,
        publishedAt: seedRoom.status === RoomStatus.active ? new Date() : null,
      },
    });

    // idempotent: replace the amenity set every run instead of accumulating duplicates
    const amenityIds = amenityNames.map((name) => byName.get(name)?.id).filter((id): id is number => !!id);
    await prisma.$transaction([
      prisma.roomAmenity.deleteMany({ where: { roomId: room.id } }),
      prisma.roomAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ roomId: room.id, amenityId })),
      }),
    ]);

    // placeholder cover image — not a real Cloudinary asset, just enough for the
    // frontend to render a thumbnail in dev. Skip if this room already has one.
    const hasImage = await prisma.roomImage.findFirst({ where: { roomId: room.id } });
    if (!hasImage) {
      await prisma.roomImage.create({
        data: {
          roomId: room.id,
          key: `seed/placeholder-${room.id}`,
          url: `https://picsum.photos/seed/room-${room.id}/800/600`,
          isCover: true,
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding users...');
  const { admin, landlord, tenant } = await seedUsers();
  console.log(`  admin=${admin.phone} landlord=${landlord.phone} tenant=${tenant.phone} (password: ${SEED_PASSWORD})`);

  console.log('Seeding amenity catalog...');
  const amenities = await seedAmenities();
  console.log(`  ${amenities.length} amenities`);

  console.log('Seeding sample rooms...');
  await seedRooms(landlord.id, amenities);
  console.log(`  ${SEED_ROOMS.length} rooms (2 left "pending" to populate the admin review queue)`);

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
