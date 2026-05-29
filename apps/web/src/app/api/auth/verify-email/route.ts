import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { hashEmailVerificationToken } from "@/lib/auth/email-verification"
import { isDemoMode } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = String(url.searchParams.get("token") ?? "").trim()
  const loginUrl = new URL("/login", url.origin)

  if (isDemoMode()) {
    loginUrl.pathname = "/dashboard"
    loginUrl.searchParams.set("mode", "demo")
    return NextResponse.redirect(loginUrl)
  }

  if (!token) {
    loginUrl.searchParams.set("verified", "invalid")
    return NextResponse.redirect(loginUrl)
  }

  const tokenHash = hashEmailVerificationToken(token)
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: { gt: new Date() }
    }
  })

  if (!user) {
    loginUrl.searchParams.set("verified", "invalid")
    return NextResponse.redirect(loginUrl)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: "active",
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null
    }
  })

  await writeAuditLog({
    action: "auth.email_verify",
    entity: "user",
    entityId: updated.id,
    data: { email: updated.email, role: updated.role }
  })

  loginUrl.searchParams.set("verified", "1")
  return NextResponse.redirect(loginUrl)
}
