import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { evaluateAppRequestGuard } from "@dream-invoice/auth"
import { AUTH_REQUIRED } from "@/lib/auth/config"
import { validateRuntimeEnv } from "@/lib/env/runtime"

export async function proxy(request: NextRequest) {
  const runtimeEnv = validateRuntimeEnv(process.env)
  if (!runtimeEnv.valid) {
    return new NextResponse(
      JSON.stringify({
        ok: false,
        error: "Runtime environment is not configured securely.",
        code: "runtime_env_invalid"
      }),
      {
        status: 503,
        headers: {
          "content-type": "application/json; charset=utf-8"
        }
      }
    )
  }

  const portalPath = request.nextUrl.pathname
  if (
    portalPath.startsWith("/portal") &&
    !portalPath.startsWith("/portal/login") &&
    !portalPath.startsWith("/portal/invite") &&
    !request.cookies.has("dream_invoice_customer_portal")
  ) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/portal/login"
    return NextResponse.redirect(loginUrl)
  }

  const isDemoMode = process.env.DREAM_INVOICE_DEMO_MODE === "true"
  const decision = await evaluateAppRequestGuard({
    method: request.method,
    url: request.url,
    headers: request.headers,
    env: process.env,
    basicAuthUserEnv: "DREAM_INVOICE_AUTH_USER",
    basicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD",
    basicAuthRequiredEnv: "DREAM_INVOICE_AUTH_REQUIRED",
    defaultBasicAuthRequired: AUTH_REQUIRED,
    protectAppSession: AUTH_REQUIRED && !isDemoMode,
    sessionSecretEnv: "AUTH_SECRET",
    publicPaths: [
      "/login",
      "/api/auth",
      "/api/invoice/preview-pdf",
      "/portal",
      "/api/portal",
      "/api/payments/webhooks",
      "/api/v1",
      "/api/invoice/pdf",
      "/api/offer/pdf"
    ]
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
