import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { SETUP_PROTECTED } from "@/lib/auth/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const userCount = await prisma.user.count()

  return NextResponse.json({
    ok: true,
    setupAvailable: !SETUP_PROTECTED && userCount === 0,
    userCount
  })
}
