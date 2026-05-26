import { calculateInvoiceTotal } from "@dream-invoice/invoice-core"

type PdfSourcePosition = {
  title?: unknown
  description?: unknown
  quantity?: unknown
  netPrice?: unknown
  vatRate?: unknown
}

function toNumber(value: unknown, fallback: number) {
  if (value === null || value === undefined || value === "") return fallback

  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : fallback
}

function positionTitle(position: PdfSourcePosition, index: number) {
  const title = String(position.title ?? position.description ?? "").trim()
  return title || `Position ${index + 1}`
}

export function calculatePdfInvoiceTotals(sourcePositions: PdfSourcePosition[]) {
  const items = sourcePositions.map((position, index) => ({
    description: positionTitle(position, index),
    quantity: toNumber(position.quantity, 1),
    unitPrice: toNumber(position.netPrice, 0),
    taxRate: toNumber(position.vatRate, 19)
  }))

  const totals = calculateInvoiceTotal(items)

  return {
    subtotal: totals.net,
    taxTotal: totals.tax,
    total: totals.gross,
    positions: totals.items.map((item) => ({
      title: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  }
}
