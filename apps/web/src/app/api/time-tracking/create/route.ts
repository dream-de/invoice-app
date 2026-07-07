import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"

function parseDuration(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."))
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : Number.NaN
}

function parseDate(value: unknown) {
  const dateValue = String(value ?? "").trim()
  const date = dateValue ? new Date(dateValue + "T00:00:00.000Z") : new Date()
  return Number.isNaN(date.getTime()) ? null : date
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const customerId = String(data.customerId ?? "").trim()
    const projectId = String(data.projectId ?? "").trim()
    const articleId = String(data.articleId ?? "").trim()
    const duration = parseDuration(data.duration)
    const date = parseDate(data.date)
    const note = String(data.note ?? "").trim() || "Arbeitszeit"
    const billable = data.billable !== false

    if (!customerId) return NextResponse.json({ ok: false, error: "Kunde fehlt." }, { status: 400 })
    if (!projectId) return NextResponse.json({ ok: false, error: "Projekt fehlt." }, { status: 400 })
    if (!articleId) return NextResponse.json({ ok: false, error: "Artikel fehlt." }, { status: 400 })
    if (!Number.isFinite(duration)) return NextResponse.json({ ok: false, error: "Dauer fehlt oder ist ungueltig." }, { status: 400 })
    if (!date) return NextResponse.json({ ok: false, error: "Datum ist ungueltig." }, { status: 400 })

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        entry: {
          id: "time-" + Date.now(),
          customer: "Demo Kunde",
          project: "Demo Projekt",
          article: "Demo Artikel",
          duration,
          amount: billable ? duration * 95 : 0,
          status: billable ? "Nicht fakturiert" : "Nicht abrechenbar",
          billable,
          note,
          date: date.toISOString().slice(0, 10)
        }
      }))
    }

    const [project, article] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, customerId },
        include: { customer: true }
      }),
      prisma.article.findFirst({
        where: { id: articleId, active: true }
      })
    ])

    if (!project) return NextResponse.json({ ok: false, error: "Projekt gehoert nicht zum ausgewaehlten Kunden." }, { status: 400 })
    if (!article) return NextResponse.json({ ok: false, error: "Artikel wurde nicht gefunden." }, { status: 400 })

    const rate = billable ? Number(article.netPrice ?? 0) : 0
    const amount = Math.round(duration * rate * 100) / 100

    const savedEntry = await prisma.timeEntry.create({
      data: {
        projectId: project.id,
        articleId: article.id,
        projectName: project.name,
        task: note,
        hours: duration,
        rate,
        amount,
        status: billable ? "billable" : "internal",
        billingStatus: billable ? "not_invoiced" : "not_billable",
        date
      },
      include: {
        project: { include: { customer: true } },
        article: true
      }
    })

    const entry = {
      id: savedEntry.id,
      customer: savedEntry.project?.customer?.name ?? "Ohne Kunde",
      project: savedEntry.project?.name ?? savedEntry.projectName,
      article: savedEntry.article?.name ?? "Ohne Artikel",
      duration: Number(savedEntry.hours ?? 0),
      rate: Number(savedEntry.rate ?? 0),
      amount: Number(savedEntry.amount ?? 0),
      status: billable ? "Nicht fakturiert" : "Nicht abrechenbar",
      billable,
      note: savedEntry.task,
      date: savedEntry.date.toISOString().slice(0, 10)
    }

    await writeAuditLog({
      action: "time_entry.create",
      entity: "time_entry",
      entityId: savedEntry.id,
      reason: "Zeiterfassung gespeichert",
      data: { ...entry, entityLabel: entry.project + " / " + entry.article },
      after: entry,
      requestMetadata: getAuditRequestMetadata(req)
    })

    return NextResponse.json({ ok: true, entry })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: "Zeit konnte nicht gespeichert werden." }, { status: 500 })
  }
}
