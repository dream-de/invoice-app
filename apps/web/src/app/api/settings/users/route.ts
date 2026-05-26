import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { getUserLimitStatus } from "@/lib/license/limits"
import {
  createAppUser,
  listAppUsers,
  serializeAppUser,
  updateAppUser,
  UserServiceError
} from "@/lib/users/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function mapUserError(error: unknown) {
  if (error instanceof UserServiceError) {
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
    const user = await createAppUser(await parseBody(request))

    await writeAuditLog({
      action: "user.create",
      entity: "user",
      entityId: user.id,
      data: { role: user.role, status: user.status, email: user.email }
    })

    return NextResponse.json({ ok: true, user: serializeAppUser(user) }, { status: 201 })
  } catch (error) {
    return mapUserError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await updateAppUser(await parseBody(request))

    await writeAuditLog({
      action: "user.update",
      entity: "user",
      entityId: user.id,
      data: { role: user.role, status: user.status, email: user.email }
    })

    return NextResponse.json({ ok: true, user: serializeAppUser(user) })
  } catch (error) {
    return mapUserError(error)
  }
}
