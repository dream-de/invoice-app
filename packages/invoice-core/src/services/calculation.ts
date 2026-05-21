import { calculateGross, calculateVAT } from "@dream-invoice/tax"
import type { InvoiceItem } from "../models/invoice"

export function calculateInvoiceItem(item: InvoiceItem) {
  const net = Number((item.quantity * item.unitPrice).toFixed(2))
  const tax = calculateVAT(net, item.taxRate)
  const gross = calculateGross(net, item.taxRate)

  return {
    ...item,
    net,
    tax,
    gross
  }
}

export function calculateInvoiceTotal(items: InvoiceItem[]) {
  const calculatedItems = items.map(calculateInvoiceItem)

  return {
    items: calculatedItems,
    net: Number(calculatedItems.reduce((sum, item) => sum + item.net, 0).toFixed(2)),
    tax: Number(calculatedItems.reduce((sum, item) => sum + item.tax, 0).toFixed(2)),
    gross: Number(calculatedItems.reduce((sum, item) => sum + item.gross, 0).toFixed(2))
  }
}
