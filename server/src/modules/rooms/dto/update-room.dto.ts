import { PartialType } from '@nestjs/swagger';
import { CreateRoomDto } from './create-room.dto';

// Only editable listing fields — status/isVerified/ownerId are never client-settable,
// they change exclusively via the (future) admin moderation module.
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
