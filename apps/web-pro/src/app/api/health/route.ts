import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    app: "dream-invoice-web-pro",
    status: "ok",
    runtime: "prepared"
  })
}
