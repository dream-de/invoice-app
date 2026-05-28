import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, requireCurrentUserRole } from "@/lib/auth/service"
import { getUserLimitStatus } from "@/lib/license/limits"
import {
  createAppUser,
  deleteAppUser,
  listAppUsers,
  serializeAppUser,
  updateAppUser,
  UserServiceError
} from "@/lib/users/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function mapUserError(error: unknown) {
  if (error instanceof AuthServiceError || error instanceof UserServiceError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { ok: false, error: "Diese E-Mail-Adresse existiert bereits.", code: "email_exists" },
      { status: 409 }
    )
  }

  console.error(error)
  return NextResponse.json(
    { ok: false, error: "Benutzer konnten nicht verarbeitet werden." },
    { status: 500 }
  )
}

async function parseBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new UserServiceError("invalid_request", "Ungueltige Anfrage.")
  }
}

export async function GET() {
  try {
    await requireCurrentUserRole(["admin"])
    const [users, limit] = await Promise.all([listAppUsers(), getUserLimitStatus()])
    return NextResponse.json({
      ok: true,
      users: users.map(serializeAppUser),
      limit: {
        ...limit,
        validUntil: limit.validUntil?.toISOString() ?? null
      }
    })
  } catch (error) {
    return mapUserError(error)
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCurrentUserRole(["admin"])
    const user = await createAppUser(await parseBody(request))

    await writeAuditLog({
      action: "user.create",
      entity: "user",
      entityId: user.id,
      data: {
        actorUserId: actor.id,
        role: user.role,
        status: user.status,
        email: user.email,
        permissions: user.permissions
      }
    })

    return NextResponse.json({ ok: true, user: serializeAppUser(user) }, { status: 201 })
  } catch (error) {
    return mapUserError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireCurrentUserRole(["admin"])
    const user = await updateAppUser(await parseBody(request))

    await writeAuditLog({
      action: "user.update",
      entity: "user",
      entityId: user.id,
      data: {
        actorUserId: actor.id,
        role: user.role,
        status: user.status,
        email: user.email,
        permissions: user.permissions
      }
    })

    return NextResponse.json({ ok: true, user: serializeAppUser(user) })
  } catch (error) {
    return mapUserError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireCurrentUserRole(["admin"])
    const user = await deleteAppUser(await parseBody(request))

    await writeAuditLog({
      action: "user.delete",
      entity: "user",
      entityId: user.id,
      data: {
        actorUserId: actor.id,
        role: user.role,
        status: user.status,
        email: user.email
      }
    })

    return NextResponse.json({ ok: true, user: serializeAppUser(user) })
  } catch (error) {
    return mapUserError(error)
  }
}
