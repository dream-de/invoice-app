import { access, unlink, readFile } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { attachmentAbsolutePath, attachmentDownloadName } from "@/lib/attachments/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function contentDisposition(download: boolean, filename: string) {
  const type = download ? "attachment" : "inline"
  const safe = filename.replace(/\\/g, " ").replace(/\r|\n|\"/g, "")
  return `${type}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentUser()
    const { id } = await context.params
    const attachment = await prisma.attachment.findUnique({ where: { id } })

    if (!attachment) {
      return NextResponse.json({ ok: false, error: "Beleg wurde nicht gefunden." }, { status: 404 })
    }

    const filePath = attachmentAbsolutePath(attachment.storagePath)
    await access(filePath, fsConstants.R_OK)
    const body = await readFile(filePath)
    const download = new URL(request.url).searchParams.get("download") === "1"

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Length": String(body.length),
        "Content-Disposition": contentDisposition(download, attachmentDownloadName(attachment.originalName))
      }
    })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentUser()
    const { id } = await context.params
    const attachment = await prisma.attachment.findUnique({ where: { id } })

    if (!attachment) {
      return NextResponse.json({ ok: false, error: "Beleg wurde nicht gefunden." }, { status: 404 })
    }

    const filePath = attachmentAbsolutePath(attachment.storagePath)
    await unlink(filePath).catch(() => null)
    await prisma.attachment.delete({ where: { id: attachment.id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
