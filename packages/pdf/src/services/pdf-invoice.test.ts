import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createPdfContentDisposition, createPdfFileName, formatPdfCurrency } from "./pdf-invoice"

describe("pdf invoice helpers", () => {
  it("creates safe PDF filenames from invoice numbers", () => {
    assert.equal(createPdfFileName(" RE 2026/1001 "), "invoice-RE-2026-1001.pdf")
    assert.equal(createPdfFileName(""), "invoice-invoice.pdf")
  })

  it("strips header-breaking characters from content disposition", () => {
    assert.equal(
      createPdfContentDisposition("attachment", "invoice-\"bad\"\nname.pdf"),
      'attachment; filename="invoice-badname.pdf"'
    )
  })

  it("formats PDF currency with locale defaults", () => {
    assert.equal(formatPdfCurrency(1488.69), "1.488,69 €")
    assert.equal(formatPdfCurrency(1200, "en-US", "USD"), "$1,200.00")
  })
})
