UPDATE "User"
SET "role" = CASE
  WHEN "role" = 'owner' THEN 'admin'
  WHEN "role" = 'accountant' THEN 'user'
  ELSE "role"
END
WHERE "role" IN ('owner', 'accountant');

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';
