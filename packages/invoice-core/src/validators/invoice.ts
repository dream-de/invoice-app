import type { Invoice } from "../models/invoice"

export function validateInvoice(invoice: Invoice): string[] {
  const errors: string[] = []

  if (!invoice.invoiceNumber) {
    errors.push("Invoice number is required")
  }

  if (!invoice.customerId) {
    errors.push("Customer is required")
  }

  if (invoice.items.length === 0) {
    errors.push("Invoice must contain at least one item")
  }

  return errors
}
