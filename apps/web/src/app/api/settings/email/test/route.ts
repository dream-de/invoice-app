import { NextResponse } from "next/server"
import { appendEmailDeliveryLog } from "@/lib/email/delivery-log"
import { cleanString, readEmailSettings, sendEmail } from "@/lib/email/delivery"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

export async function POST(request: Request) {
  try {
    await requireCurrentUserRole(["admin"])

    const settings = await readEmailSettings()
    const data = await request.json().catch(() => ({}))
    const to = cleanString(data.to) || cleanString(settings.replyTo) || cleanString(settings.fromEmail)
    const subject = "Dream Invoice Test-E-Mail"
    const result = await sendEmail({
      to,
      subject,
      text: "Diese Test-E-Mail bestaetigt, dass der E-Mail-Versand in Dream Invoice erreichbar ist."
    })

    await appendEmailDeliveryLog({
      type: "test",
      status: "success",
      provider: result.provider,
      to,
      subject,
      messageId: result.id
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    const message = error instanceof Error ? error.message : "Test-E-Mail konnte nicht gesendet werden."
    const status = message.includes("deaktiviert") || message.includes("fehlt") || message.includes("gueltige") ? 400 : 502

    await appendEmailDeliveryLog({
      type: "test",
      status: "error",
      provider: "unknown",
      to: "",
      subject: "Dream Invoice Test-E-Mail",
      error: message
    })

    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
