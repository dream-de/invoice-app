import { createHash } from "node:crypto"
import { prisma } from "@dream-invoice/database"
import { verifyLicenseKey } from "./keys"

type LicenseTransaction = {
  license: {
    updateMany: typeof prisma.license.updateMany
    upsert: typeof prisma.license.upsert
  }
}

function hashLicenseKey(licenseKey: string) {
  return createHash("sha256").update(licenseKey.trim()).digest("hex")
}

function toLicenseData(licenseKey: string) {
  const check = verifyLicenseKey(licenseKey)

  if (!check.valid) {
    return {
      ok: false as const,
      error: check.reason
    }
  }

  const { payload } = check

  return {
    ok: true as const,
    data: {
      keyHash: hashLicenseKey(licenseKey),
      plan: payload.plan,
      billingCycle: payload.billingCycle,
      maxUsers: payload.maxUsers ?? undefined,
      status: "active",
      company: payload.customerName ?? null,
      validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      activatedAt: new Date(),
      features: {}
    }
  }
}

export async function activateLicenseKey(licenseKey: string) {
  const prepared = toLicenseData(licenseKey)

  if (!prepared.ok) {
    return prepared
  }

  const { keyHash, ...licenseData } = prepared.data

  const license = await prisma.$transaction(async (tx: LicenseTransaction) => {
    await tx.license.updateMany({
      where: { status: "active" },
      data: { status: "revoked" }
    })

    return tx.license.upsert({
      where: { keyHash },
      create: {
        keyHash,
        ...licenseData
      },
      update: licenseData
    })
  })

  return {
    ok: true as const,
    license
  }
}
