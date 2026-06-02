import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { recognizePositionsFromFile } from "../recognize-positions"

describe("recognizePositionsFromFile", () => {
  it("recognizes positions from delimited text", async () => {
    const file = new File(
      [
        "Bezeichnung;Menge;Einzelpreis;Gesamt\n",
        "Dashboard Design;2;120,00;240,00\n",
        "Frontend Integration;5;80,00;400,00\n"
      ],
      "positionen.csv",
      { type: "text/csv" }
    )

    const result = await recognizePositionsFromFile(file)

    assert.equal(result.ok, true)
    assert.equal(result.positions.length, 2)
    assert.equal(result.positions[0]?.label, "Dashboard Design")
    assert.equal(result.positions[0]?.qty, 2)
    assert.equal(result.positions[0]?.netPrice, 120)
  })

  it("recognizes invoice-like text lines", async () => {
    const file = new File(
      [
        "Pos. Bezeichnung Menge Einzelpreis Gesamt\n",
        "1 Cloud Wartung 3 45,00 135,00\n",
        "2 UI Paket 1 850,00 850,00\n",
        "Gesamt 985,00\n"
      ],
      "rechnung.txt",
      { type: "text/plain" }
    )

    const result = await recognizePositionsFromFile(file)

    assert.equal(result.ok, true)
    assert.equal(result.positions.length, 2)
    assert.equal(result.positions[0]?.label, "Cloud Wartung")
    assert.equal(result.positions[0]?.qty, 3)
    assert.equal(result.positions[0]?.netPrice, 45)
    assert.equal(result.positions[1]?.label, "UI Paket")
  })
})
