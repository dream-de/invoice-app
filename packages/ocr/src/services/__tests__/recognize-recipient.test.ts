import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { recognizeRecipientFromFile } from "../recognize-recipient"

describe("recognizeRecipientFromFile", () => {
  it("recognizes recipient data from text files", async () => {
    const file = new File(
      [
        "Polar Digital GmbH\n",
        "Mira Keller\n",
        "Lindenallee 42\n",
        "50667 Koeln\n",
        "rechnung@polar.example\n",
        "DE123456789\n"
      ],
      "empfaenger.txt",
      { type: "text/plain" }
    )

    const result = await recognizeRecipientFromFile(file)

    assert.equal(result.ok, true)
    assert.equal(result.recipient?.company, "Polar Digital GmbH")
    assert.equal(result.recipient?.contact, "Mira Keller")
    assert.equal(result.recipient?.street, "Lindenallee 42")
    assert.equal(result.recipient?.zip, "50667")
    assert.equal(result.recipient?.city, "Koeln")
    assert.equal(result.recipient?.email, "rechnung@polar.example")
    assert.equal(result.recipient?.vatId, "DE123456789")
  })


  it("splits company address lines into clean recipient fields", async () => {
    const file = new File(
      [
        "Nordlicht Handel GmbH, Marktweg 14, 14974 Ludwigsfelde\n",
        "Klarfeld Service GmbH\n",
        "kontakt@nordlicht.example\n",
        "DE308735227\n"
      ],
      "rechnung.pdf",
      { type: "text/plain" }
    )

    const result = await recognizeRecipientFromFile(file)

    assert.equal(result.ok, true)
    assert.equal(result.recipient?.company, "Nordlicht Handel GmbH")
    assert.equal(result.recipient?.contact, "")
    assert.equal(result.recipient?.street, "Marktweg 14")
    assert.equal(result.recipient?.zip, "14974")
    assert.equal(result.recipient?.city, "Ludwigsfelde")
    assert.equal(result.recipient?.email, "kontakt@nordlicht.example")
    assert.equal(result.recipient?.vatId, "DE308735227")
  })

  it("keeps a real person as optional contact", async () => {
    const file = new File(
      [
        "Polar Digital GmbH\n",
        "Mira Keller\n",
        "Lindenallee 42\n",
        "50667 Koeln\n"
      ],
      "empfaenger.txt",
      { type: "text/plain" }
    )

    const result = await recognizeRecipientFromFile(file)

    assert.equal(result.ok, true)
    assert.equal(result.recipient?.company, "Polar Digital GmbH")
    assert.equal(result.recipient?.contact, "Mira Keller")
  })

  it("rejects unsupported office files clearly", async () => {
    const file = new File(["not a real docx"], "empfaenger.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    })

    const result = await recognizeRecipientFromFile(file)

    assert.equal(result.ok, false)
    assert.equal(result.unsupported, true)
    assert.match(result.warnings[0], /TXT, CSV, PDF und Bilder/)
  })
})
