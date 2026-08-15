-- Generated from the current database with `prisma migrate diff`.
-- This migration is intentionally additive: old province/district/ward name
-- snapshots remain available while new listings can use current location codes.

-- ContactType.message was never implemented; keep the database contract honest.
BEGIN;
CREATE TYPE "ContactType_new" AS ENUM ('phone', 'zalo');
ALTER TABLE "contact_logs"
  ALTER COLUMN "type" TYPE "ContactType_new"
  USING ("type"::text::"ContactType_new");
ALTER TYPE "ContactType" RENAME TO "ContactType_old";
ALTER TYPE "ContactType_new" RENAME TO "ContactType";
DROP TYPE "public"."ContactType_old";
COMMIT;

ALTER TABLE "landmarks"
  ADD COLUMN "province_code" INTEGER,
  ADD COLUMN "ward_code" INTEGER,
  ALTER COLUMN "district" DROP NOT NULL;

ALTER TABLE "otp_codes"
  ADD COLUMN "revoked_at" TIMESTAMP(3);

ALTER TABLE "rooms"
  ADD COLUMN "province_code" INTEGER,
  ADD COLUMN "ward_code" INTEGER,
  ALTER COLUMN "district" DROP NOT NULL;

ALTER TABLE "saved_searches"
  ADD COLUMN "province_code" INTEGER,
  ADD COLUMN "ward_code" INTEGER;

CREATE INDEX "landmarks_province_code_ward_code_idx"
  ON "landmarks"("province_code", "ward_code");
CREATE INDEX "otp_codes_phone_purpose_revoked_at_idx"
  ON "otp_codes"("phone", "purpose", "revoked_at");
CREATE INDEX "otp_codes_email_purpose_revoked_at_idx"
  ON "otp_codes"("email", "purpose", "revoked_at");
CREATE INDEX "rooms_province_code_ward_code_idx"
  ON "rooms"("province_code", "ward_code");
CREATE INDEX "saved_searches_province_code_ward_code_idx"
  ON "saved_searches"("province_code", "ward_code");

-- NOT VALID preserves existing legacy rows while enforcing the invariant on
-- every new or updated row. A later data-quality migration can validate them.
ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_price_positive"
  CHECK ("price" > 0) NOT VALID;
ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_area_positive"
  CHECK ("area" IS NULL OR "area" > 0) NOT VALID;
ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_deposit_nonnegative"
  CHECK ("deposit" IS NULL OR "deposit" >= 0) NOT VALID;
