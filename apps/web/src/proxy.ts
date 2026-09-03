import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { evaluateAppRequestGuard } from "@dream-invoice/auth"
import { validateRuntimeEnv } from "@/lib/env/runtime"

function envFlag(value: string | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  return false
}

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

  const isDemoMode = process.env.DREAM_INVOICE_DEMO_MODE === "true"
  const authRequired = envFlag(process.env.DREAM_INVOICE_AUTH_REQUIRED)
  const decision = await evaluateAppRequestGuard({
    method: request.method,
    url: request.url,
    headers: request.headers,
    env: process.env,
    basicAuthUserEnv: "DREAM_INVOICE_AUTH_USER",
    basicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD",
    basicAuthRequiredEnv: "DREAM_INVOICE_AUTH_REQUIRED",
    defaultBasicAuthRequired: authRequired,
    protectAppSession: authRequired && !isDemoMode,
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
