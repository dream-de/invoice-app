import { NextResponse } from "next/server"
import { listEmailDeliveryLog } from "@/lib/email/delivery-log"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get("documentId") || undefined
  const limitValue = Number(searchParams.get("limit") || 50)
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 50
  const entries = await listEmailDeliveryLog({ documentId, limit })

  return NextResponse.json({ ok: true, entries })
}
