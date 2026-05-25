CREATE OR REPLACE FUNCTION enforce_user_license_limit()
RETURNS trigger AS $$
DECLARE
  current_active_users integer;
  allowed_users integer;
BEGIN
  IF NEW."status" IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT "maxUsers"
  INTO allowed_users
  FROM "License"
  WHERE "status" = 'active'
    AND ("validUntil" IS NULL OR "validUntil" >= NOW())
  ORDER BY "updatedAt" DESC
  LIMIT 1;

  IF allowed_users IS NULL THEN
    allowed_users := 5;
  END IF;

  SELECT COUNT(*)
  INTO current_active_users
  FROM "User"
  WHERE "status" = 'active'
    AND "id" <> NEW."id";

  IF current_active_users >= allowed_users THEN
    RAISE EXCEPTION 'Benutzerlimit erreicht (%/%). Bitte Lizenz erweitern.',
      current_active_users,
      allowed_users
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "License" DROP CONSTRAINT IF EXISTS license_plan_allowed;
ALTER TABLE "License"
ADD CONSTRAINT license_plan_allowed
CHECK ("plan" IN ('free', 'starter', 'pro', 'team', 'business', 'enterprise', 'unlimited'));

ALTER TABLE "License" DROP CONSTRAINT IF EXISTS license_user_limit_allowed;
ALTER TABLE "License"
ADD CONSTRAINT license_user_limit_allowed
CHECK ("maxUsers" BETWEEN 1 AND 1000000);

CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User" ("status");
CREATE INDEX IF NOT EXISTS "License_status_validUntil_updatedAt_idx" ON "License" ("status", "validUntil", "updatedAt");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice" ("customerId");
CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice" ("projectId");
CREATE INDEX IF NOT EXISTS "Project_customerId_idx" ON "Project" ("customerId");
