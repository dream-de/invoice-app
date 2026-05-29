import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { requireCurrentUser, mapAuthError } from "@/lib/auth/service"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function parseBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function serialize(user: {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  emailVerifiedAt: Date | null
  twoFactorEnabledAt: Date | null
  lastLoginAt: Date | null
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    twoFactorEnabled: Boolean(user.twoFactorEnabledAt),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null
  }
}

export async function GET() {
  try {
    const current = await requireCurrentUser()
    if (isDemoMode()) {
      return NextResponse.json({
        ok: true,
        user: {
          id: current.id,
          name: current.name,
          email: current.email,
          role: current.role,
          status: current.status,
          emailVerified: true,
          twoFactorEnabled: false,
          lastLoginAt: null
        }
      })
    }

    const user = await prisma.user.findUnique({ where: { id: current.id } })
    if (!user) return NextResponse.json({ ok: false, error: "Benutzer wurde nicht gefunden." }, { status: 404 })

    return NextResponse.json({ ok: true, user: serialize(user) })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}

export async function PATCH(request: Request) {
  try {
    const current = await requireCurrentUser()
    const body = await parseBody(request)
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null
    const email = String(body.email ?? "").trim().toLowerCase()

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ ok: false, error: "Bitte eine gueltige E-Mail-Adresse eintragen." }, { status: 400 })
    }

    if (isDemoMode()) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        user: {
          id: current.id,
          name,
          email,
          role: current.role,
          status: current.status,
          emailVerified: true,
          twoFactorEnabled: false,
          lastLoginAt: null
        }
      }))
    }

    const user = await prisma.user.update({
      where: { id: current.id },
      data: { name, email }
    })

    await writeAuditLog({
      action: "account.profile_update",
      entity: "user",
      entityId: user.id,
      data: { email: user.email }
    })

    return NextResponse.json({ ok: true, user: serialize(user) })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Diese E-Mail-Adresse existiert bereits." }, { status: 409 })
    }

    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
