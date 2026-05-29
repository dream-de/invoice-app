import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { z } from "zod"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

const defaults = [
  { type: "invoice", prefix: "RE-%Y-", nextValue: 104, padding: 3 },
  { type: "offer", prefix: "AN-%Y-", nextValue: 42, padding: 3 },
  { type: "customer", prefix: "KD-", nextValue: 4, padding: 4 }
]

const numberRangeSchema = z.object({
  type: z.enum(["invoice", "offer", "customer", "order", "delivery", "credit", "reminder", "receipt"]),
  prefix: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9%_.\-\/]+$/),
  nextValue: z.coerce.number().int().min(1).max(9_999_999),
  padding: z.coerce.number().int().min(1).max(12)
})

const numberRangesSchema = z.object({
  ranges: z.array(numberRangeSchema).max(20)
})

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

function validateRanges(value: unknown) {
  const parsed = numberRangesSchema.safeParse(value)
  if (!parsed.success) {
    throw new AuthServiceError("invalid_request", "Nummernkreise enthalten ungueltige Werte.", 400)
  }

  return parsed.data.ranges
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
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
    const ranges = validateRanges(await request.json().catch(() => ({})))

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        ranges: ranges.length > 0 ? ranges : defaults
      }))
    }

    await requireCurrentUserRole(["admin"])

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
