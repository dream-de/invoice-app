import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { RequestBodyError, readJsonBodyWithLimit } from "@/lib/http/request-body"
import { hashLicenseKey, previewLicenseKey, verifyLicenseKey } from "@/lib/license/keys"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type VerifyLicenseBody = {
  licenseKey?: unknown
}

export async function POST(req: Request) {
  let actor

  try {
    actor = await requireCurrentUserRole(["admin"])
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  let body: VerifyLicenseBody

  try {
    body = await readJsonBodyWithLimit<VerifyLicenseBody>(req, {
      invalidJson: "throw",
      maxBytes: 16 * 1024
    })
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    throw error
  }

  if (typeof body.licenseKey !== "string" || body.licenseKey.trim().length < 20) {
    return NextResponse.json(
      { ok: false, error: "Lizenzschluessel fehlt oder ist ungueltig." },
      { status: 400 }
    )
  }

  const licenseKey = body.licenseKey.trim()
  const keyHash = hashLicenseKey(licenseKey)
  const keyPreview = previewLicenseKey(licenseKey)
  const result = verifyLicenseKey(licenseKey)

  if (!result.valid) {
    await writeAuditLog({
      action: "license.verify",
      entity: "license_issue",
      entityId: null,
      reason: "License key verification failed",
      data: {
        actorUserId: actor.id,
        keyPreview,
        valid: false,
        reason: result.reason
      }
    })

    return NextResponse.json(
      { ok: false, error: result.reason, keyPreview },
      { status: 400 }
    )
  }

  const issue = await prisma.licenseIssue.findUnique({
    where: { keyHash },
    select: {
      licenseId: true,
      status: true,
      customerName: true,
      validUntil: true,
      activatedAt: true
    }
  })

  await writeAuditLog({
    action: "license.verify",
    entity: "license_issue",
    entityId: result.payload.licenseId,
    reason: "License key verified",
    data: {
      actorUserId: actor.id,
      keyPreview,
      valid: true,
      plan: result.payload.plan,
      billingCycle: result.payload.billingCycle,
      maxUsers: result.payload.maxUsers,
      validUntil: result.payload.validUntil,
      issuedStatus: issue?.status ?? "external"
    }
  })

  return NextResponse.json({
    ok: true,
    keyPreview,
    license: result.payload,
    issue: issue
      ? {
          licenseId: issue.licenseId,
          status: issue.status,
          customerName: issue.customerName,
          validUntil: issue.validUntil,
          activatedAt: issue.activatedAt
        }
      : null
  })
}
