import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RoomType } from '../../../../generated/prisma/client';
import { CreateRoomDto } from './create-room.dto';

const validInput = {
  title: 'Phòng trọ gần trường đại học',
  roomType: RoomType.boarding_house,
  price: 2_500_000,
  city: 'Hồ Chí Minh',
  district: 'Quận 7',
  latitude: 10.734,
  longitude: 106.7215,
};

async function validateInput(overrides: Partial<typeof validInput>) {
  return validate(
    plainToInstance(CreateRoomDto, { ...validInput, ...overrides }),
  );
}

describe('CreateRoomDto coordinates', () => {
  it('accepts valid latitude and longitude', async () => {
    await expect(validateInput({})).resolves.toHaveLength(0);
  });

  it.each([
    ['latitude', 90.0001],
    ['latitude', -90.0001],
    ['longitude', 180.0001],
    ['longitude', -180.0001],
  ] as const)('rejects an invalid %s', async (field, value) => {
    const errors = await validateInput({ [field]: value });

    expect(errors.some((error) => error.property === field)).toBe(true);
  });

  it('keeps coordinates optional for existing API clients', async () => {
    const dto = { ...validInput };
    delete (dto as Partial<typeof validInput>).latitude;
    delete (dto as Partial<typeof validInput>).longitude;

    await expect(
      validate(plainToInstance(CreateRoomDto, dto)),
    ).resolves.toHaveLength(0);
  });
});
