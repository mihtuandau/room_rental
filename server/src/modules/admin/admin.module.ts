import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminRoomsController } from './rooms/admin-rooms.controller';
import { AdminRoomsService } from './rooms/admin-rooms.service';
import { AdminReportsController } from './reports/admin-reports.controller';
import { AdminReportsService } from './reports/admin-reports.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminAmenitiesController } from './amenities/admin-amenities.controller';
import { AdminAmenitiesService } from './amenities/admin-amenities.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';

// Single "admin" module per CLAUDE.md §4 — split into per-resource
// controller/service files internally rather than separate NestJS modules.
@Module({
  imports: [NotificationsModule],
  controllers: [
    AdminRoomsController,
    AdminReportsController,
    AdminUsersController,
    AdminDashboardController,
    AdminAmenitiesController,
  ],
  providers: [
    AdminRoomsService,
    AdminReportsService,
    AdminUsersService,
    AdminDashboardService,
    AdminAmenitiesService,
    RedisCacheService,
  ],
})
export class AdminModule {}
