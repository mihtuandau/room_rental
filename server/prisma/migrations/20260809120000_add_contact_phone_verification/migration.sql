-- Add an explicit verification state for the phone shown to tenants.
ALTER TABLE "users"
ADD COLUMN "contact_phone_verified" BOOLEAN NOT NULL DEFAULT false;
