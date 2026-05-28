import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

const defaults = [
  { type: "invoice", prefix: "RE-%Y-", nextValue: 104, padding: 3 },
  { type: "offer", prefix: "AN-%Y-", nextValue: 42, padding: 3 },
  { type: "customer", prefix: "KD-", nextValue: 4, padding: 4 }
]

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

function normalizeRanges(value: unknown) {
  const ranges = Array.isArray(value) ? value : []

  return ranges
    .filter((item) => item && typeof item === "object" && "type" in item)
    .map((item) => {
      const range = item as Record<string, unknown>

      return {
        type: String(range.type || ""),
        prefix: String(range.prefix || ""),
        nextValue: Number(range.nextValue) || 1,
        padding: Number(range.padding) || 4
      }
    })
    .filter((item) => item.type)
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, ranges: defaults, mode: "demo" })
  }

  try {
    await requireCurrentUserRole(["admin"])

    for (const item of defaults) {
      await prisma.numberRange.upsert({
        where: { type: item.type },
        create: item,
        update: {}
      })
    }

    const ranges = await prisma.numberRange.findMany({
      orderBy: { type: "asc" }
    })

    return NextResponse.json({ ok: true, ranges })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Nummernkreise konnten nicht geladen werden." },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    await requireCurrentUserRole(["admin"])

    const data = await request.json()
    const ranges = normalizeRanges(data.ranges)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        ok: true,
        ranges: ranges.length > 0 ? ranges : defaults,
        mode: "demo"
      })
    }

    const saved = []

    for (const item of ranges) {
      const range = await prisma.numberRange.upsert({
        where: { type: item.type },
        create: item,
        update: {
          prefix: item.prefix,
          nextValue: item.nextValue,
          padding: item.padding
        }
      })

      saved.push(range)
    }

    await writeAuditLog({
      action: "settings.number_ranges.update",
      entity: "numberRange",
      reason: "Number ranges updated",
      data: {
        count: saved.length,
        types: saved.map((range) => range.type)
      }
    })

    return NextResponse.json({ ok: true, ranges: saved })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Nummernkreise konnten nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
