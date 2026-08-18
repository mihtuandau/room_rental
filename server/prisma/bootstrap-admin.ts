import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../dist/generated/prisma/client';

const phone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const fullName =
  process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Quản trị RoomRent';

if (!phone || !password) {
  throw new Error(
    'BOOTSTRAP_ADMIN_PHONE and BOOTSTRAP_ADMIN_PASSWORD are required',
  );
}

if (password.length < 12) {
  throw new Error('Bootstrap admin password must be at least 12 characters');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const existing = await prisma.user.findUnique({
    where: { phone },
  });

  if (existing) {
    if (existing.role !== Role.admin) {
      throw new Error(
        `Phone ${phone} already belongs to a non-admin account`,
      );
    }

    console.log('Admin already exists. Nothing to do.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      phone,
      passwordHash,
      fullName,
      role: Role.admin,
      isPhoneVerified: true,
    },
  });

  console.log(`Admin account created for ${phone}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });