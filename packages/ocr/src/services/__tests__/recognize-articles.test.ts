import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { recognizeArticlesFromFile } from "../recognize-articles"

describe("recognizeArticlesFromFile", () => {
  it("recognizes German article CSV exports", async () => {
    const file = new File(
      ["Artikelnummer;Artikel;Kategorie;Nettopreis;Einheit;MwSt\nAR-T01;Test Leistung;Service;99,50;Stk;19\n"],
      "artikel-import.csv",
      { type: "text/csv" }
    )

    const result = await recognizeArticlesFromFile(file)

    assert.equal(result.ok, true)
    assert.equal(result.fileName, "artikel-import.csv")
    assert.equal(result.articles.length, 1)
    assert.deepEqual(result.articles[0], {
      name: "Test Leistung",
      number: "AR-T01",
      category: "Service",
      unit: "Stk",
      description: "",
      netPrice: 99.5,
      vatRate: 19,
      confidence: 0.92
    })
  })

  it("rejects unsupported file types without pretending to import them", async () => {
    const file = new File(["not a csv"], "artikel.pdf", { type: "application/pdf" })

    const result = await recognizeArticlesFromFile(file)

    assert.equal(result.ok, false)
    assert.equal(result.unsupported, true)
    assert.equal(result.articles.length, 0)
  })

  it("reports empty tables clearly", async () => {
    const file = new File(["Artikelnummer;Artikel;Nettopreis\n"], "leer.csv", { type: "text/csv" })

    const result = await recognizeArticlesFromFile(file)

    assert.equal(result.ok, false)
    assert.deepEqual(result.warnings, ["Keine Tabellenzeilen erkannt."])
  })
})
