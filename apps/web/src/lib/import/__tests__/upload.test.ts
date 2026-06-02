import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ImportUploadError, isAllowedImportFile, readImportFile } from "../upload"

function uploadRequest(file: File, headers: Record<string, string> = {}) {
  const formData = new FormData()
  formData.append("file", file)

  return new Request("https://invoice.test/api/import/recipient", {
    method: "POST",
    headers,
    body: formData
  })
}

describe("import upload guard", () => {
  it("accepts allowed text, csv, pdf, and image file types", () => {
    assert.equal(isAllowedImportFile(new File(["a"], "demo.txt", { type: "text/plain" }), ["text"]), true)
    assert.equal(isAllowedImportFile(new File(["a"], "demo.csv", { type: "text/csv" }), ["csv"]), true)
    assert.equal(isAllowedImportFile(new File(["a"], "demo.pdf", { type: "application/pdf" }), ["pdf"]), true)
    assert.equal(isAllowedImportFile(new File(["a"], "demo.png", { type: "image/png" }), ["image"]), true)
  })

  it("rejects unsupported file types", () => {
    assert.equal(isAllowedImportFile(new File(["a"], "demo.exe", { type: "application/octet-stream" }), ["text", "csv"]), false)
  })

  it("rejects empty uploads", async () => {
    await assert.rejects(
      readImportFile(uploadRequest(new File([], "empty.txt", { type: "text/plain" })), { allowedKinds: ["text"] }),
      (error) => error instanceof ImportUploadError && error.code === "missing_file" && error.status === 400
    )
  })

  it("rejects oversized declared content-length before parsing multipart data", async () => {
    await assert.rejects(
      readImportFile(
        uploadRequest(new File(["a"], "demo.txt", { type: "text/plain" }), { "content-length": String(9 * 1024 * 1024) }),
        { allowedKinds: ["text"], maxBytes: 1024 }
      ),
      (error) => error instanceof ImportUploadError && error.code === "file_too_large" && error.status === 413
    )
  })
})
