import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { RequestBodyError, readJsonBodyWithLimit } from "@/lib/http/request-body"
import { generateLicenseKey, type GenerateLicenseKeyInput } from "@/lib/license/issue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await requireCurrentUserRole(["admin"])
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  const issues = await prisma.licenseIssue.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      licenseId: true,
      keyPreview: true,
      plan: true,
      billingCycle: true,
      maxUsers: true,
      status: true,
      customerName: true,
      validUntil: true,
      activatedAt: true,
      createdAt: true
    }
  })

  return NextResponse.json({ ok: true, issues })
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

  let body: GenerateLicenseKeyInput

  try {
    body = await readJsonBodyWithLimit<GenerateLicenseKeyInput>(req, {
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

  try {
    const result = await generateLicenseKey(body, actor.id)

    await writeAuditLog({
      action: "license.generate",
      entity: "license_issue",
      entityId: result.license.licenseId,
      reason: "License key generated",
      data: {
        actorUserId: actor.id,
        keyPreview: result.license.keyPreview,
        plan: result.license.plan,
        billingCycle: result.license.billingCycle,
        maxUsers: result.license.maxUsers,
        customerId: result.license.customerId,
        customerName: result.license.customerName,
        validUntil: result.license.validUntil
      }
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lizenzschluessel konnte nicht erzeugt werden."
    const status = message.includes("LICENSE_PRIVATE_KEY") ? 503 : 400

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    )
  }
}
