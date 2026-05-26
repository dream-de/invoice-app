import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { activateLicenseKey } from "@/lib/license/activate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ActivateLicenseBody = {
  licenseKey?: unknown
}

export async function POST(req: Request) {
  let actor

  try {
    actor = await requireCurrentUserRole(["owner", "admin"])
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  let body: ActivateLicenseBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungueltige Anfrage." },
      { status: 400 }
    )
  }

  if (typeof body.licenseKey !== "string" || body.licenseKey.trim().length < 20) {
    return NextResponse.json(
      { ok: false, error: "Lizenzschluessel fehlt oder ist ungueltig." },
      { status: 400 }
    )
  }

  const result = await activateLicenseKey(body.licenseKey)

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 }
    )
  }

  await writeAuditLog({
    action: "license.activate",
    entity: "license",
    entityId: result.license.id,
    reason: "License key activated",
    data: {
      actorUserId: actor.id,
      plan: result.license.plan,
      billingCycle: result.license.billingCycle,
      maxUsers: result.license.maxUsers,
      status: result.license.status,
      validUntil: result.license.validUntil?.toISOString() ?? null
    }
  })

  return NextResponse.json({
    ok: true,
    license: {
      plan: result.license.plan,
      billingCycle: result.license.billingCycle,
      maxUsers: result.license.maxUsers,
      status: result.license.status,
      validUntil: result.license.validUntil
    }
  })
}
