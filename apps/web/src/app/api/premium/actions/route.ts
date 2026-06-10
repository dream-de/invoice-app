import { NextResponse } from "next/server"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { writeAuditLog } from "@/lib/audit/log"

type PremiumActionPayload = {
  type?: unknown
  action?: unknown
  label?: unknown
  payload?: unknown
}

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim()
  return text || fallback
}

function actionEventFromData(data: PremiumActionPayload) {
  const type = cleanText(data.type, "premium")
  const action = cleanText(data.action, "action")
  const label = cleanText(data.label, action)

  return {
    id: `premium-action-${Date.now()}`,
    type,
    action,
    label,
    payload: typeof data.payload === "object" && data.payload !== null ? data.payload : {},
    date: new Date().toISOString()
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json() as PremiumActionPayload
    const event = actionEventFromData(data)

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true, event }))
    }

    await writeAuditLog({
      action: "premium.action",
      entity: `premium_${event.type}`,
      entityId: event.id,
      reason: event.action,
      data: event
    })

    return NextResponse.json({ ok: true, event })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Premium-Aktion konnte nicht verarbeitet werden." },
      { status: 500 }
    )
  }
}
