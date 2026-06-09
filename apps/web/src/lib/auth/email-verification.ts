import { createHash, randomBytes } from "node:crypto"
import { sendEmail } from "@/lib/email/delivery"

export const EMAIL_VERIFICATION_TTL_HOURS = 24

export function createEmailVerificationToken() {
  const token = randomBytes(32).toString("base64url")
  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000)
  }
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function getAppUrl(request?: Request) {
  const configured = String(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").trim()
  if (configured) return configured.replace(/\/+$/g, "")

  if (request) {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
  }

  return "http://localhost:3010"
}

export async function sendVerificationEmail(input: {
  to: string
  name?: string | null
  token: string
  request?: Request
}) {
  const appUrl = getAppUrl(input.request)
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(input.token)}`
  const greeting = input.name ? `Hallo ${input.name},` : "Hallo,"

  await sendEmail({
    to: input.to,
    subject: "Dream Invoice E-Mail bestaetigen",
    text: [
      greeting,
      "",
      "bitte bestaetige deine E-Mail-Adresse, um dein Dream Invoice Konto zu aktivieren.",
      "",
      verificationUrl,
      "",
      "Der Link ist 24 Stunden gueltig.",
      "",
      "Wenn du diese Registrierung nicht gestartet hast, kannst du diese E-Mail ignorieren."
    ].join("\n")
  })
}
