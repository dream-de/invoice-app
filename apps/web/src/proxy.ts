import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { evaluateAppRequestGuard } from "@dream-invoice/auth"

export async function proxy(request: NextRequest) {
  const isDemoMode = process.env.DREAM_INVOICE_DEMO_MODE === "true"
  const decision = await evaluateAppRequestGuard({
    method: request.method,
    url: request.url,
    headers: request.headers,
    env: process.env,
    basicAuthUserEnv: "DREAM_INVOICE_AUTH_USER",
    basicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD",
    basicAuthRequiredEnv: "DREAM_INVOICE_AUTH_REQUIRED",
    protectAppSession: !isDemoMode,
    sessionSecretEnv: "AUTH_SECRET",
    publicPaths: ["/login", "/api/auth"]
  })

  if (decision.allowed) return NextResponse.next()

  if (decision.redirectTo && !request.nextUrl.pathname.startsWith("/api/")) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = decision.redirectTo
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const headers = new Headers(decision.headers)
  headers.set("content-type", "application/json; charset=utf-8")

  return new NextResponse(
    JSON.stringify({ ok: false, error: decision.message }),
    { status: decision.status, headers }
  )
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|.*\\..*).*)"]
}
