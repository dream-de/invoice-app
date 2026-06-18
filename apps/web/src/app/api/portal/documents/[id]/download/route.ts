import { constants as fsConstants } from "node:fs"
import { access, readFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { attachmentAbsolutePath, attachmentDownloadName } from "@/lib/attachments/storage"
import { portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function contentDisposition(filename: string) {
  const safe = filename.replace(/\\/g, " ").replace(/\r|\n|\"/g, "")
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const customer = await requirePortalCustomer()
    const { id } = await context.params
    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        expense: {
          project: {
            customerId: customer.id
          }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json({ ok: false, error: "Dokument wurde nicht gefunden." }, { status: 404 })
    }

    const filePath = attachmentAbsolutePath(attachment.storagePath)
    await access(filePath, fsConstants.R_OK)
    const body = await readFile(filePath)

    return new NextResponse(body, {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Length": String(body.length),
        "Content-Disposition": contentDisposition(attachmentDownloadName(attachment.originalName))
      }
    })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Dokument konnte nicht heruntergeladen werden." }, { status: 500 })
  }
}
