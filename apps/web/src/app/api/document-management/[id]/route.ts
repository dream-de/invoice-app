import { access, readFile } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { documentAbsolutePath, documentDownloadName } from "@/lib/documents/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function contentDisposition(download: boolean, filename: string) {
  const type = download ? "attachment" : "inline"
  const safe = filename.replace(/\\/g, " ").replace(/\r|\n|\"/g, "")
  return `${type}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentUser()
    const { id } = await context.params
    const document = await prisma.documentAsset.findUnique({ where: { id } })

    if (!document) {
      return NextResponse.json({ ok: false, error: "Dokument wurde nicht gefunden." }, { status: 404 })
    }

    const filePath = documentAbsolutePath(document.storagePath)
    await access(filePath, fsConstants.R_OK)
    const body = await readFile(filePath)
    const download = new URL(request.url).searchParams.get("download") === "1"

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Length": String(body.length),
        "Content-Disposition": contentDisposition(download, documentDownloadName(document.originalName))
      }
    })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentUser()
    const { id } = await context.params
    const data = await request.json().catch(() => ({}))
    const document = await prisma.documentAsset.update({
      where: { id },
      data: {
        name: clean(data.name) || undefined,
        documentType: clean(data.documentType) || undefined,
        status: clean(data.status) || undefined,
        customerId: clean(data.customerId) || null,
        projectId: clean(data.projectId) || null,
        invoiceId: clean(data.invoiceId) || null,
        offerInvoiceId: clean(data.offerInvoiceId) || null,
        version: Number(data.version) || undefined
      }
    })

    return NextResponse.json({ ok: true, document })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
