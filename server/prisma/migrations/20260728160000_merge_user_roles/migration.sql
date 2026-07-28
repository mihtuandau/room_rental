-- Replace the account-mode roles with one ordinary user role.
-- Existing tenant and landlord accounts keep all data and become `user`.
BEGIN;

CREATE TYPE "Role_new" AS ENUM ('user', 'admin');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE
    WHEN "role"::text = 'admin' THEN 'admin'
    ELSE 'user'
  END
)::"Role_new";

ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

COMMIT;
