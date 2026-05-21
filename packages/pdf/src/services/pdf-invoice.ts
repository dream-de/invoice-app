export type PdfDisposition = "attachment" | "inline"

export function createPdfFileName(invoiceNumber: string, fallback = "invoice"): string {
  const safeInvoiceNumber = invoiceNumber
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return `invoice-${safeInvoiceNumber || fallback}.pdf`
}

export function createPdfContentDisposition(disposition: PdfDisposition, fileName: string): string {
  const safeFileName = fileName
    .replaceAll('"', "")
    .replaceAll("\n", "")
    .replaceAll("\r", "")

  return `${disposition}; filename="${safeFileName}"`
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
