import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { z } from "zod"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

const workflowSchema = z.object({
  name: z.string().trim().min(2).max(120).default("Neuer Workflow"),
  trigger: z.enum(["invoice.paid", "invoice.overdue", "project.completed", "invoice.created", "payment.received", "offer.accepted", "expense.recorded"]),
  action: z.string().trim().min(2).max(180),
  status: z.enum(["active", "paused", "prepared"]).default("active"),
  description: z.string().trim().max(500).optional()
})

const recurringSchema = z.object({
  name: z.string().trim().min(2).max(120).default("Wiederkehrende Rechnung"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]),
  interval: z.coerce.number().int().min(1).max(365).default(1),
  nextRunAt: z.string().datetime().optional(),
  status: z.enum(["prepared", "active", "paused"]).default("prepared")
})

const reminderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  timing: z.enum(["before_due", "on_due", "after_due", "dunning"]),
  offsetDays: z.coerce.number().int().min(-365).max(365).default(0),
  reminderLevel: z.coerce.number().int().min(1).max(3).optional(),
  status: z.enum(["prepared", "active", "paused"]).default("prepared")
})

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
  return null
}

const defaults = {
  workflows: [
    { id: "wf-paid", name: "Wenn Rechnung bezahlt", trigger: "invoice.paid", action: "Status aktualisieren", status: "active" },
    { id: "wf-overdue", name: "Wenn Rechnung ueberfaellig", trigger: "invoice.overdue", action: "Erinnerung erzeugen", status: "prepared" },
    { id: "wf-project", name: "Wenn Projekt abgeschlossen", trigger: "project.completed", action: "Rechnungsvorschlag erstellen", status: "prepared" }
  ],
  recurringRules: ["daily", "weekly", "monthly", "yearly", "custom"].map((frequency) => ({ id: "rec-" + frequency, name: "Rechnung " + frequency, frequency, interval: 1, status: "prepared" })),
  reminderRules: [
    { id: "rem-before", name: "Vor Faelligkeit", timing: "before_due", offsetDays: -3, status: "prepared" },
    { id: "rem-on", name: "Am Faelligkeitstag", timing: "on_due", offsetDays: 0, status: "prepared" },
    { id: "rem-after", name: "Nach Faelligkeit", timing: "after_due", offsetDays: 3, status: "prepared" },
    { id: "dun-1", name: "Mahnstufe 1", timing: "dunning", offsetDays: 7, reminderLevel: 1, status: "prepared" },
    { id: "dun-2", name: "Mahnstufe 2", timing: "dunning", offsetDays: 14, reminderLevel: 2, status: "prepared" },
    { id: "dun-3", name: "Mahnstufe 3", timing: "dunning", offsetDays: 30, reminderLevel: 3, status: "prepared" }
  ]
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, ...defaults, mode: "demo" })
  }

  try {
    await requireCurrentUserRole(["admin"])
    const [workflows, recurringRules, reminderRules, openReminders, overdueInvoices] = await Promise.all([
      prisma.automationWorkflow.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
      prisma.recurringInvoiceRule.findMany({ orderBy: [{ frequency: "asc" }, { createdAt: "desc" }] }),
      prisma.paymentReminderRule.findMany({ orderBy: [{ reminderLevel: "asc" }, { offsetDays: "asc" }] }),
      prisma.auditLog.count({ where: { entity: "PaymentReminderRule" } }).catch(() => 0),
      prisma.invoice.count({ where: { type: "invoice", status: "overdue" } })
    ])

    return NextResponse.json({
      ok: true,
      workflows: workflows.length ? workflows : defaults.workflows,
      recurringRules: recurringRules.length ? recurringRules : defaults.recurringRules,
      reminderRules: reminderRules.length ? reminderRules : defaults.reminderRules,
      cards: {
        activeWorkflows: workflows.filter((workflow: { status: string }) => workflow.status === "active").length,
        openReminders,
        overdueInvoices
      }
    })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error(error)
    return NextResponse.json({ ok: false, error: "Automatisierungen konnten nicht geladen werden." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true, workflow: { id: "demo-workflow", ...workflowSchema.parse(body) } }))
    }

    await requireCurrentUserRole(["admin"])
    const workflow = await prisma.automationWorkflow.create({ data: workflowSchema.parse(body) })
    await writeAuditLog({ action: "premium.action", entity: "AutomationWorkflow", entityId: workflow.id, reason: "Workflow created", data: { trigger: workflow.trigger, status: workflow.status } })
    return NextResponse.json({ ok: true, workflow })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error(error)
    return NextResponse.json({ ok: false, error: "Workflow konnte nicht gespeichert werden." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true, saved: body }))
    }

    await requireCurrentUserRole(["admin"])
    const recurringRules = Array.isArray(body.recurringRules) ? body.recurringRules.map((item: unknown) => recurringSchema.parse(item)) : []
    const reminderRules = Array.isArray(body.reminderRules) ? body.reminderRules.map((item: unknown) => reminderSchema.parse(item)) : []

    const savedRecurring = []
    for (const item of recurringRules) {
      savedRecurring.push(await prisma.recurringInvoiceRule.create({ data: { ...item, nextRunAt: item.nextRunAt ? new Date(item.nextRunAt) : null } }))
    }

    const savedReminders = []
    for (const item of reminderRules) {
      savedReminders.push(await prisma.paymentReminderRule.create({ data: item }))
    }

    await writeAuditLog({ action: "premium.action", entity: "Automation", reason: "Recurring and reminder rules prepared", data: { recurring: savedRecurring.length, reminders: savedReminders.length } })
    return NextResponse.json({ ok: true, recurringRules: savedRecurring, reminderRules: savedReminders })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error(error)
    return NextResponse.json({ ok: false, error: "Automatisierungsregeln konnten nicht gespeichert werden." }, { status: 500 })
  }
}
