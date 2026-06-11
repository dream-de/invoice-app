import { prisma } from "@dream-invoice/database"
import { hashLicenseKey, verifyLicenseKey } from "./keys"

type LicenseTransaction = {
  license: {
    updateMany: typeof prisma.license.updateMany
    upsert: typeof prisma.license.upsert
  }
  licenseIssue: {
    updateMany: typeof prisma.licenseIssue.updateMany
  }
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
      maxUsers: payload.maxUsers,
      status: "active",
      company: payload.customerName ?? null,
      validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      activatedAt: new Date(),
      features: {
        signed: check.signedPayload.features ?? {},
        limits: check.signedPayload.limits ?? {},
        licenseId: check.signedPayload.licenseId,
        edition: check.signedPayload.edition ?? "self-hosted",
        issuedAt: check.signedPayload.issuedAt
      }
    }
  }
}

export async function activateLicenseKey(licenseKey: string) {
  const prepared = toLicenseData(licenseKey)

  if (!prepared.ok) {
    return prepared
  }

  const { keyHash, ...licenseData } = prepared.data

  if (!process.env.DATABASE_URL) {
    return {
      ok: true as const,
      license: {
        id: "demo-license",
        keyHash,
        ...licenseData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      mode: "demo" as const
    }
  }

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

  await prisma.licenseIssue.updateMany({
    where: { keyHash },
    data: {
      status: "activated",
      activatedAt: license.activatedAt ?? new Date(),
      activatedLicenseId: license.id
    }
  })

  return {
    ok: true as const,
    license
  }
}
