import { ok } from "../../core/response"
import type { InvoiceItem } from "@dream-invoice/invoice-core"
import { calculateInvoiceTotal } from "@dream-invoice/invoice-core"

export function previewInvoice(items: InvoiceItem[]) {
  return ok(calculateInvoiceTotal(items))
}
