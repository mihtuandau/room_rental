-- AlterTable
ALTER TABLE "room_views" ADD COLUMN "dedupe_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "room_views_dedupe_key_key" ON "room_views"("dedupe_key");
