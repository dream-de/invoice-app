import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { z } from "zod"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { writeAuditLog } from "@/lib/audit/log"
import { appendNotification } from "@/lib/notifications/store"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

const payloadSchema = z.object({
  timeEntryIds: z.array(z.string().trim().min(1)).min(1, "Mindestens eine Zeit muss ausgewaehlt werden.").max(100, "Zu viele Zeiten ausgewaehlt.")
})

async function requireInvoicePermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "create")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Rechnungsaktion.", 403)
  }

  return user
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export async function POST(req: Request) {
  try {
    const parsed = payloadSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Ungueltige Auswahl." }, { status: 400 })
    }

    const timeEntryIds = Array.from(new Set(parsed.data.timeEntryIds))

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        invoice: { id: "demo-time-invoice", number: "RE-DEMO-ZEITEN" },
        href: "/documents/demo-time-invoice"
      }))
    }

    await requireInvoicePermission()

    const invoice = await prisma.$transaction(async (tx) => {
      const entries = await tx.timeEntry.findMany({
        where: {
          id: { in: timeEntryIds },
          status: "billable",
          billingStatus: "not_invoiced"
        },
        include: {
          project: { include: { customer: true } },
          article: true
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }]
      })

      if (entries.length !== timeEntryIds.length) {
        throw new AuthServiceError("invalid_request", "Ausgewaehlte Zeiten sind nicht mehr vollstaendig fakturierbar.", 400)
      }

      const customerIds = Array.from(new Set(entries.map((entry) => entry.project?.customerId).filter(Boolean)))
      if (customerIds.length !== 1) {
        throw new AuthServiceError("invalid_request", "Bitte nur Zeiten eines Kunden auswaehlen.", 400)
      }

      const customerId = customerIds[0] as string
      const projectIds = Array.from(new Set(entries.map((entry) => entry.projectId).filter(Boolean)))

      await tx.numberRange.upsert({
        where: { type: "invoice" },
        create: {
          type: "invoice",
          prefix: "RE-%Y-",
          nextValue: 104,
          padding: 3
        },
        update: {}
      })

      const range = await tx.numberRange.update({
        where: { type: "invoice" },
        data: { nextValue: { increment: 1 } }
      })

      const invoiceValue = range.nextValue - 1
      const invoiceNumber = range.prefix.replace("%Y", String(new Date().getFullYear())) + String(invoiceValue).padStart(range.padding, "0")
      const companySettings = await tx.companySettings.findFirst({ select: { defaultPaymentTermsDays: true } })
      const paymentTermsDays = Math.max(1, Number(companySettings?.defaultPaymentTermsDays ?? 14) || 14)
      const dueDate = new Date(Date.now() + paymentTermsDays * 24 * 60 * 60 * 1000)

      const positions = entries.map((entry, index) => {
        const hours = Number(entry.hours ?? 0)
        const hourlyRate = Number(entry.rate ?? entry.article?.netPrice ?? 0)
        const vatRate = Number(entry.article?.vatRate ?? 19)
        const amount = roundMoney(hours * hourlyRate)

        return {
          customerId,
          projectId: entry.projectId,
          articleId: entry.articleId,
          title: entry.article?.name ?? entry.task,
          description: entry.article?.description || entry.task,
          quantity: hours,
          unit: "Std",
          hours,
          hourlyRate,
          amount,
          netPrice: hourlyRate,
          vatRate,
          sortOrder: index
        }
      })

      const netTotal = roundMoney(positions.reduce((sum, position) => sum + Number(position.amount ?? 0), 0))
      const vatTotal = roundMoney(positions.reduce((sum, position) => sum + Number(position.amount ?? 0) * (Number(position.vatRate ?? 0) / 100), 0))
      const grossTotal = roundMoney(netTotal + vatTotal)

      const createdInvoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          status: "draft",
          issueDate: new Date(),
          dueDate,
          customerId,
          projectId: projectIds.length === 1 ? projectIds[0] as string : null,
          notes: "Erstellt aus " + entries.length + " Zeiteintrag" + (entries.length === 1 ? "." : "en."),
          netTotal,
          vatTotal,
          grossTotal,
          positions: { create: positions },
          timeLinks: {
            create: entries.map((entry) => ({
              timeEntryId: entry.id,
              hours: entry.hours,
              amount: entry.amount,
              status: "invoiced"
            }))
          }
        },
        include: {
          positions: true,
          timeLinks: true,
          customer: true
        }
      })

      await tx.timeEntry.updateMany({
        where: { id: { in: entries.map((entry) => entry.id) } },
        data: { billingStatus: "invoiced" }
      })

      return createdInvoice
    })

    await writeAuditLog({
      action: "premium.action",
      entity: "invoice",
      entityId: invoice.id,
      reason: "Rechnung aus Zeiterfassungen erstellt",
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        timeEntryIds,
        timeLinkIds: invoice.timeLinks.map((link) => link.id)
      }
    })

    await appendNotification({
      category: "documents",
      tone: "info",
      title: "Rechnung aus Zeiten erstellt",
      message: invoice.number + " wurde mit " + invoice.timeLinks.length + " Zeiteintraegen gespeichert.",
      href: "/documents/" + invoice.id,
      source: "time-invoice-created:" + invoice.id
    }).catch(() => null)

    return NextResponse.json({ ok: true, invoice, href: "/documents/" + invoice.id })
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
    }

    console.error(error)
    return NextResponse.json({ ok: false, error: "Rechnung konnte nicht aus Zeiten erstellt werden." }, { status: 500 })
  }
}
