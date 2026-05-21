import type { InvoiceStatus } from "../models/invoice"

export const invoiceStatuses = ["draft", "sent", "paid", "overdue", "cancelled"] as const satisfies readonly InvoiceStatus[]

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return invoiceStatuses.includes(value as InvoiceStatus)
}

export function normalizeInvoiceStatus(value: string | null | undefined): InvoiceStatus {
  if (!value) return "draft"

  if (value === "open") return "sent"
  if (value === "final") return "sent"

  return isInvoiceStatus(value) ? value : "draft"
}
