import { ok } from "../../core/response"
import type { InvoiceItem } from "@invoice-platform/invoice-core"
import { calculateInvoiceTotal } from "@invoice-platform/invoice-core"

export function previewInvoice(items: InvoiceItem[]) {
  return ok(calculateInvoiceTotal(items))
}
