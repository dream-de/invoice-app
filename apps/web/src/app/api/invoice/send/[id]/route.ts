import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"
import { appendEmailDeliveryLog } from "@/lib/email/delivery-log"
import { cleanString, isEmail, readEmailSettings, sendEmail } from "@/lib/email/delivery"

export const dynamic = "force-dynamic"

async function loadInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true
    }
  })
}

function statusForEmailError(message: string) {
  if (message.includes("Rechnung nicht gefunden")) return 404
  if (message.includes("PDF konnte")) return 500
  if (
    message.includes("deaktiviert") ||
    message.includes("fehlt") ||
    message.includes("gueltige") ||
    message.includes("Betreff")
  ) {
    return 400
  }

  return 502
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await request.json().catch(() => ({}))
  const to = cleanString(data.to)
  const subject = cleanString(data.subject)
  const message = cleanString(data.message)
  const settings = await readEmailSettings()
  let invoiceNumber: string | undefined

  try {
    if (!settings.provider || settings.provider === "disabled") {
      throw new Error("E-Mail-Versand ist deaktiviert. Bitte zuerst unter Einstellungen > E-Mail aktivieren.")
    }

    if (!isEmail(to)) {
      throw new Error("Bitte eine gueltige Empfaenger-E-Mail eintragen.")
    }

    if (!subject) {
      throw new Error("Bitte einen Betreff eintragen.")
    }

    const invoice = await loadInvoice(id)

    if (!invoice) {
      throw new Error("Rechnung nicht gefunden.")
    }

    invoiceNumber = invoice.number
    const pdfResponse = await fetch(new URL(`/api/invoice/pdf/${id}`, request.url), { cache: "no-store" })

    if (!pdfResponse.ok) {
      throw new Error("PDF konnte fuer den Versand nicht erstellt werden.")
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
    const result = await sendEmail({
      to,
      subject,
      text: message || `Anbei erhalten Sie Ihre Rechnung ${invoice.number}.`,
      attachments: [
        {
          filename: `${invoice.number}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    })

    await appendEmailDeliveryLog({
      type: "invoice",
      status: "success",
      provider: result.provider,
      to,
      subject,
      documentId: id,
      documentNumber: invoice.number,
      messageId: result.id
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "E-Mail konnte nicht gesendet werden."

    await appendEmailDeliveryLog({
      type: "invoice",
      status: "error",
      provider: settings.provider || "unknown",
      to,
      subject,
      documentId: id,
      documentNumber: invoiceNumber,
      error: errorMessage
    })

    return NextResponse.json({ ok: false, error: errorMessage }, { status: statusForEmailError(errorMessage) })
  }
}
