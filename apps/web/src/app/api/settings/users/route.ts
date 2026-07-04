import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { AuthServiceError, requireCurrentUserRole } from "@/lib/auth/service"
import { getUserLimitStatus } from "@/lib/license/limits"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import {
  createAppUser,
  deleteAppUser,
  listAppUsers,
  serializeAppUser,
  updateAppUser,
  UserServiceError
} from "@/lib/users/service"
import { writeSecurityLog } from "@/lib/logs/auditWriter.server"

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

    if (!isDemoMode()) {
      await writeAuditLog({
        action: "user.create",
        entity: "user",
        entityId: user.id,
        data: {
          actorUserId: actor.id,
          entityLabel: user.email,
          role: user.role,
          status: user.status,
          email: user.email,
          permissions: user.permissions
        },
        after: { name: user.name, email: user.email, role: user.role, status: user.status, permissions: user.permissions },
        requestMetadata: getAuditRequestMetadata(request)
      })
      await writeSecurityLog({
        request,
        title: "Benutzer erstellt",
        description: "Admin hat einen Benutzer angelegt.",
        level: "success",
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "user.create",
        entityId: user.id,
        metadata: { email: user.email, role: user.role, status: user.status, permissions: user.permissions },
        tags: ["settings", "users"]
      })
    }

    return NextResponse.json(isDemoMode()
      ? demoModeResponse({ ok: true, user: serializeAppUser(user) })
      : { ok: true, user: serializeAppUser(user) }, { status: 201 })
  } catch (error) {
    return mapUserError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireCurrentUserRole(["admin"])
    const body = await parseBody(request)
    const beforeUser = (await listAppUsers()).find((item) => item.id === String(body.id ?? "")) ?? null
    const user = await updateAppUser(body)

    if (!isDemoMode()) {
      await writeAuditLog({
        action: "user.update",
        entity: "user",
        entityId: user.id,
        data: {
          actorUserId: actor.id,
          entityLabel: user.email,
          role: user.role,
          status: user.status,
          email: user.email,
          roleChanged: beforeUser ? beforeUser.role !== user.role : false,
          statusChangedTo: beforeUser?.status !== user.status ? user.status : null,
          permissionsChanged: beforeUser ? JSON.stringify(beforeUser.permissions) !== JSON.stringify(user.permissions) : false,
          permissions: user.permissions
        },
        before: beforeUser ? { name: beforeUser.name, email: beforeUser.email, role: beforeUser.role, status: beforeUser.status, permissions: beforeUser.permissions } : undefined,
        after: { name: user.name, email: user.email, role: user.role, status: user.status, permissions: user.permissions },
        requestMetadata: getAuditRequestMetadata(request)
      })
      await writeSecurityLog({
        request,
        title: "Benutzer aktualisiert",
        description: "Admin hat Rolle, Status oder Berechtigungen eines Benutzers geaendert.",
        level: "info",
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "user.update",
        entityId: user.id,
        metadata: { email: user.email, role: user.role, status: user.status, permissions: user.permissions },
        tags: ["settings", "users", "permissions"]
      })
    }

    return NextResponse.json(isDemoMode()
      ? demoModeResponse({ ok: true, user: serializeAppUser(user) })
      : { ok: true, user: serializeAppUser(user) })
  } catch (error) {
    return mapUserError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireCurrentUserRole(["admin"])
    const body = await parseBody(request)
    const beforeUser = (await listAppUsers()).find((item) => item.id === String(body.id ?? "")) ?? null
    const user = await deleteAppUser(body)

    if (!isDemoMode()) {
      await writeAuditLog({
        action: "user.delete",
        entity: "user",
        entityId: user.id,
        data: {
          actorUserId: actor.id,
          entityLabel: user.email,
          role: user.role,
          status: user.status,
          email: user.email,
          statusChangedTo: "disabled"
        },
        before: beforeUser ? { name: beforeUser.name, email: beforeUser.email, role: beforeUser.role, status: beforeUser.status, permissions: beforeUser.permissions } : undefined,
        after: { name: user.name, email: user.email, role: user.role, status: user.status, permissions: user.permissions },
        requestMetadata: getAuditRequestMetadata(request)
      })
      await writeSecurityLog({
        request,
        title: "Benutzer geloescht",
        description: "Admin hat einen Benutzer entfernt.",
        level: "warning",
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "user.delete",
        entityId: user.id,
        metadata: { email: user.email, role: user.role, status: user.status },
        tags: ["settings", "users"]
      })
    }

    return NextResponse.json(isDemoMode()
      ? demoModeResponse({ ok: true, user: serializeAppUser(user) })
      : { ok: true, user: serializeAppUser(user) })
  } catch (error) {
    return mapUserError(error)
  }
}
