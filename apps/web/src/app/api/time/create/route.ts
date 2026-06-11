import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { writeAuditLog } from "@/lib/audit/log"

function parseNumber(value: unknown) {
  const amount = Number(String(value || "0").trim().replace(",", "."))
  return Number.isFinite(amount) ? amount : Number.NaN
}

function timeEntryFromData(data: Record<string, unknown>) {
  const hours = parseNumber(data.hours)
  const rate = parseNumber(data.rate)
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 0
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0
  const project = String(data.project || "").trim() || "Allgemein"

  return {
    id: "time-" + Date.now(),
    project,
    task: String(data.task || "").trim() || "Premium Arbeitszeit",
    hours: safeHours,
    rate: safeRate,
    amount: safeHours * safeRate,
    status: String(data.status || "").trim() || "billable",
    date: new Date().toISOString()
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const entry = timeEntryFromData(data)

    if (entry.hours <= 0) {
      return NextResponse.json(
        { ok: false, error: "Stunden fehlen oder sind ungueltig." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true, entry }))
    }

    const project = await prisma.project.findFirst({
      where: { name: entry.project }
    })

    const savedEntry = await prisma.timeEntry.create({
      data: {
        projectId: project?.id ?? null,
        projectName: entry.project,
        task: entry.task,
        hours: entry.hours,
        rate: entry.rate,
        amount: entry.amount,
        status: entry.status,
        date: new Date(entry.date)
      }
    })

    const responseEntry = {
      ...entry,
      id: savedEntry.id,
      date: savedEntry.date.toISOString()
    }

    await writeAuditLog({
      action: "premium.time.create",
      entity: "premium_time_entry",
      entityId: savedEntry.id,
      reason: "Premium Zeiteintrag erstellt",
      data: responseEntry
    })

    return NextResponse.json({ ok: true, entry: responseEntry })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Zeit konnte nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
