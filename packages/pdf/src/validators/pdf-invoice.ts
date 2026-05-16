import type { PdfInvoiceData } from "../models/pdf-invoice"

export function validatePdfInvoiceData(data: PdfInvoiceData): string[] {
  const errors: string[] = []

  if (!data.invoiceNumber) errors.push("Invoice number is required")
  if (!data.customerName) errors.push("Customer name is required")
  if (data.totalGross < 0) errors.push("Total gross must not be negative")

  return errors
}
