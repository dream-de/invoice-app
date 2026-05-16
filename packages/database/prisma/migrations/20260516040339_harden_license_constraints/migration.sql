DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_plan_allowed'
  ) THEN
    ALTER TABLE "License"
    ADD CONSTRAINT license_plan_allowed
    CHECK ("plan" IN ('free', 'starter', 'team', 'business', 'enterprise', 'unlimited'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_billing_cycle_allowed'
  ) THEN
    ALTER TABLE "License"
    ADD CONSTRAINT license_billing_cycle_allowed
    CHECK ("billingCycle" IN ('free', 'monthly', 'yearly', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_status_allowed'
  ) THEN
    ALTER TABLE "License"
    ADD CONSTRAINT license_status_allowed
    CHECK ("status" IN ('active', 'expired', 'revoked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_user_limit_allowed'
  ) THEN
    ALTER TABLE "License"
    ADD CONSTRAINT license_user_limit_allowed
    CHECK (
      ("plan" = 'unlimited' AND "maxUsers" IS NULL)
      OR
      ("plan" <> 'unlimited' AND "maxUsers" IN (5,10,15,20,25,30,35,40,45,50,100))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_monthly_yearly_requires_expiry'
  ) THEN
    ALTER TABLE "License"
    ADD CONSTRAINT license_monthly_yearly_requires_expiry
    CHECK (
      "billingCycle" NOT IN ('monthly', 'yearly')
      OR "validUntil" IS NOT NULL
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS license_single_active_idx
ON "License" ("status")
WHERE "status" = 'active';
