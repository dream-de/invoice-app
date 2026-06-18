import { NextResponse } from "next/server"
import { prisma, prismaDbNull } from "@dream-invoice/database"
import * as QRCode from "qrcode"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { createOtpAuthUri, createTwoFactorSecret } from "@/lib/auth/totp"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { isDemoMode } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const current = await requireCurrentUser()
    const secret = createTwoFactorSecret()
    if (!isDemoMode()) {
      await prisma.user.update({
        where: { id: current.id },
        data: { twoFactorSecret: secret, twoFactorEnabledAt: null, twoFactorBackupCodes: prismaDbNull }
      })
      await writeAuditLog({
        action: "account.2fa_setup",
        entity: "user",
        entityId: current.id,
        data: { email: current.email },
        requestMetadata: getAuditRequestMetadata(request)
      })
    }
    const otpAuthUri = createOtpAuthUri({ email: current.email, secret })
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    })

    return NextResponse.json({
      ok: true,
      secret,
      otpAuthUri,
      qrCodeDataUrl
    })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
