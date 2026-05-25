import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"

export const dynamic = "force-dynamic"

const defaults = [
  { type: "invoice", prefix: "RE-%Y-", nextValue: 104, padding: 3 },
  { type: "offer", prefix: "AN-%Y-", nextValue: 42, padding: 3 },
  { type: "customer", prefix: "KD-", nextValue: 4, padding: 4 }
]

export async function GET() {
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
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const ranges = Array.isArray(data.ranges) ? data.ranges : []

    const saved = []

    for (const item of ranges) {
      if (!item.type) continue

      const range = await prisma.numberRange.upsert({
        where: { type: item.type },
        create: {
          type: item.type,
          prefix: String(item.prefix || ""),
          nextValue: Number(item.nextValue) || 1,
          padding: Number(item.padding) || 4
        },
        update: {
          prefix: String(item.prefix || ""),
          nextValue: Number(item.nextValue) || 1,
          padding: Number(item.padding) || 4
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
    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Nummernkreise konnten nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
