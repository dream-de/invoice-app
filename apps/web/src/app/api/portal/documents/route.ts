import { NextResponse } from "next/server"
import { date, getPortalAttachments } from "@/lib/customer-portal/data"
import { portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const customer = await requirePortalCustomer()
    const attachments = await getPortalAttachments(customer.id)
    return NextResponse.json({
      ok: true,
      documents: attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        project: attachment.expense?.project?.name ?? "-",
        createdAt: date(attachment.createdAt),
        downloadUrl: `/api/portal/documents/${attachment.id}/download`
      }))
    })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Dokumente konnten nicht geladen werden." }, { status: 500 })
  }
}
