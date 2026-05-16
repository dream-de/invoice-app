CREATE OR REPLACE FUNCTION enforce_user_license_limit()
RETURNS trigger AS $$
DECLARE
  current_active_users integer;
  allowed_users integer;
  active_plan text;
BEGIN
  IF NEW."status" IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT "plan", "maxUsers"
  INTO active_plan, allowed_users
  FROM "License"
  WHERE "status" = 'active'
    AND ("validUntil" IS NULL OR "validUntil" >= NOW())
  ORDER BY "updatedAt" DESC
  LIMIT 1;

  IF active_plan = 'unlimited' THEN
    RETURN NEW;
  END IF;

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

DROP TRIGGER IF EXISTS user_license_limit_before_insert_update ON "User";

CREATE TRIGGER user_license_limit_before_insert_update
BEFORE INSERT OR UPDATE OF "status" ON "User"
FOR EACH ROW
EXECUTE FUNCTION enforce_user_license_limit();
