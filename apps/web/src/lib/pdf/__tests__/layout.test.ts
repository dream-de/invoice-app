import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { pdfLayout } from "../layout"

const baseProps = {
  title: "Rechnung",
  number: "DI-1",
  date: "26.05.2026",
  customer: {
    name: "Test Kunde",
    street: "Kundenstrasse 1",
    zip: "10115",
    city: "Berlin",
    country: "Deutschland"
  },
  company: {
    company: "Dream Invoice",
    street: "Hauptstrasse 1",
    zip: "50667",
    city: "Koeln",
    country: "Deutschland",
    iban: "DE00",
    bic: "TEST"
  },
  positions: [{ title: "Wartung", quantity: 2, unitPrice: 100 }],
  subTotal: 200,
  vatAmount: 38,
  total: 238
}

describe("pdf template layout", () => {
  it("renders industry-specific table headers", () => {
    const html = pdfLayout({
      ...baseProps,
      template: {
        id: "autohaus-invoice",
        name: "Autohaus Rechnung",
        type: "invoice",
        page: { width: 794, height: 1123 },
        elements: [
          { id: "items", type: "table", x: 40, y: 40, width: 500, height: 120, content: "vehicle" }
        ]
      }
    })

    assert.match(html, /Leistung \/ Teil/)
    assert.match(html, /Anzahl/)
    assert.match(html, /Betrag/)
  })

  it("renders offer-specific table headers", () => {
    const html = pdfLayout({
      ...baseProps,
      template: {
        id: "offer-modern-service",
        name: "Angebot Modern",
        type: "offer",
        page: { width: 794, height: 1123 },
        elements: [
          { id: "items", type: "table", x: 40, y: 40, width: 500, height: 120, content: "offer" }
        ]
      }
    })

    assert.match(html, /Leistung \/ Umfang/)
    assert.match(html, /Angebot/)
  })
})
