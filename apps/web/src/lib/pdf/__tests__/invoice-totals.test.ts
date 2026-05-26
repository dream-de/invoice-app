import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculatePdfInvoiceTotals } from "../invoice-totals"

describe("pdf invoice totals", () => {
  it("uses the shared invoice calculation rules", () => {
    const totals = calculatePdfInvoiceTotals([
      { title: "Beratung", quantity: 2, netPrice: 100, vatRate: 19 }
    ])

    assert.equal(totals.subtotal, 200)
    assert.equal(totals.taxTotal, 38)
    assert.equal(totals.total, 238)
    assert.deepEqual(totals.positions, [
      { title: "Beratung", quantity: 2, unitPrice: 100 }
    ])
  })

  it("defaults missing VAT rates for fallback invoices", () => {
    const totals = calculatePdfInvoiceTotals([
      { title: "Fallback", quantity: 1, netPrice: 119 }
    ])

    assert.equal(totals.subtotal, 119)
    assert.equal(totals.taxTotal, 22.61)
    assert.equal(totals.total, 141.61)
  })

  it("normalizes comma decimal strings", () => {
    const totals = calculatePdfInvoiceTotals([
      { title: "Service", quantity: "1,5", netPrice: "80,00", vatRate: "7" }
    ])

    assert.equal(totals.subtotal, 120)
    assert.equal(totals.taxTotal, 8.4)
    assert.equal(totals.total, 128.4)
  })
})
