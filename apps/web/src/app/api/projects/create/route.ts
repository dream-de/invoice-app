import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { writeAuditLog } from "@/lib/audit/log"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

const allowedStatuses = new Set(["planned", "active", "paused", "completed"])

function cleanText(value: unknown) {
  const text = String(value ?? "").trim()
  return text || null
}

function parseMoney(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(String(value).replace(/\./g, "").replace(",", "."))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseDate(value: unknown) {
  const text = String(value ?? "").trim()
  if (!text) return null
  const date = new Date(text + "T00:00:00.000Z")
  return Number.isNaN(date.getTime()) ? null : date
}

function statusLabel(status: string) {
  if (status === "planned") return "Geplant"
  if (status === "paused") return "Pausiert"
  if (status === "completed") return "Abgeschlossen"
  return "Aktiv"
}

function projectResponse(project: {
  id: string
  code?: string | null
  name: string
  status?: string | null
  description?: string | null
  startDate?: Date | null
  endDate?: Date | null
  budget?: unknown
  hourlyRate?: unknown
  customerId?: string | null
  customer?: { name?: string | null } | null
}) {
  const status = project.status || "active"
  const budgetAmount = Number(project.budget ?? 0) || 0
  return {
    id: project.id,
    code: project.code || project.id,
    name: project.name,
    customerId: project.customerId ?? null,
    customer: project.customer?.name || "Ohne Kunde",
    status: statusLabel(status),
    statusKey: status,
    description: project.description || "",
    startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : null,
    endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : null,
    budgetAmount,
    budget: budgetAmount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR",
    hourlyRate: project.hourlyRate == null ? null : Number(project.hourlyRate),
    trackedHours: 0,
    invoicedHours: 0,
    openHours: 0,
    revenue: 0,
    progress: "0%"
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const name = cleanText(data.name)
    const customerId = cleanText(data.customerId)
    const status = allowedStatuses.has(String(data.status)) ? String(data.status) : "active"

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Projektname fehlt." }, { status: 400 })
    }

    if (!customerId) {
      return NextResponse.json({ error: "Kunde fehlt." }, { status: 400 })
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        project: projectResponse({
          id: "demo-project-" + Date.now(),
          code: cleanText(data.code) || "PR-DEMO-0001",
          name,
          status,
          description: cleanText(data.description),
          startDate: parseDate(data.startDate),
          endDate: parseDate(data.endDate),
          budget: parseMoney(data.budget) ?? 0,
          hourlyRate: parseMoney(data.hourlyRate),
          customerId,
          customer: { name: cleanText(data.customerName) || "Demo Kunde" }
        })
      }))
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: "Kunde wurde nicht gefunden." }, { status: 404 })
    }

    const requestedCode = cleanText(data.code)
    let code = requestedCode

    if (!code) {
      let nextValue = (await prisma.project.count()) + 1
      while (!code) {
        const candidate = `PR-${String(nextValue).padStart(4, "0")}`
        const existing = await prisma.project.findUnique({ where: { code: candidate } })
        if (!existing) code = candidate
        nextValue += 1
      }
    }

    const project = await prisma.project.create({
      data: {
        code,
        name,
        status,
        description: cleanText(data.description),
        startDate: parseDate(data.startDate),
        endDate: parseDate(data.endDate),
        budget: parseMoney(data.budget),
        hourlyRate: parseMoney(data.hourlyRate),
        customerId
      },
      include: { customer: true }
    })

    await writeAuditLog({
      action: "project.create",
      entity: "project",
      entityId: project.id,
      reason: "Projekt erstellt",
      data: { entityLabel: project.name, code: project.code, customerId: project.customerId, status: project.status },
      after: { name: project.name, code: project.code, customerId: project.customerId, status: project.status, budget: project.budget, hourlyRate: project.hourlyRate },
      requestMetadata: getAuditRequestMetadata(req)
    })

    return NextResponse.json({ ok: true, project: projectResponse(project) })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Projektnummer existiert bereits." }, { status: 409 })
    }

    console.error(error)
    return NextResponse.json({ error: "Projekt konnte nicht erstellt werden." }, { status: 500 })
  }
}
