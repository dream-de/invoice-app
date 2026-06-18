import { NextResponse } from "next/server"
import { clearCustomerPortalSession } from "@/lib/customer-portal/auth"

export async function POST() {
  await clearCustomerPortalSession()
  return NextResponse.json({ ok: true })
}
