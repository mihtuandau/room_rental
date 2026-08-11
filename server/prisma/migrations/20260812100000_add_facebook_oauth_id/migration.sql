-- Add the Facebook OAuth identifier declared by User.facebookId in the Prisma schema.
ALTER TABLE "users" ADD COLUMN "facebook_id" TEXT;

CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");
