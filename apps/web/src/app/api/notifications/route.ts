import { NextResponse } from "next/server"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { listEmailDeliveryLog } from "@/lib/email/delivery-log"
import { appendNotification, listNotifications, markNotificationsRead } from "@/lib/notifications/store"

export const dynamic = "force-dynamic"

async function syncEmailLogNotifications() {
  const entries = await listEmailDeliveryLog({ limit: 20 })

  await Promise.all(entries.map((entry) => appendNotification({
    category: "email",
    tone: entry.status === "success" ? "success" : "warning",
    title: entry.status === "success"
      ? (entry.type === "test" ? "Test-E-Mail gesendet" : "Rechnung per E-Mail gesendet")
      : (entry.type === "test" ? "Test-E-Mail fehlgeschlagen" : "E-Mail-Versand fehlgeschlagen"),
    message: entry.status === "success"
      ? [entry.subject, entry.to].filter(Boolean).join(" · ")
      : entry.error || [entry.subject, entry.to].filter(Boolean).join(" · "),
    href: entry.documentId ? "/documents/" + entry.documentId : "/settings/email",
    source: entry.id
  }).catch(() => null)))
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser()
    const { searchParams } = new URL(request.url)
    const limitValue = Number(searchParams.get("limit") || 20)
    const limit = Number.isFinite(limitValue) ? limitValue : 20
    await syncEmailLogNotifications()
    const result = await listNotifications(user.id, limit)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser()
    const data = await request.json().catch(() => ({}))
    const ids = Array.isArray(data.ids)
      ? data.ids.filter((id: unknown): id is string => typeof id === "string")
      : undefined
    const result = await markNotificationsRead(user.id, data.all === true ? undefined : ids)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
