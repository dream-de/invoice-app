import { createHash, randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { analyzeReceiptAttachment } from "@/lib/attachments/ocr"
import { attachmentDownloadName, attachmentStorageFileName, attachmentStoragePath, attachmentStorageRoot } from "@/lib/attachments/storage"
import { readImportFile, ImportUploadError } from "@/lib/import/upload"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

function serializeAttachment(attachment: {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  storagePath: string
  checksum: string | null
  expenseId: string | null
  createdById: string | null
  createdAt: Date
}) {
  return {
    id: attachment.id,
    filename: attachment.filename,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    storagePath: attachment.storagePath,
    checksum: attachment.checksum,
    expenseId: attachment.expenseId,
    createdById: attachment.createdById,
    createdAt: attachment.createdAt.toISOString(),
    downloadUrl: `/api/expenses/attachments/${attachment.id}`,
    viewUrl: `/api/expenses/attachments/${attachment.id}`,
    downloadFileName: attachmentDownloadName(attachment.originalName)
  }
}

export async function POST(request: Request) {
  try {
    const current = await requireCurrentUser()
    const { file } = await readImportFile(request, {
      allowedKinds: ["pdf", "image"],
      maxBytes: MAX_ATTACHMENT_BYTES
    })

    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      return NextResponse.json({ ok: false, error: "SVG-Dateien sind fuer Belege nicht erlaubt." }, { status: 415 })
    }

    const id = randomUUID()
    const storageRoot = attachmentStorageRoot()
    const storagePath = attachmentStorageFileName(id, file)
    const absolutePath = attachmentStoragePath(id, file)
    const buffer = Buffer.from(await file.arrayBuffer())
    const checksum = createHash("sha256").update(buffer).digest("hex")

    await mkdir(storageRoot, { recursive: true })
    await writeFile(absolutePath, buffer)

    const analysis = await analyzeReceiptAttachment(file)

    const attachment = await prisma.attachment.create({
      data: {
        id,
        filename: storagePath,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        checksum,
        createdById: current.id
      }
    })

    return NextResponse.json({ ok: true, attachment: serializeAttachment(attachment), ocr: analysis })
  } catch (error) {
    if (error instanceof ImportUploadError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }

    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
