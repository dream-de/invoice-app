import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { sendVerificationEmail } from "@/lib/auth/email-verification"
import { createInitialAdmin, mapAuthError } from "@/lib/auth/service"
import { assertSessionConfigured } from "@/lib/auth/session"
import { readEmailSettings } from "@/lib/email/delivery"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function parseBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  try {
    assertSessionConfigured()
    const emailSettings = await readEmailSettings()
    if (!emailSettings.provider || emailSettings.provider === "disabled") {
      return NextResponse.json(
        { ok: false, error: "Bitte zuerst den E-Mail-Versand konfigurieren, damit die Registrierung bestaetigt werden kann.", code: "email_delivery_required" },
        { status: 409 }
      )
    }

    const { user, verificationToken } = await createInitialAdmin(await parseBody(request))
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
      request
    })

    await writeAuditLog({
      action: "auth.setup",
      entity: "user",
      entityId: user.id,
      data: { email: user.email, role: user.role }
    })

    return NextResponse.json({
      ok: true,
      user,
      verificationRequired: true,
      message: "Bitte bestaetige deine E-Mail-Adresse. Wir haben dir einen Aktivierungslink gesendet."
    }, { status: 201 })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
