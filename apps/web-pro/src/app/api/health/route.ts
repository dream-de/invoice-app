import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    app: "dream-invoice-web-pro",
    status: "ok",
    runtime: process.env.DREAM_INVOICE_RUNTIME ?? "web-pro-preview",
    port: process.env.WEB_PRO_PORT ?? process.env.PORT ?? "3020",
    activationMode: process.env.LICENSE_ACTIVATION_MODE ?? "cloud",
    previewOnly: true,
    dashboardV2: "shared-web-runtime",
    licenseBilling: "prepared"
  })
}
