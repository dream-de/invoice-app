import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createCsvContent, createCsvContentDisposition, createCsvResponse } from "../csv-response"

describe("csv export response", () => {
  it("quotes cells and escapes embedded quotes", () => {
    assert.equal(
      createCsvContent([
        ["Name", "Kommentar"],
        ["Aurora Labs GmbH", "Text mit \"Zitat\""]
      ]),
      '"Name";"Kommentar"\n"Aurora Labs GmbH";"Text mit ""Zitat"""'
    )
  })

  it("escapes spreadsheet formulas", () => {
    assert.equal(
      createCsvContent([["Wert"], ["=SUM(1,1)"], ["+1"], ["@cmd"], ["-10"]]),
      `"Wert"\n"'=SUM(1,1)"\n"'+1"\n"'@cmd"\n"'-10"`
    )
  })

  it("creates browser friendly content disposition headers", () => {
    assert.equal(
      createCsvContentDisposition("kunden-export-äöü.csv"),
      'attachment; filename="kunden-export-aou.csv"; filename*=UTF-8\'\'kunden-export-%C3%A4%C3%B6%C3%BC.csv'
    )
  })

  it("creates a UTF-8 CSV response with no-store headers", async () => {
    const response = createCsvResponse([["Name"], ["Müller"]], "kunden-export.csv")
    const bytes = new Uint8Array(await response.arrayBuffer())
    const body = new TextDecoder("utf-8").decode(bytes.slice(3))

    assert.equal(response.headers.get("Content-Type"), "text/csv; charset=utf-8")
    assert.equal(response.headers.get("Cache-Control"), "no-store")
    assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="kunden-export.csv"; filename*=UTF-8\'\'kunden-export.csv')
    assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xef, 0xbb, 0xbf])
    assert.equal(body, '"Name"\n"Müller"')
  })
})
