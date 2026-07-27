---
name: saved-search-notification-job
description: Build the background job that scans saved_searches and sends notifications when a new room matches the criteria, using BullMQ + Redis + @nestjs/schedule for the RoomRent backend. MUST use this skill for "saved search", "notify on new rooms", "alert when a room matches criteria", or any background/scheduled task — unlike add-nest-module, this is asynchronous processing (producer/processor), not a regular HTTP request/response.
---

# Background job: Saved Search → Notification (BullMQ + Redis)

This task runs in the background, outside the HTTP request lifecycle — fully separate from typical CRUD controllers/services. There are 2 complementary triggers: **event-driven** (when a new room is approved to `active`) and **periodic cron scan** (a safety net so nothing is missed).

## Principles

- Don't send notifications inside the transaction that creates/approves a room — only **enqueue a job**; the actual sending (email/SMS/push) is handled separately in the processor so it doesn't slow down the HTTP response and doesn't cause an accidental rollback if sending fails.
- Idempotent: a room should only notify a given saved search once (avoid spamming if the job retries).
- Rate-limit notifications per user (don't flood them).

## Template: Prisma models

```prisma
model SavedSearch {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  city      String?
  district  String?
  roomType  RoomType? @map("room_type")
  priceMax  Int?      @map("price_max")

  lastNotifiedAt DateTime? @map("last_notified_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([city, district])
  @@map("saved_searches")
}

model NotificationLog {
  id            String   @id @default(cuid())
  savedSearchId String   @map("saved_search_id")
  roomId        Int      @map("room_id")
  createdAt     DateTime @default(now()) @map("created_at")

  @@unique([savedSearchId, roomId]) // prevents duplicate notifications for the same room
  @@map("notification_logs")
}
```

## Template: registering the BullMQ queue

`src/modules/notifications/notifications.module.ts`
```ts
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [
    BullModule.registerQueue({ name: "saved-search-notifications" }),
  ],
  providers: [NotificationsProcessor, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

`src/app.module.ts` — configure the Redis connection once, globally:
```ts
BullModule.forRoot({
  connection: { url: process.env.REDIS_URL },
}),
```

## Template: Producer — enqueue when admin approves a room to `active`

`src/modules/notifications/notifications.service.ts`
```ts
import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue("saved-search-notifications") private queue: Queue) {}

  async onRoomApproved(roomId: number) {
    // event-driven: call this right after RoomsService.approve() succeeds
    await this.queue.add("match-room", { roomId }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  }
}
```

Called from `RoomsService.approve()` (in the `admin`/`rooms` module):
```ts
async approve(roomId: number) {
  const room = await this.prisma.room.update({ where: { id: roomId }, data: { status: "active" } });
  await this.notificationsService.onRoomApproved(room.id);
  return room;
}
```

## Template: Processor — find matching saved searches + send notifications

`src/modules/notifications/notifications.processor.ts`
```ts
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";

@Processor("saved-search-notifications")
export class NotificationsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ roomId: number }>) {
    const room = await this.prisma.room.findUnique({ where: { id: job.data.roomId } });
    if (!room || room.status !== "active") return;

    const matches = await this.prisma.savedSearch.findMany({
      where: {
        city: room.city,
        ...(room.district && { OR: [{ district: null }, { district: room.district }] }),
        ...(room.roomType && { OR: [{ roomType: null }, { roomType: room.roomType }] }),
        ...(room.price && { OR: [{ priceMax: null }, { priceMax: { gte: room.price } }] }),
      },
      include: { user: true },
    });

    for (const search of matches) {
      // idempotent: unique constraint blocks duplicate sends, skip if already exists
      try {
        await this.prisma.notificationLog.create({
          data: { savedSearchId: search.id, roomId: room.id },
        });
      } catch {
        continue; // already notified before (P2002 unique violation) → skip
      }
      await this.sendNotification(search.user, room);
    }
  }

  private async sendNotification(user: { phone: string }, room: { title: string; slug: string }) {
    // send SMS/email/push depending on infra — don't throw so one user's failure doesn't fail the whole job
  }
}
```

## Template: periodic cron scan (safety net for anything event-driven missed)

`src/modules/notifications/saved-search.cron.ts`
```ts
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class SavedSearchCron {
  constructor(private prisma: PrismaService, @InjectQueue("saved-search-notifications") private queue: Queue) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scanRecentActiveRooms() {
    const rooms = await this.prisma.room.findMany({
      where: { status: "active", publishedAt: { gte: new Date(Date.now() - 60 * 60_000) } },
      select: { id: true },
    });
    for (const room of rooms) {
      await this.queue.add("match-room", { roomId: room.id }, { attempts: 3 });
    }
  }
}
```

## Do NOT
- Send notifications (SMS/email) synchronously inside the admin's room-approval request — it must go through the queue.
- Skip `@@unique([savedSearchId, roomId])` on `NotificationLog` — without it, retries/cron scans will send duplicate notifications.
- Let the processor throw and kill the whole job when one user in the list fails — catch errors per-user and keep looping.
- Forget to configure `attempts`/`backoff` for the job — notification jobs can fail transiently (SMS provider down), so they need retries.

## Checklist
- [ ] Enqueue a job (not a synchronous send) as soon as a room becomes `active`
- [ ] `NotificationLog` has a unique constraint preventing duplicate sends
- [ ] Processor catches errors per-user, one failure doesn't fail the whole job
- [ ] Job has `attempts` + `backoff` for retries
- [ ] A periodic cron scan exists as a safety net, not relying solely on event-driven triggers
