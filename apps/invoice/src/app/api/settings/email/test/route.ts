import { NextResponse } from "next/server"
import { appendEmailDeliveryLog } from "@/lib/email/delivery-log"
import { cleanString, readEmailSettings, sendEmail } from "@/lib/email/delivery"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const settings = await readEmailSettings()
  const data = await request.json().catch(() => ({}))
  const to = cleanString(data.to) || cleanString(settings.replyTo) || cleanString(settings.fromEmail)
  const subject = "Dream Invoice Test-E-Mail"

  try {
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
    const message = error instanceof Error ? error.message : "Test-E-Mail konnte nicht gesendet werden."
    const status = message.includes("deaktiviert") || message.includes("fehlt") || message.includes("gueltige") ? 400 : 502

    await appendEmailDeliveryLog({
      type: "test",
      status: "error",
      provider: settings.provider || "unknown",
      to,
      subject,
      error: message
    })

    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
