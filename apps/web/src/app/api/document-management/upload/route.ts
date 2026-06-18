import { createHash, randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { documentStorageFileName, documentStoragePath, documentStorageRoot, isAllowedBusinessDocument } from "@/lib/documents/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
const DOCUMENT_TYPES = new Set(["invoice", "offer", "contract", "delivery_note", "attachment", "project_file"])

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeDocumentType(value: string) {
  return DOCUMENT_TYPES.has(value) ? value : "attachment"
}

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File
}

export async function POST(request: Request) {
  try {
    const current = await requireCurrentUser()
    const formData = await request.formData()
    const file = formData.get("file")

    if (!isFile(file) || file.size <= 0) {
      return NextResponse.json({ ok: false, error: "Keine Datei erhalten." }, { status: 400 })
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ ok: false, error: "Die Datei ist zu gross." }, { status: 413 })
    }

    if (!isAllowedBusinessDocument(file)) {
      return NextResponse.json({ ok: false, error: "Erlaubt sind PDF, DOCX, XLSX, PNG und JPG." }, { status: 415 })
    }

    const id = randomUUID()
    const storageRoot = documentStorageRoot()
    const storagePath = documentStorageFileName(id, file)
    const absolutePath = documentStoragePath(id, file)
    const buffer = Buffer.from(await file.arrayBuffer())
    const checksum = createHash("sha256").update(buffer).digest("hex")
    const documentType = normalizeDocumentType(clean(formData.get("documentType")))
    const invoiceId = clean(formData.get("invoiceId")) || null
    const offerInvoiceId = clean(formData.get("offerInvoiceId")) || null

    await mkdir(storageRoot, { recursive: true })
    await writeFile(absolutePath, buffer)

    const document = await prisma.documentAsset.create({
      data: {
        id,
        name: clean(formData.get("name")) || file.name,
        originalName: file.name,
        documentType,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        checksum,
        version: Number(clean(formData.get("version"))) || 1,
        status: clean(formData.get("status")) || "open",
        customerId: clean(formData.get("customerId")) || null,
        projectId: clean(formData.get("projectId")) || null,
        invoiceId,
        offerInvoiceId,
        changeLog: [{ version: Number(clean(formData.get("version"))) || 1, note: "Initialer Upload", at: new Date().toISOString() }],
        createdById: current.id
      },
      include: {
        customer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true, type: true } }
      }
    })

    return NextResponse.json({ ok: true, document })
  } catch (error) {
    console.error("Document management upload failed", error)
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
