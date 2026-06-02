import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { sendVerificationEmail } from "@/lib/auth/email-verification"
import { createInitialAdmin, mapAuthError } from "@/lib/auth/service"
import { assertSessionConfigured } from "@/lib/auth/session"
import { readEmailSettings } from "@/lib/email/delivery"
import { seedStarterWorkspace } from "@/lib/onboarding/starter-workspace"
import { RequestBodyError, readJsonBodyWithLimit } from "@/lib/http/request-body"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  return readJsonBodyWithLimit<Record<string, unknown>>(request)
}

export async function POST(request: Request) {
  try {
    assertSessionConfigured()
    const emailSettings = await readEmailSettings()
    const emailVerificationRequired = Boolean(emailSettings.provider && emailSettings.provider !== "disabled")
    const { user, verificationToken } = await createInitialAdmin(await parseBody(request), {
      requireEmailVerification: emailVerificationRequired
    })

    await seedStarterWorkspace().catch((error) => {
      console.warn("Starter workspace seeding skipped.", error)
    })

    if (verificationToken) {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken,
        request
      })
    }

    await writeAuditLog({
      action: "auth.setup",
      entity: "user",
      entityId: user.id,
      data: { email: user.email, role: user.role, verificationRequired: Boolean(verificationToken) }
    })

    return NextResponse.json({
      ok: true,
      user,
      verificationRequired: Boolean(verificationToken),
      message: verificationToken
        ? "Bitte bestaetige deine E-Mail-Adresse. Wir haben dir einen Aktivierungslink gesendet."
        : "Registrierung abgeschlossen. Du kannst dich jetzt anmelden."
    }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
