import { prisma } from "@dream-invoice/database"

export function invoicePortalStatus(status: string, dueDate: Date | null, paidAt: Date | null) {
  const normalized = status.toLowerCase()
  if (normalized === "paid" || paidAt) return "Bezahlt"
  if (dueDate && dueDate.getTime() < Date.now()) return "Ueberfaellig"
  return "Offen"
}

export function money(value: unknown) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0))
}

export function date(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("de-DE").format(value) : "-"
}

export async function getPortalInvoices(customerId: string, type: "invoice" | "offer") {
  return prisma.invoice.findMany({
    where: { customerId, type },
    orderBy: { issueDate: "desc" },
    include: { positions: { orderBy: { sortOrder: "asc" } }, paymentLinks: { orderBy: { provider: "asc" } } }
  })
}

export async function getPortalAttachments(customerId: string) {
  return prisma.attachment.findMany({
    where: {
      expense: {
        project: {
          customerId
        }
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      expense: {
        include: {
          project: true
        }
      }
    }
  })
}

export async function getPortalDashboard(customerId: string) {
  const [invoices, offers, attachments] = await Promise.all([
    getPortalInvoices(customerId, "invoice"),
    getPortalInvoices(customerId, "offer"),
    getPortalAttachments(customerId)
  ])

  const openInvoices = invoices.filter((invoice) => invoicePortalStatus(invoice.status, invoice.dueDate, invoice.paidAt) !== "Bezahlt")
  const activities = [
    ...invoices.slice(0, 3).map((invoice) => ({
      label: `Rechnung ${invoice.number}`,
      detail: invoicePortalStatus(invoice.status, invoice.dueDate, invoice.paidAt),
      date: invoice.updatedAt
    })),
    ...offers.slice(0, 2).map((offer) => ({
      label: `Angebot ${offer.number}`,
      detail: "Zur Ansicht bereit",
      date: offer.updatedAt
    })),
    ...attachments.slice(0, 2).map((attachment) => ({
      label: attachment.originalName,
      detail: "Dokument verfuegbar",
      date: attachment.createdAt
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6)

  return {
    invoices,
    offers,
    attachments,
    openInvoices,
    activities
  }
}
