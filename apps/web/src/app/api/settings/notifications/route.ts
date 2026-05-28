import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import {
  notificationCategories,
  readNotificationSettings,
  writeNotificationSettings,
  type NotificationCategory
} from "@/lib/notifications/store"

export const dynamic = "force-dynamic"

function normalizeCategorySettings(value: unknown) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const categories = Object.fromEntries(
    notificationCategories.map((category) => [category, input[category] !== false])
  ) as Record<NotificationCategory, boolean>

  return categories
}

export async function GET() {
  try {
    await requireCurrentUserRole(["admin"])
    const settings = await readNotificationSettings()
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentUserRole(["admin"])
    const data = await request.json().catch(() => {
      throw new AuthServiceError("invalid_request", "Ungueltige JSON-Anfrage.", 400)
    })
    const settings = await writeNotificationSettings({
      enabled: data.enabled !== false,
      categories: normalizeCategorySettings(data.categories)
    })

    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
