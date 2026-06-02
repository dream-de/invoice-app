import { execFile } from "node:child_process"
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { fileToText, normalizeText } from "./text"

const execFileAsync = promisify(execFile)

type ExtractionResult = {
  ok: boolean
  text: string
  warnings: string[]
  unsupported?: boolean
}

function fileName(file: File) {
  return file.name.toLowerCase()
}

function extensionFor(file: File) {
  const name = fileName(file)
  const extension = name.match(/\.([a-z0-9]+)$/)?.[1]
  return extension ? `.${extension}` : ""
}

function isTextLike(file: File) {
  const name = fileName(file)
  return file.type.includes("text") || file.type.includes("csv") || name.endsWith(".txt") || name.endsWith(".csv")
}

function isPdf(file: File) {
  return file.type === "application/pdf" || fileName(file).endsWith(".pdf")
}

function isImage(file: File) {
  const name = fileName(file)
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(name)
}

function toolMissing(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

async function fileBuffer(file: File) {
  return Buffer.from(await file.arrayBuffer())
}

async function withTempDir<T>(fn: (dir: string) => Promise<T>) {
  const dir = await mkdtemp(join(tmpdir(), "dream-invoice-ocr-"))
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function writeTempFile(file: File, dir: string) {
  const path = join(dir, `upload${extensionFor(file) || ".bin"}`)
  await writeFile(path, await fileBuffer(file))
  return path
}

async function extractPdfText(path: string) {
  const { stdout } = await execFileAsync("pdftotext", ["-layout", "-enc", "UTF-8", path, "-"], {
    maxBuffer: 10 * 1024 * 1024
  })
  return normalizeText(stdout)
}

async function ocrImage(path: string) {
  const { stdout } = await execFileAsync("tesseract", [path, "stdout", "-l", "deu+eng", "--psm", "6"], {
    maxBuffer: 10 * 1024 * 1024
  })
  return normalizeText(stdout)
}

async function ocrPdf(path: string, dir: string) {
  const prefix = join(dir, "page")
  await execFileAsync("pdftoppm", ["-r", "220", "-png", "-f", "1", "-l", "3", path, prefix], {
    maxBuffer: 10 * 1024 * 1024
  })

  const pages = (await readdir(dir))
    .filter((name) => /^page-\d+\.png$/.test(name))
    .sort()

  const texts = []
  for (const page of pages) {
    texts.push(await ocrImage(join(dir, page)))
  }

  return normalizeText(texts.join("\n"))
}

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  if (isTextLike(file)) {
    return {
      ok: true,
      text: normalizeText(await fileToText(file)),
      warnings: []
    }
  }

  if (isImage(file)) {
    return withTempDir(async (dir) => {
      try {
        const path = await writeTempFile(file, dir)
        const text = await ocrImage(path)

        return {
          ok: Boolean(text),
          text,
          warnings: text ? [] : ["Im Bild wurde kein Text erkannt."]
        }
      } catch (error) {
        return {
          ok: false,
          text: "",
          warnings: [
            toolMissing(error)
              ? "Lokale OCR ist im Container nicht installiert. Installiere Tesseract oder nutze das Dream-Invoice Docker-Image mit OCR-Unterstuetzung."
              : "Das Bild konnte nicht per OCR ausgelesen werden."
          ]
        }
      }
    })
  }

  if (isPdf(file)) {
    return withTempDir(async (dir) => {
      const path = await writeTempFile(file, dir)
      const warnings: string[] = []

      try {
        const text = await extractPdfText(path)
        if (text.length >= 20) {
          return { ok: true, text, warnings }
        }
        warnings.push("PDF enthaelt keinen klaren Textlayer. OCR wurde versucht.")
      } catch (error) {
        warnings.push(
          toolMissing(error)
            ? "PDF-Textwerkzeug fehlt. OCR wurde versucht."
            : "PDF-Textlayer konnte nicht ausgelesen werden. OCR wurde versucht."
        )
      }

      try {
        const text = await ocrPdf(path, dir)
        return {
          ok: Boolean(text),
          text,
          warnings: text ? warnings : [...warnings, "Im PDF wurde kein Text erkannt."]
        }
      } catch (error) {
        return {
          ok: false,
          text: "",
          warnings: [
            ...warnings,
            toolMissing(error)
              ? "Lokale PDF-OCR ist im Container nicht vollstaendig installiert. Installiere Poppler und Tesseract oder nutze das Dream-Invoice Docker-Image mit OCR-Unterstuetzung."
              : "Das PDF konnte nicht per OCR ausgelesen werden."
          ]
        }
      }
    })
  }

  return {
    ok: false,
    text: "",
    warnings: ["Dieser Dateityp wird noch nicht ausgelesen. Aktuell sind TXT, CSV, PDF und Bilder aktiv."],
    unsupported: true
  }
}
