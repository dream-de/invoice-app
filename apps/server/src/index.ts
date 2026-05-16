import { healthCheck, previewInvoice, validateAccountingEntry } from "@invoice-platform/api"

console.log(healthCheck())

console.log(
  previewInvoice([
    {
      description: "Demo Position",
      quantity: 1,
      unitPrice: 100,
      taxRate: 19
    }
  ])
)

console.log(
  validateAccountingEntry({
    id: "entry_1",
    date: new Date().toISOString(),
    description: "Demo Buchung",
    lines: [
      { accountId: "1000", debit: 119, credit: 0 },
      { accountId: "8400", debit: 0, credit: 100 },
      { accountId: "1776", debit: 0, credit: 19 }
    ]
  })
)
