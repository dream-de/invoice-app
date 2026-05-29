import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { appendEmailDeliveryLog, maskEmailAddress } from "@/lib/email/delivery-log"
import { cleanString, isEmail, readEmailSettings, sendEmail, type EmailSettings } from "@/lib/email/delivery"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { documents } from "@/data/invoice-data"

export const dynamic = "force-dynamic"

async function loadInvoice(id: string) {
  if (isDemoMode()) {
    const document = documents.find((item) => item.id === id) ?? documents[0]
    return document
      ? {
          id: document.id,
          number: document.number,
          customer: {
            email: document.customerEmail,
            name: document.customer
          }
        }
      : null
  }

  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true
    }
  })
}

function statusForEmailError(message: string) {
  if (message.includes("Anmeldung erforderlich")) return 401
  if (message.includes("Keine Berechtigung")) return 403
  if (message.includes("Rechnung nicht gefunden")) return 404
  if (message.includes("PDF konnte")) return 500
  if (
    message.includes("deaktiviert") ||
    message.includes("fehlt") ||
    message.includes("gueltige") ||
    message.includes("Betreff") ||
    message.includes("Ungueltige Anfrage")
  ) {
    return 400
  }

  return 502
}

async function requireInvoicePermission(action: "pdf") {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", action)) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Rechnungsaktion.", 403)
  }

  return user
}

function assertSameOriginRequest(request: Request) {
  const requestUrl = new URL(request.url)
  const source = request.headers.get("origin") ?? request.headers.get("referer")

  if (!source) {
    throw new AuthServiceError("invalid_origin", "Ungueltige Anfragequelle.", 403)
  }

  let sourceOrigin: string
  try {
    sourceOrigin = new URL(source).origin
  } catch {
    throw new AuthServiceError("invalid_origin", "Ungueltige Anfragequelle.", 403)
  }

  if (sourceOrigin !== requestUrl.origin) {
    throw new AuthServiceError("invalid_origin", "Ungueltige Anfragequelle.", 403)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let to = ""
  let subject = ""
  let settings: EmailSettings | { provider: "unknown" } = { provider: "unknown" }
  let invoiceNumber: string | undefined

  try {
    assertSameOriginRequest(request)

    if (process.env.DATABASE_URL && !isDemoMode()) {
      await requireInvoicePermission("pdf")
    }

    const data = await request.json().catch(() => {
      throw new AuthServiceError("invalid_request", "Ungueltige JSON-Anfrage.", 400)
    })

    to = cleanString(data.to)
    subject = cleanString(data.subject)
    const message = cleanString(data.message)
    settings = isDemoMode() ? { provider: "unknown" } : await readEmailSettings()

    if (!isDemoMode() && (!settings.provider || settings.provider === "disabled")) {
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
    const pdfResponse = await fetch(new URL("/api/invoice/pdf/" + id, request.url), {
      cache: "no-store",
      headers: {
        cookie: request.headers.get("cookie") ?? ""
      }
    })

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text().catch(() => "unknown")
      console.error("PDF generation failed for invoice email.", {
        invoiceId: id,
        status: pdfResponse.status,
        body: errorText.slice(0, 1_000)
      })
      throw new Error("PDF konnte fuer den Versand nicht erstellt werden. Status: " + pdfResponse.status)
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
    const result = isDemoMode()
      ? { provider: "unknown" as const, id: "demo-email-" + Date.now() }
      : await sendEmail({
          to,
          subject,
          text: message || "Anbei erhalten Sie Ihre Rechnung " + invoice.number + ".",
          attachments: [
            {
              filename: invoice.number + ".pdf",
              content: pdfBuffer,
              contentType: "application/pdf"
            }
          ]
        })

    await appendEmailDeliveryLog({
      type: "invoice",
      status: "success",
      provider: result.provider,
      to: maskEmailAddress(to),
      subject,
      documentId: id,
      documentNumber: invoice.number,
      messageId: result.id
    })

    return NextResponse.json(isDemoMode()
      ? demoModeResponse({ ok: true, ...result, message: "Demo: E-Mail-Versand wurde simuliert." })
      : { ok: true, ...result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "E-Mail konnte nicht gesendet werden."
    const mapped = error instanceof AuthServiceError ? mapAuthError(error) : null

    await appendEmailDeliveryLog({
      type: "invoice",
      status: "error",
      provider: settings.provider || "unknown",
      to: maskEmailAddress(to),
      subject,
      documentId: id,
      documentNumber: invoiceNumber,
      error: errorMessage
    })

    return NextResponse.json(
      {
        ok: false,
        error: mapped?.error ?? errorMessage,
        ...(mapped ? { code: mapped.code } : {})
      },
      { status: mapped?.status ?? statusForEmailError(errorMessage) }
    )
  }
}
