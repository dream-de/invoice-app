import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { evaluateRequestGuard } from "@dream-invoice/auth"

export function proxy(request: NextRequest) {
  const decision = evaluateRequestGuard({
    method: request.method,
    url: request.url,
    headers: request.headers,
    env: process.env,
    basicAuthUserEnv: "DREAM_INVOICE_ADMIN_USER",
    basicAuthPasswordEnv: "DREAM_INVOICE_ADMIN_PASSWORD",
    basicAuthRequiredEnv: "DREAM_INVOICE_ADMIN_AUTH_REQUIRED",
    fallbackBasicAuthUserEnv: "DREAM_INVOICE_AUTH_USER",
    fallbackBasicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD",
    defaultBasicAuthRequired: process.env.NODE_ENV === "production",
    protectMutatingApiSameOrigin: true
  })

  if (decision.allowed) return NextResponse.next()

  const headers = new Headers(decision.headers)
  headers.set("content-type", "application/json; charset=utf-8")

  return new NextResponse(
    JSON.stringify({ ok: false, error: decision.message }),
    { status: decision.status, headers }
  )
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
}
