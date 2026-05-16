export function createPdfFileName(invoiceNumber: string): string {
  const safeInvoiceNumber = invoiceNumber
    .trim()
    .replaceAll("/", "-")
    .replaceAll(" ", "-")

  return `invoice-${safeInvoiceNumber}.pdf`
}

export function formatPdfCurrency(
  value: number,
  locale = "de-DE",
  currency = "EUR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(value)
}
